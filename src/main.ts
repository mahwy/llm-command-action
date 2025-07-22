import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  loadConfig,
  getCommandsToRun,
  getCommentEnabledCommands
} from './config.js'
import { GitHubService } from './github.js'
import { CommandExecutor } from './executor.js'
import { PullRequestInfo } from './types.js'
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
    const configPath = core.getInput('config_path') || '.llm-commands.yaml'
    const debug = core.getInput('debug') === 'true'

    if (!githubToken) {
      throw new Error('GitHub token is required')
    }

    core.info(`Event: ${github.context.eventName}`)
    core.info(
      `Repository: ${github.context.repo.owner}/${github.context.repo.repo}`
    )

    const githubService = new GitHubService(githubToken, github.context)

    const config = await loadConfig(process.cwd(), configPath)
    const executor = new CommandExecutor(
      githubService,
      config['llm-clients'] || [],
      debug
    )
    core.info(
      `Loaded configuration with ${Object.keys(config.commands).length} commands`
    )

    let requestedCommands: string[]
    if (github.context.eventName === 'issue_comment') {
      // Validate that this is a PR comment, not an issue comment
      const payload = github.context.payload as {
        issue?: { pull_request?: object }
        comment?: { body: string }
      }

      if (!payload.issue?.pull_request) {
        core.info('Comment is not on a pull request, skipping')
        return
      }

      requestedCommands = parseCommandFromComment(
        payload.comment?.body || '',
        config.handle
      )
    } else {
      requestedCommands = commandsInput
        .split(/[,\n]/)
        .map((cmd) => cmd.trim())
        .filter((cmd) => cmd)
    }

    if (requestedCommands.length === 0) {
      core.warning('No commands specified or found in comment')
      return
    }

    const fromComment = github.context.eventName === 'issue_comment'
    const commandsToRun = getCommandsToRun(
      config,
      requestedCommands,
      fromComment
    )
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

    // Auto-post available slash commands on PR open (not for comment events)
    if (
      github.context.eventName === 'pull_request' &&
      github.context.payload.action === 'opened'
    ) {
      const commentEnabledCommands = getCommentEnabledCommands(config)
      if (commentEnabledCommands.length > 0) {
        await postAvailableCommandsComment(
          githubService,
          commentEnabledCommands,
          prInfo,
          config.handle
        )
      }
    }

    const changedFiles = await githubService.getChangedFiles(prInfo)
    core.info(
      `Found ${changedFiles.length} changed files in PR #${prInfo.number}`
    )

    const executedCommands: string[] = []
    const summaries: string[] = []
    const commandOutputs: Array<{
      command: string
      pull_request_comment: string
      summary: string
    }> = []

    for (const commandName of commandsToRun) {
      try {
        const commandConfig = config.commands[commandName]
        const commandOutput = await executor.executeCommand(
          commandName,
          commandConfig,
          changedFiles,
          prInfo,
          commandOutputs
        )

        if (commandOutput) {
          commandOutputs.push(commandOutput)
        }

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

async function postAvailableCommandsComment(
  githubService: GitHubService,
  commands: Array<{ name: string; description: string }>,
  prInfo: PullRequestInfo,
  handle?: string
): Promise<void> {
  const slashCommands = commands
    .map((cmd) => `- \`/${cmd.name}\` - ${cmd.description}`)
    .join('\n')

  const handleExample = handle
    ? `\`${handle} "your custom request"\``
    : '`@llm_command "your custom request"`'

  const commentBody = `## 🤖 LLM Commands Available

You can trigger the following commands by commenting on this PR:

**Slash Commands:**
${slashCommands}

**Custom Handle:**
- ${handleExample}

Simply comment with any of the above formats to execute the corresponding command!`

  try {
    await githubService.addPullRequestComment(prInfo, commentBody)
    core.info(
      `Posted available commands comment with ${commands.length} commands`
    )
  } catch (error) {
    core.warning(`Failed to post available commands comment: ${error}`)
  }
}
