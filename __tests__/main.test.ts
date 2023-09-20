/**
 * Unit tests for the action's index.ts file.
 */
import * as core from '@actions/core'
import * as main from '../src/main'

// Mock the GitHub Actions core library
const errorMock = jest.spyOn(core, 'error').mockImplementation()
const getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
jest.spyOn(core, 'info').mockImplementation()

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn()
}))

// Tests for invalid action usage
describe('Invalid Usage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Fails on invalid action input', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'action':
          return 'noop'
        case 'create':
          return 'nahhhh'
        case 'github_token':
          return 'token'
        case 'labels':
          return [].join('\n')
        case 'issue_number':
          return 'MyAwesomeIssue'
        case 'repository':
          return 'issue-ops/invalid-repo'
        default:
          return ''
      }
    })

    jest.spyOn(core, 'setFailed').mockImplementation()

    await main.run()

    expect(runMock).toHaveReturned()
    expect(getInputMock).toHaveBeenCalledWith('action', { required: true })
    expect(setFailedMock).toHaveBeenCalledWith('Invalid action: noop')
  })
})

describe('Add Labels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Retrieves valid inputs', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'action':
          return 'add'
        case 'create':
          return 'true'
        case 'github_token':
          return 'token'
        case 'labels':
          return ['bug', 'enhancement'].join('\n')
        case 'issue_number':
          return '1'
        case 'repository':
          return 'issue-ops/labeler'
        default:
          return ''
      }
    })

    await main.run()

    expect(runMock).toHaveReturned()
    expect(getInputMock).toHaveBeenCalledWith('action', { required: true })
    expect(getInputMock).toHaveReturnedWith('add')
    expect(getInputMock).toHaveBeenCalledWith('create')
    expect(getInputMock).toHaveReturnedWith('true')
    expect(getInputMock).toHaveBeenCalledWith('github_token', {
      required: true
    })
    expect(getInputMock).toHaveReturnedWith('token')
    expect(getInputMock).toHaveBeenCalledWith('labels', { required: true })
    expect(getInputMock).toHaveReturnedWith('bug\nenhancement')
    expect(getInputMock).toHaveBeenCalledWith('issue_number', {
      required: true
    })
    expect(getInputMock).toHaveReturnedWith('1')
    expect(getInputMock).toHaveBeenCalledWith('repository', { required: true })
    expect(getInputMock).toHaveReturnedWith('issue-ops/labeler')
  })

  it('Fails on GitHub API error', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'action':
          return 'add'
        case 'create':
          return 'true'
        case 'github_token':
          return 'token'
        case 'labels':
          return ['bug', 'enhancement'].join('\n')
        case 'issue_number':
          return '1'
        case 'repository':
          return 'issue-ops/labeler'
        default:
          return ''
      }
    })

    const mocktokit = {
      rest: {
        issues: {
          getLabel: () => {
            // eslint-disable-next-line no-throw-literal
            throw {
              status: 500,
              message: 'API error'
            }
          }
        }
      }
    }

    jest
      .spyOn(require('@octokit/rest'), 'Octokit')
      .mockImplementation(() => mocktokit)

    await main.run()

    expect(runMock).toHaveReturned()
    expect(errorMock).toHaveBeenCalledWith({
      status: 500,
      message: 'API error'
    })
    expect(setFailedMock).toHaveBeenCalledWith('API error')
  })

  it('Creates missing labels on 404 errors', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'action':
          return 'add'
        case 'create':
          return 'true'
        case 'github_token':
          return 'token'
        case 'labels':
          return ['bug', 'enhancement'].join('\n')
        case 'issue_number':
          return '1'
        case 'repository':
          return 'issue-ops/labeler'
        default:
          return ''
      }
    })

    jest.spyOn(Math, 'random').mockReturnValue(0.5)

    const mocktokit = {
      rest: {
        issues: {
          addLabels: jest.fn(),
          createLabel: jest.fn(),
          getLabel: () => {
            // eslint-disable-next-line no-throw-literal
            throw {
              status: 404,
              message: 'Not found'
            }
          }
        }
      }
    }

    jest
      .spyOn(require('@octokit/rest'), 'Octokit')
      .mockImplementation(() => mocktokit)

    await main.run()

    expect(runMock).toHaveReturned()
    expect(mocktokit.rest.issues.createLabel).toHaveBeenCalledWith({
      color: '7fffff',
      name: 'bug',
      owner: 'issue-ops',
      repo: 'labeler'
    })
    expect(mocktokit.rest.issues.createLabel).toHaveBeenCalledWith({
      color: '7fffff',
      name: 'enhancement',
      owner: 'issue-ops',
      repo: 'labeler'
    })
    expect(mocktokit.rest.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 1,
      labels: ['bug', 'enhancement'],
      owner: 'issue-ops',
      repo: 'labeler'
    })
  })
})

describe('Remove Labels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Removes valid labels', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'action':
          return 'remove'
        case 'create':
          return 'true'
        case 'github_token':
          return 'token'
        case 'labels':
          return ['bug', 'enhancement'].join('\n')
        case 'issue_number':
          return '1'
        case 'repository':
          return 'issue-ops/labeler'
        default:
          return ''
      }
    })

    const mocktokit = {
      rest: {
        issues: {
          removeLabel: jest.fn()
        }
      }
    }

    jest
      .spyOn(require('@octokit/rest'), 'Octokit')
      .mockImplementation(() => mocktokit)

    await main.run()

    expect(runMock).toHaveReturned()
    expect(mocktokit.rest.issues.removeLabel).toHaveBeenCalledWith({
      issue_number: 1,
      name: 'bug',
      owner: 'issue-ops',
      repo: 'labeler'
    })
    expect(mocktokit.rest.issues.removeLabel).toHaveBeenCalledWith({
      issue_number: 1,
      name: 'enhancement',
      owner: 'issue-ops',
      repo: 'labeler'
    })
  })

  it('Skips removing missing labels', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'action':
          return 'remove'
        case 'create':
          return 'true'
        case 'github_token':
          return 'token'
        case 'labels':
          return ['bug', 'enhancement'].join('\n')
        case 'issue_number':
          return '1'
        case 'repository':
          return 'issue-ops/labeler'
        default:
          return ''
      }
    })

    const mocktokit = {
      rest: {
        issues: {
          removeLabel: () => {
            // eslint-disable-next-line no-throw-literal
            throw {
              status: 404,
              message: 'Not found'
            }
          }
        }
      }
    }

    jest
      .spyOn(require('@octokit/rest'), 'Octokit')
      .mockImplementation(() => mocktokit)

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('Fails on GitHub API error', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'action':
          return 'remove'
        case 'create':
          return 'true'
        case 'github_token':
          return 'token'
        case 'labels':
          return ['bug', 'enhancement'].join('\n')
        case 'issue_number':
          return '1'
        case 'repository':
          return 'issue-ops/labeler'
        default:
          return ''
      }
    })

    const mocktokit = {
      rest: {
        issues: {
          removeLabel: () => {
            // eslint-disable-next-line no-throw-literal
            throw {
              status: 500,
              message: 'API error'
            }
          }
        }
      }
    }

    jest
      .spyOn(require('@octokit/rest'), 'Octokit')
      .mockImplementation(() => mocktokit)

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenCalledWith('API error')
  })
})
