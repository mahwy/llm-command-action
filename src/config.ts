import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { LLMCommandsConfig } from './types.js'

export async function loadConfig(
  workspacePath: string
): Promise<LLMCommandsConfig> {
  const configPath = path.join(workspacePath, '.llm', 'commands.yaml')

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found at ${configPath}`)
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8')
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
  requestedCommands: string[]
): string[] {
  const availableCommands = Object.keys(config.commands)
  const commandsToRun: string[] = []

  for (const cmd of requestedCommands) {
    const trimmedCmd = cmd.trim()
    if (trimmedCmd && availableCommands.includes(trimmedCmd)) {
      commandsToRun.push(trimmedCmd)
    }
  }

  return commandsToRun
}
