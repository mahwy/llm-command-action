/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => ({
  context: {
    eventName: 'pull_request',
    payload: {},
    repo: { owner: 'test', repo: 'test' },
    sha: 'abc123',
    ref: 'refs/heads/main',
    workflow: 'test',
    action: 'test',
    actor: 'test',
    job: 'test',
    runNumber: 1,
    runId: 1
  }
}))

jest.unstable_mockModule('../src/config.js', () => ({
  loadConfig: jest.fn(),
  getCommandsToRun: jest.fn(),
  getCommentEnabledCommands: jest.fn()
}))

jest.unstable_mockModule('../src/github.js', () => ({
  GitHubService: jest.fn()
}))

jest.unstable_mockModule('../src/executor.js', () => ({
  CommandExecutor: jest.fn()
}))

// The module being tested should be imported dynamically.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'commands':
          return 'test-command'
        case 'github_token':
          return 'test-token'
        default:
          return ''
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Handles missing GitHub token', async () => {
    core.getInput.mockImplementation((name: string) => {
      if (name === 'github_token') return ''
      if (name === 'commands') return 'test-command'
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('GitHub token is required')
  })
})
