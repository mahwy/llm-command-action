import * as core from '@actions/core'
import * as glob from 'glob'
import * as fs from 'fs'
import * as path from 'path'
import { b as bamlClient } from './baml_client/async_client.js'
import {
  CommandConfig,
  CommandInstruction,
  ChangedFile,
  PullRequestInfo,
  TargetFile,
  LLMClientsConfig
} from './types.js'
import { GitHubService } from './github.js'
import { ClientRegistry, Collector } from '@boundaryml/baml'

export class CommandExecutor {
  private githubService: GitHubService
  private llmClients: LLMClientsConfig
  private debug: boolean

  constructor(
    githubService: GitHubService,
    llmClients: LLMClientsConfig,
    debug: boolean = false
  ) {
    this.githubService = githubService
    this.llmClients = llmClients
    this.debug = debug
  }

  async executeCommand(
    commandName: string,
    commandConfig: CommandConfig,
    changedFiles: ChangedFile[],
    prInfo: PullRequestInfo,
    otherCommandOutputs: Array<{
      command: string
      pull_request_comment: string
      summary: string
    }> = [],
    executionPlan?: {
      loadFiles: Array<{
        reason: string
        fullContent: boolean
        path: string
      }>
      loadCommandOutputs: Array<{ reason: string; commandName: string }>
    }
  ): Promise<{
    command: string
    pull_request_comment: string
    summary: string
  } | null> {
    core.info(`Executing command: ${commandName}`)
    core.info(`Description: ${commandConfig.description}`)

    let combinedComment = ''
    let combinedSummary = ''

    for (const instruction of commandConfig.instructions) {
      const result = await this.executeInstruction(
        commandName,
        commandConfig,
        instruction,
        changedFiles,
        prInfo,
        otherCommandOutputs,
        executionPlan
      )

      if (result) {
        combinedComment += result.pull_request_comment + '\n\n'
        combinedSummary += result.summary + ' '
      }
    }

    if (combinedComment || combinedSummary) {
      return {
        command: commandName,
        pull_request_comment: combinedComment.trim(),
        summary: combinedSummary.trim()
      }
    }

    return null
  }

  async planCommands(
    commands: Record<string, CommandConfig>,
    changedFiles: ChangedFile[],
    prInfo: PullRequestInfo
  ): Promise<{
    [commandName: string]: {
      loadFiles: Array<{ reason: string; fullContent: boolean; path: string }>
      loadCommandOutputs: Array<{ reason: string; commandName: string }>
    }
  }> {
    core.info('Planning command execution...')

    const prComments = await this.githubService.getPullRequestComments(prInfo)

    // Convert to BAML format
    const pullRequestForPlan = {
      title: prInfo.title,
      body: prInfo.body,
      comments: prComments.map((comment) => ({
        author: comment.author,
        body: comment.body
      })),
      files: changedFiles.map((file) => ({
        filename: file.filename,
        status: file.status
      }))
    }

    const commandsForPlan = Object.entries(commands).map(([name, config]) => ({
      name,
      description: config.description,
      instructions: {
        applyTo: config.instructions[0]?.applyTo,
        prompt: config.instructions[0]?.prompt || '',
        files:
          config.instructions[0]?.files?.map((f) => ({
            name: f.name,
            path: f.path
          })) || [],
        modifiedOnly: config.instructions[0]?.modifiedOnly
      }
    }))

    try {
      const collector = new Collector('llm-command-action-planning')
      const clientRegistry = new ClientRegistry()

      // Setup small LLM client for planning
      const planningClientConfig = this.llmClients.small
      const clientName = 'llm-command-action-planning-client'

      // Resolve environment variables in api_key
      const options = { ...planningClientConfig.options }
      if (options.api_key && options.api_key.startsWith('env.')) {
        const envVar = options.api_key.substring(4)
        options.api_key = process.env[envVar]
      }

      clientRegistry.addLlmClient(
        clientName,
        planningClientConfig.provider,
        options
      )
      clientRegistry.setPrimary(clientName)

      const planResult = await bamlClient.Plan(
        pullRequestForPlan,
        commandsForPlan,
        {
          clientRegistry,
          collector
        }
      )

      core.info(`Planning Usage: ${collector.usage}`)

      // Convert plan result to a more usable format
      const executionPlan: {
        [commandName: string]: {
          loadFiles: Array<{
            reason: string
            fullContent: boolean
            path: string
          }>
          loadCommandOutputs: Array<{ reason: string; commandName: string }>
        }
      } = {}

      for (const plan of planResult.plans) {
        executionPlan[plan.name] = {
          loadFiles: plan.loadFiles,
          loadCommandOutputs: plan.loadCommandOutputs
        }
      }

      core.info(
        `Generated execution plan for ${Object.keys(executionPlan).length} commands`
      )
      return executionPlan
    } catch (error) {
      core.warning(
        `Planning failed, falling back to default execution: ${error}`
      )
      return {}
    }
  }

  private async executeInstruction(
    commandName: string,
    commandConfig: CommandConfig,
    instruction: CommandInstruction,
    changedFiles: ChangedFile[],
    prInfo: PullRequestInfo,
    otherCommandOutputs: Array<{
      command: string
      pull_request_comment: string
      summary: string
    }> = [],
    executionPlan?: {
      loadFiles: Array<{
        reason: string
        fullContent: boolean
        path: string
      }>
      loadCommandOutputs: Array<{ reason: string; commandName: string }>
    }
  ): Promise<{
    command: string
    pull_request_comment: string
    summary: string
  } | null> {
    let targetFiles: TargetFile[] = []
    const applyTo = instruction.applyTo ?? 'none'
    if (applyTo != 'none') {
      const modifiedOnly = instruction.modifiedOnly ?? true
      targetFiles = await this.getMatchingFiles(
        applyTo,
        process.cwd(),
        modifiedOnly ? changedFiles : undefined
      )

      if (targetFiles.length === 0) {
        const noFilesComment = modifiedOnly
          ? `## 🤖 ${commandName}\n\n${commandConfig.description}\n\n` +
            `No modified files match the pattern "${applyTo}" in this pull request.`
          : `No files match pattern "${applyTo}" for command ${commandName}`

        if (modifiedOnly) {
          await this.githubService.addPullRequestComment(
            prInfo,
            noFilesComment,
            commandName
          )
        }

        core.info(
          `No files match pattern "${applyTo}" for command ${commandName}`
        )
        return null
      }

      core.info(
        `Found ${targetFiles.length} matching files for pattern "${applyTo}"`
      )
    }

    // Load reference files from instruction configuration
    let referenceFiles = await this.loadReferenceFiles(instruction.files || [])

    // Track already loaded file paths to avoid duplicates
    const loadedFilePaths = new Set(referenceFiles.map((f) => f.path))

    // Load additional files from execution plan if available
    if (executionPlan?.loadFiles) {
      core.info(
        `Processing ${executionPlan.loadFiles.length} files from execution plan`
      )
      for (const fileToLoad of executionPlan.loadFiles) {
        // Skip if file is already loaded
        if (loadedFilePaths.has(fileToLoad.path)) {
          core.info(`Skipping duplicate file: ${fileToLoad.path}`)
          continue
        }

        try {
          const content = await this.githubService.getReferenceFileContent(
            fileToLoad.path
          )

          // If fullContent is false, try to get patch instead of full content
          let fileContent = content
          if (!fileToLoad.fullContent) {
            const changedFile = changedFiles.find(
              (f) => f.filename === fileToLoad.path
            )
            if (changedFile?.patch) {
              fileContent = changedFile.patch
            }
          }

          referenceFiles.push({
            name: fileToLoad.reason,
            path: fileToLoad.path,
            content: fileContent
          })
          loadedFilePaths.add(fileToLoad.path)
          core.info(
            `Loaded additional file: ${fileToLoad.path} (${fileToLoad.reason})`
          )
        } catch (error) {
          core.warning(
            `Failed to load planned file ${fileToLoad.path}: ${error}`
          )
        }
      }
    }

    // Filter command outputs based on execution plan if available
    let relevantCommandOutputs = otherCommandOutputs
    if (
      executionPlan?.loadCommandOutputs &&
      executionPlan.loadCommandOutputs.length > 0
    ) {
      const commandNamesToInclude = new Set(
        executionPlan.loadCommandOutputs.map((cmd) => cmd.commandName)
      )
      relevantCommandOutputs = otherCommandOutputs.filter((output) =>
        commandNamesToInclude.has(output.command)
      )
      core.info(
        `Including outputs from ${relevantCommandOutputs.length} commands based on execution plan`
      )
    }

    const prComments = await this.githubService.getPullRequestComments(prInfo)

    const pullRequest = {
      title: prInfo.title,
      body: prInfo.body,
      comments: prComments.map((comment) => ({
        author: comment.author,
        body: comment.body
      }))
    }

    const bamlTargetFiles = targetFiles.map((file) => ({
      name: file.filename,
      path: file.filename,
      content: file.content,
      patch: file.patch
    }))

    try {
      core.info(`Executing LLM function for command ${commandName}`)
      const collector = new Collector('llm-command-action')
      const clientRegistry = new ClientRegistry()
      const clientConfig = this.llmClients.large
      const clientName = 'llm-command-action-client'

      // Resolve environment variables in api_key
      const options = { ...clientConfig.options }
      if (options.api_key && options.api_key.startsWith('env.')) {
        const envVar = options.api_key.substring(4)
        options.api_key = process.env[envVar]
      }

      clientRegistry.addLlmClient(clientName, clientConfig.provider, options)
      clientRegistry.setPrimary(clientName)

      const result = await bamlClient.ExecuteCommandInPullRequest(
        instruction.prompt,
        bamlTargetFiles,
        pullRequest,
        referenceFiles,
        relevantCommandOutputs,
        {
          clientRegistry,
          collector
        }
      )
      core.info(`LLM Usage: ${collector.usage}`)

      if (result.pull_request_comment) {
        const commentHeader = `## 🤖 ${commandName}\n\n${commandConfig.description}\n\n`
        let fullComment = commentHeader + result.pull_request_comment

        // Add debug information if enabled
        if (this.debug) {
          const debugInfo = `\n\n<!-- llm-command-action:debug\nToken Usage: ${collector.usage}\nCommand: ${commandName}\nTimestamp: ${new Date().toISOString()}\n-->`
          fullComment += debugInfo
        }

        await this.githubService.addPullRequestComment(
          prInfo,
          fullComment,
          commandName
        )
        core.info(`Posted comment for command ${commandName}`)
      }

      core.setOutput(`${commandName}_summary`, result.summary)
      core.setOutput(`${commandName}_comment`, result.pull_request_comment)

      return result
    } catch (error) {
      core.error(`Failed to execute command ${commandName}: ${error}`)

      const errorComment =
        `## ❌ ${commandName} - Execution Failed\n\n` +
        `${commandConfig.description}\n\n` +
        `**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `Please check the action logs for more details.`

      await this.githubService.addPullRequestComment(
        prInfo,
        errorComment,
        commandName
      )
      throw error
    }
  }

  private async getMatchingFiles(
    pattern: string,
    baseDir: string = process.cwd(),
    changedFiles?: ChangedFile[]
  ): Promise<TargetFile[]> {
    core.info(`Getting matching files for "${pattern}" in ${baseDir}`)

    if (pattern === '') {
      return []
    }
    // Handle special cases for all files
    if (pattern === '.' || pattern === '**' || pattern === '**/*') {
      pattern = '**/*'
    }

    try {
      let filesToProcess: string[]

      if (changedFiles) {
        // Filter changed files that match the pattern
        const changedFilePaths = changedFiles
          .filter((file) => file.status !== 'removed')
          .map((file) => file.filename)

        // Use glob to match the pattern against changed files
        filesToProcess = glob
          .sync(pattern, {
            cwd: baseDir,
            ignore: [
              '**/node_modules/**',
              '**/.git/**',
              '**/dist/**',
              '**/build/**',
              '**/*.min.js',
              '**/*.map'
            ],
            nodir: true
          })
          .filter((file) => changedFilePaths.includes(file))
      } else {
        // Use glob to find all matching files in the repository
        filesToProcess = glob.sync(pattern, {
          cwd: baseDir,
          ignore: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/*.min.js',
            '**/*.map'
          ],
          nodir: true
        })
      }

      const files = []
      for (const relativePath of filesToProcess) {
        // If we have changed files, use their content if available
        if (changedFiles) {
          const changedFile = changedFiles.find(
            (file) => file.filename === relativePath
          )
          if (changedFile && changedFile.content) {
            files.push({
              filename: relativePath,
              content: changedFile.content,
              patch: changedFile.patch
            })
            continue
          }
        }

        // Fall back to reading from filesystem
        const fullPath = path.join(baseDir, relativePath)
        try {
          // Check if file is readable and not too large (limit to 1MB)
          const stats = fs.statSync(fullPath)
          if (stats.size > 1024 * 1024) {
            core.warning(
              `Skipping large file: ${relativePath} (${stats.size} bytes)`
            )
            continue
          }

          const content = fs.readFileSync(fullPath, 'utf8')
          files.push({
            filename: relativePath,
            content
          })
        } catch (error) {
          core.warning(`Failed to read file ${relativePath}: ${error}`)
        }
      }

      const fileSource = changedFiles ? 'modified' : 'all'
      core.info(
        `Found ${files.length} ${fileSource} files matching pattern "${pattern}"`
      )
      return files
    } catch (error) {
      core.error(`Error finding files with pattern "${pattern}": ${error}`)
      return []
    }
  }

  private async loadReferenceFiles(
    fileRefs: Array<{ path: string; name?: string }>
  ): Promise<Array<{ name?: string; path: string; content: string }>> {
    const referenceFiles = []

    for (const fileRef of fileRefs) {
      const content = await this.githubService.getReferenceFileContent(
        fileRef.path
      )
      referenceFiles.push({
        name: fileRef.name,
        path: fileRef.path,
        content
      })
    }

    return referenceFiles
  }
}
