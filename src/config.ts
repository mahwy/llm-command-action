import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { LLMCommandsConfig } from './types.js'

export async function loadConfig(
  workspacePath: string,
  configPath?: string
): Promise<LLMCommandsConfig> {
  const resolvedConfigPath = configPath
    ? path.resolve(workspacePath, configPath)
    : path.join(workspacePath, '.llm-commands.yaml')

  if (!fs.existsSync(resolvedConfigPath)) {
    throw new Error(`Configuration file not found at ${resolvedConfigPath}`)
  }

  try {
    const configContent = fs.readFileSync(resolvedConfigPath, 'utf8')
    const config = yaml.load(configContent) as LLMCommandsConfig

    if (!config.commands || typeof config.commands !== 'object') {
      throw new Error('Invalid configuration: commands section is required')
    }

    return config
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse configuration file: ${error.message}`)
    }
    throw new Error('Failed to parse configuration file')
  }
}

export function getCommandsToRun(
  config: LLMCommandsConfig,
  requestedCommands: string[],
  fromComment = false
): string[] {
  const availableCommands = Object.keys(config.commands)
  const commandsToRun: string[] = []

  for (const cmd of requestedCommands) {
    const trimmedCmd = cmd.trim()
    if (trimmedCmd && availableCommands.includes(trimmedCmd)) {
      const commandConfig = config.commands[trimmedCmd]
      // If command is from comment, check if it's allowed (default: true)
      if (fromComment && commandConfig.canExecuteFromComment === false) {
        continue
      }
      commandsToRun.push(trimmedCmd)
    }
  }

  return commandsToRun
}

export function getCommentEnabledCommands(
  config: LLMCommandsConfig
): Array<{ name: string; description: string }> {
  return Object.entries(config.commands)
    .filter(
      ([, commandConfig]) => commandConfig.canExecuteFromComment !== false
    )
    .map(([name, commandConfig]) => ({
      name,
      description: commandConfig.description
    }))
}
