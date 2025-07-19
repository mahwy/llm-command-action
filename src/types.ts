export interface CommandConfig {
  description: string
  instructions: CommandInstruction[]
}

export interface CommandInstruction {
  applyTo: string
  prompt: string
  files?: FileReference[]
  modifiedOnly?: boolean // Default: true - only include files modified in the PR
}

export interface FileReference {
  path: string
  name?: string
}

export interface LLMCommandsConfig {
  handle?: string
  commands: Record<string, CommandConfig>
}

export interface PullRequestInfo {
  number: number
  title: string
  body: string
  author: string
  base: {
    ref: string
    sha: string
  }
  head: {
    ref: string
    sha: string
  }
}

export interface ChangedFile {
  filename: string
  status: 'added' | 'modified' | 'removed' | 'renamed'
  patch?: string
  content?: string
}
