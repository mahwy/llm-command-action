import * as core from '@actions/core'
import * as github from '@actions/github'
import { loadConfig, getCommandsToRun } from './config.js'
import { GitHubService } from './github.js'
import { CommandExecutor } from './executor.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const commandsInput = core.getInput('commands', { required: true })
    const githubToken =
      core.getInput('github_token') || process.env.GITHUB_TOKEN
    const commandFromComment = core.getInput('command_from_comment') === 'true'

    if (!githubToken) {
      throw new Error('GitHub token is required')
    }

    core.info(`Event: ${github.context.eventName}`)
    core.info(
      `Repository: ${github.context.repo.owner}/${github.context.repo.repo}`
    )

    const githubService = new GitHubService(githubToken, github.context)
    const executor = new CommandExecutor(githubService)

    const config = await loadConfig(process.cwd())
    core.info(
      `Loaded configuration with ${Object.keys(config.commands).length} commands`
    )

    let requestedCommands: string[]
    if (commandFromComment && github.context.eventName === 'issue_comment') {
      requestedCommands = parseCommandFromComment(
        (github.context.payload as { comment?: { body: string } }).comment
          ?.body || '',
        config.handle
      )
    } else {
      requestedCommands = commandsInput
        .split(',')
        .map((cmd) => cmd.trim())
        .filter((cmd) => cmd)
    }

    if (requestedCommands.length === 0) {
      core.warning('No commands specified or found in comment')
      return
    }

    const commandsToRun = getCommandsToRun(config, requestedCommands)
    if (commandsToRun.length === 0) {
      core.warning(
        `No valid commands found. Available commands: ${Object.keys(config.commands).join(', ')}`
      )
      return
    }

    core.info(`Commands to execute: ${commandsToRun.join(', ')}`)

    const prInfo = await githubService.getPullRequestInfo()
    if (!prInfo) {
      core.warning(
        'Not in a pull request context - some features may be limited'
      )
      core.setOutput('executed_commands', JSON.stringify([]))
      core.setOutput(
        'commands_summary',
        'No commands executed - not in PR context'
      )
      return
    }

    const changedFiles = await githubService.getChangedFiles(prInfo)
    core.info(
      `Found ${changedFiles.length} changed files in PR #${prInfo.number}`
    )

    const executedCommands: string[] = []
    const summaries: string[] = []

    for (const commandName of commandsToRun) {
      try {
        const commandConfig = config.commands[commandName]
        await executor.executeCommand(
          commandName,
          commandConfig,
          changedFiles,
          prInfo
        )
        executedCommands.push(commandName)
        summaries.push(`✅ ${commandName}: ${commandConfig.description}`)
        core.info(`Successfully executed command: ${commandName}`)
      } catch (error) {
        summaries.push(
          `❌ ${commandName}: Failed - ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        core.error(`Failed to execute command ${commandName}: ${error}`)
      }
    }

    core.setOutput('executed_commands', JSON.stringify(executedCommands))
    core.setOutput('commands_summary', summaries.join('\n'))

    if (executedCommands.length === 0) {
      core.setFailed('No commands were executed successfully')
    } else {
      core.info(
        `Successfully executed ${executedCommands.length} of ${commandsToRun.length} commands`
      )
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unknown error occurred')
    }
  }
}

function parseCommandFromComment(
  commentBody: string,
  handle?: string
): string[] {
  const commands: string[] = []

  if (handle) {
    const handleRegex = new RegExp(
      `${handle.replace('@', '')}\\s+"([^"]+)"`,
      'i'
    )
    const handleMatch = commentBody.match(handleRegex)
    if (handleMatch) {
      return [handleMatch[1].trim()]
    }
  }

  const slashCommandRegex = /\/([a-zA-Z0-9_-]+)/g
  let match
  while ((match = slashCommandRegex.exec(commentBody)) !== null) {
    commands.push(match[1])
  }

  return commands
}
