/**
 * Unit tests for the action's index.ts file.
 */

import {
  addLabelValidInput,
  removeLabelValidInput,
  addLabelInvalidInput
} from './mocks'

import * as core from '@actions/core'

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
    jest.spyOn(core, 'error').mockImplementation()
    jest.spyOn(core, 'getInput').mockImplementation(addLabelInvalidInput)
    jest.spyOn(core, 'setFailed').mockImplementation()

    const { run } = require('../src/index')
    await run()

    expect(core.getInput).toHaveBeenCalledWith('action', { required: true })
    expect(core.setFailed).toHaveBeenCalledWith('Invalid action: noop')
  })
})

describe('Add Labels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Retrieves valid inputs', async () => {
    jest.spyOn(core, 'getInput').mockImplementation(addLabelValidInput)

    const { run } = require('../src/index')
    await run()

    expect(core.getInput).toHaveBeenCalledWith('action', { required: true })
    expect(core.getInput).toHaveReturnedWith('add')
    expect(core.getInput).toHaveBeenCalledWith('create')
    expect(core.getInput).toHaveReturnedWith('true')
    expect(core.getInput).toHaveBeenCalledWith('github_token', {
      required: true
    })
    expect(core.getInput).toHaveReturnedWith('token')
    expect(core.getInput).toHaveBeenCalledWith('labels', { required: true })
    expect(core.getInput).toHaveReturnedWith('bug\nenhancement')
    expect(core.getInput).toHaveBeenCalledWith('issue_number', {
      required: true
    })
    expect(core.getInput).toHaveReturnedWith('1')
    expect(core.getInput).toHaveBeenCalledWith('repository', { required: true })
    expect(core.getInput).toHaveReturnedWith('issue-ops/labeler')
  })

  it('Fails on GitHub API error', async () => {
    jest.spyOn(core, 'getInput').mockImplementation(addLabelValidInput)
    jest.spyOn(core, 'error').mockImplementation()
    jest.spyOn(core, 'setFailed').mockImplementation()

    jest.spyOn(require('@octokit/rest'), 'Octokit').mockImplementation(() => {
      return {
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
    })

    const { run } = require('../src/index')
    await run()

    expect(core.error).toHaveBeenCalledWith({
      status: 500,
      message: 'API error'
    })
    expect(core.setFailed).toHaveBeenCalledWith('API error')
  })

  it('Creates missing labels on 404 errors', async () => {
    jest.spyOn(core, 'getInput').mockImplementation(addLabelValidInput)
    jest.spyOn(core, 'info').mockImplementation()
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

    const { run } = require('../src/index')
    await run()

    expect(mocktokit.rest.issues.createLabel).toHaveBeenCalledWith({
      color: '7fffff',
      name: 'bug',
      owner: 'issue-ops',
      repo: 'labeler'
    })
    expect(core.info).toHaveBeenCalledWith('Created label: bug')
    expect(mocktokit.rest.issues.createLabel).toHaveBeenCalledWith({
      color: '7fffff',
      name: 'enhancement',
      owner: 'issue-ops',
      repo: 'labeler'
    })
    expect(core.info).toHaveBeenCalledWith('Created label: enhancement')
    expect(mocktokit.rest.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 1,
      labels: ['bug', 'enhancement'],
      owner: 'issue-ops',
      repo: 'labeler'
    })
    expect(core.info).toHaveBeenCalledWith(
      'Added labels to #1: bug, enhancement'
    )
  })
})

describe('Remove Labels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Removes valid labels', async () => {
    jest.spyOn(core, 'getInput').mockImplementation(removeLabelValidInput)
    jest.spyOn(core, 'info').mockImplementation()

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

    const { run } = require('../src/index')
    await run()

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
    expect(core.info).toHaveBeenCalledWith(
      'Removed labels from #1: bug, enhancement'
    )
  })

  it('Skips removing missing labels', async () => {
    jest.spyOn(core, 'getInput').mockImplementation(removeLabelValidInput)
    jest.spyOn(core, 'setFailed').mockImplementation()

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

    const { run } = require('../src/index')
    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(
      'Removed labels from #1: bug, enhancement'
    )
  })

  it('Fails on GitHub API error', async () => {
    jest.spyOn(core, 'getInput').mockImplementation(removeLabelValidInput)
    jest.spyOn(core, 'setFailed').mockImplementation()

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

    const { run } = require('../src/index')
    await run()

    expect(core.error).toHaveBeenCalledWith({
      status: 500,
      message: 'API error'
    })
    expect(core.setFailed).toHaveBeenCalledWith('API error')
  })
})
