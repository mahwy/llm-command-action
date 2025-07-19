import * as core from '@actions/core'
import * as minimatch from 'minimatch'
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
    const targetFiles = this.getMatchingFiles(changedFiles, instruction.applyTo)

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
      content: file.content || ''
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

        await this.githubService.addPullRequestComment(prInfo, fullComment)
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

      await this.githubService.addPullRequestComment(prInfo, errorComment)
      throw error
    }
  }

  private getMatchingFiles(
    changedFiles: ChangedFile[],
    pattern: string
  ): ChangedFile[] {
    return changedFiles.filter((file) => {
      if (pattern === '.' || pattern === '**' || pattern === '**/*') {
        return true
      }
      return minimatch.minimatch(file.filename, pattern)
    })
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
