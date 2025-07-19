import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'
import * as path from 'path'
import { ChangedFile, PullRequestInfo } from './types.js'

export class GitHubService {
  private octokit: ReturnType<typeof github.getOctokit>
  private context: typeof github.context

  constructor(token: string, context: typeof github.context = github.context) {
    this.octokit = github.getOctokit(token)
    this.context = context
  }

  async getPullRequestInfo(): Promise<PullRequestInfo | null> {
    if (
      this.context.eventName !== 'pull_request' &&
      this.context.eventName !== 'issue_comment'
    ) {
      return null
    }

    let prNumber: number | undefined
    if (this.context.eventName === 'pull_request') {
      prNumber = (this.context.payload as { pull_request?: { number: number } })
        .pull_request?.number
    } else {
      prNumber = (this.context.payload as { issue?: { number: number } }).issue
        ?.number
    }

    if (!prNumber) {
      return null
    }

    try {
      const { data: pr } = await this.octokit.rest.pulls.get({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        pull_number: prNumber
      })

      console.log('PR Data', pr)

      return {
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        author: pr.user?.login || '',
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha
        },
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha
        }
      }
    } catch (error) {
      core.warning(`Failed to get pull request info: ${error}`)
      return null
    }
  }

  async getChangedFiles(prInfo: PullRequestInfo): Promise<ChangedFile[]> {
    try {
      const { data: files } = await this.octokit.rest.pulls.listFiles({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        pull_number: prInfo.number
      })

      const changedFiles: ChangedFile[] = []

      for (const file of files) {
        const changedFile: ChangedFile = {
          filename: file.filename,
          status: file.status as 'added' | 'modified' | 'removed' | 'renamed',
          patch: file.patch
        }

        if (file.status !== 'removed') {
          try {
            const { data: fileContent } =
              await this.octokit.rest.repos.getContent({
                owner: this.context.repo.owner,
                repo: this.context.repo.repo,
                path: file.filename,
                ref: prInfo.head.sha
              })

            if (
              'content' in fileContent &&
              typeof fileContent.content === 'string'
            ) {
              changedFile.content = Buffer.from(
                fileContent.content,
                'base64'
              ).toString('utf8')
            }
          } catch (error) {
            core.warning(
              `Failed to get content for file ${file.filename}: ${error}`
            )
          }
        }

        changedFiles.push(changedFile)
      }

      return changedFiles
    } catch (error) {
      core.error(`Failed to get changed files: ${error}`)
      return []
    }
  }

  async getPullRequestComments(
    prInfo: PullRequestInfo
  ): Promise<Array<{ author: string; body: string }>> {
    try {
      const { data: comments } = await this.octokit.rest.issues.listComments({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        issue_number: prInfo.number
      })

      return comments.map((comment) => ({
        author: comment.user?.login || '',
        body: comment.body || ''
      }))
    } catch (error) {
      core.warning(`Failed to get PR comments: ${error}`)
      return []
    }
  }

  async addPullRequestComment(
    prInfo: PullRequestInfo,
    comment: string
  ): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        issue_number: prInfo.number,
        body: comment
      })
      core.info(`Posted comment to PR #${prInfo.number}`)
    } catch (error) {
      core.error(`Failed to post comment to PR: ${error}`)
      throw error
    }
  }

  async getReferenceFileContent(filePath: string): Promise<string> {
    core.info(`Fetching reference file from: ${filePath}`)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      const githubFileInfo = this.parseGitHubUrl(filePath)
      if (githubFileInfo) {
        try {
          const { data: fileContent } =
            await this.octokit.rest.repos.getContent({
              owner: githubFileInfo.owner,
              repo: githubFileInfo.repo,
              path: githubFileInfo.path,
              ref: githubFileInfo.ref
            })

          if (
            'content' in fileContent &&
            typeof fileContent.content === 'string'
          ) {
            return Buffer.from(fileContent.content, 'base64').toString('utf8')
          } else {
            core.warning(`File ${filePath} is not a regular file`)
            return ''
          }
        } catch (error) {
          core.warning(`Failed to fetch GitHub file ${filePath}: ${error}`)
          return ''
        }
      } else {
        try {
          const response = await fetch(filePath)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          return await response.text()
        } catch (error) {
          core.warning(`Failed to fetch remote file ${filePath}: ${error}`)
          return ''
        }
      }
    }

    const localPath = path.resolve(filePath)
    if (fs.existsSync(localPath)) {
      try {
        return fs.readFileSync(localPath, 'utf8')
      } catch (error) {
        core.warning(`Failed to read local file ${filePath}: ${error}`)
        return ''
      }
    }

    core.warning(`Reference file not found: ${filePath}`)
    return ''
  }

  private parseGitHubUrl(url: string): {
    owner: string
    repo: string
    path: string
    ref: string
  } | null {
    try {
      const urlObj = new URL(url)

      if (urlObj.hostname !== 'github.com') {
        return null
      }

      const pathParts = urlObj.pathname.split('/').filter((part) => part)

      if (pathParts.length < 5 || pathParts[2] !== 'blob') {
        return null
      }

      const owner = pathParts[0]
      const repo = pathParts[1]
      const ref = pathParts[3]
      const path = pathParts.slice(4).join('/')

      return { owner, repo, path, ref }
    } catch {
      return null
    }
  }
}
