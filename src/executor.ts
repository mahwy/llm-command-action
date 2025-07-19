import * as core from '@actions/core'
import * as glob from 'glob'
import * as fs from 'fs'
import * as path from 'path'
import { b } from './baml_client/index.js'
import {
  CommandConfig,
  CommandInstruction,
  ChangedFile,
  PullRequestInfo
} from './types.js'
import { GitHubService } from './github.js'

export class CommandExecutor {
  private githubService: GitHubService

  constructor(githubService: GitHubService) {
    this.githubService = githubService
  }

  async executeCommand(
    commandName: string,
    commandConfig: CommandConfig,
    changedFiles: ChangedFile[],
    prInfo: PullRequestInfo
  ): Promise<void> {
    core.info(`Executing command: ${commandName}`)
    core.info(`Description: ${commandConfig.description}`)

    for (const instruction of commandConfig.instructions) {
      await this.executeInstruction(
        commandName,
        commandConfig,
        instruction,
        changedFiles,
        prInfo
      )
    }
  }

  private async executeInstruction(
    commandName: string,
    commandConfig: CommandConfig,
    instruction: CommandInstruction,
    changedFiles: ChangedFile[],
    prInfo: PullRequestInfo
  ): Promise<void> {
    const targetFiles = await this.getMatchingFiles(instruction.applyTo)

    if (targetFiles.length === 0) {
      core.info(
        `No files match pattern "${instruction.applyTo}" for command ${commandName}`
      )
      return
    }

    core.info(
      `Found ${targetFiles.length} matching files for pattern "${instruction.applyTo}"`
    )

    const referenceFiles = await this.loadReferenceFiles(
      instruction.files || []
    )

    const prComments = await this.githubService.getPullRequestComments(prInfo)

    const pullRequest = {
      title: prInfo.title,
      body: prInfo.body,
      comments: prComments
    }

    const bamlTargetFiles = targetFiles.map((file) => ({
      name: file.filename,
      path: file.filename,
      content: file.content
    }))

    try {
      core.info(`Executing LLM function for command ${commandName}`)
      const result = await b.ExecuteCommandInPullRequest(
        instruction.prompt,
        bamlTargetFiles,
        pullRequest,
        referenceFiles
      )

      if (result.pull_request_comment) {
        const commentHeader = `## 🤖 ${commandName}\n\n${commandConfig.description}\n\n`
        const fullComment = commentHeader + result.pull_request_comment

        await this.githubService.addPullRequestComment(
          prInfo,
          fullComment,
          commandName
        )
        core.info(`Posted comment for command ${commandName}`)
      }

      core.setOutput(`${commandName}_summary`, result.summary)
      core.setOutput(`${commandName}_comment`, result.pull_request_comment)
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
    baseDir: string = process.cwd()
  ): Promise<Array<{ filename: string; content: string }>> {
    // Handle special cases for all files
    if (pattern === '.' || pattern === '**' || pattern === '**/*') {
      pattern = '**/*'
    }

    try {
      // Use glob to find all matching files in the repository
      const matchingPaths = glob.sync(pattern, {
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

      const files = []
      for (const relativePath of matchingPaths) {
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

      core.info(`Found ${files.length} files matching pattern "${pattern}"`)
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
