export interface CommandConfig {
  description: string
  instructions: CommandInstruction[]
  canExecuteFromComment?: boolean // Default: true - whether command can be triggered via PR comment
}

export interface CommandInstruction {
  applyTo?: string | 'none'
  prompt: string
  files?: FileReference[]
  modifiedOnly?: boolean // Default: true - only include files modified in the PR
}

export interface FileReference {
  path: string
  name?: string
}

export interface LLMClientConfig {
  provider: string
  options: {
    api_key?: string
    model?: string
    [key: string]: unknown
  }
}

export interface LLMClientsConfig {
  large: LLMClientConfig
  small: LLMClientConfig
}

export interface LLMCommandsConfig {
  handle?: string
  'llm-clients': LLMClientsConfig
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

export interface PullRequestComment {
  author: string
  body: string
}

export type TargetFile = { filename: string; content: string; patch?: string }
