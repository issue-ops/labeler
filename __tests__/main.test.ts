import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as octokit from '../__fixtures__/octokit.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@octokit/rest', async () => {
  class Octokit {
    constructor() {
      return octokit
    }
  }

  return {
    Octokit
  }
})

const main = await import('../src/main.js')
const { Octokit } = await import('@octokit/rest')

const mocktokit = jest.mocked(new Octokit())

// Tests for invalid action usage
describe('Invalid Usage', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput
      .mockReturnValueOnce('noop') // action
      .mockReturnValueOnce('nahhhh') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce([].join('\n')) // labels
      .mockReturnValueOnce('MyAwesomeIssue') // issue_number
      .mockReturnValueOnce('issue-ops/invalid-repo') // repository
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Fails on invalid action input', async () => {
    core.getInput
      .mockReturnValueOnce('noop') // action
      .mockReturnValueOnce('nahhhh') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce([].join('\n')) // labels
      .mockReturnValueOnce('MyAwesomeIssue') // issue_number
      .mockReturnValueOnce('issue-ops/invalid-repo') // repository

    await main.run()

    expect(core.getInput).toHaveBeenCalledWith('action', { required: true })
    expect(core.setFailed).toHaveBeenCalledWith('Invalid action: noop')
  })
})

describe('Add Labels', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput
      .mockReturnValueOnce('add') // action
      .mockReturnValueOnce('true') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce(['bug', 'enhancement'].join('\n')) // labels
      .mockReturnValueOnce('1') // issue_number
      .mockReturnValueOnce('issue-ops/labeler') // repository
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Retrieves valid inputs', async () => {
    await main.run()

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
    mocktokit.rest.issues.getLabel.mockRejectedValue({
      status: 500,
      message: 'API error'
    })

    await main.run()

    expect(core.setFailed).toHaveBeenCalledWith('API error')
  })

  it('Creates missing labels on 404 errors', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5)

    mocktokit.rest.issues.getLabel.mockRejectedValue({
      status: 404,
      message: 'Not found'
    })

    await main.run()

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
    // Set the action's inputs as return values from core.getInput()
    core.getInput
      .mockReturnValueOnce('remove') // action
      .mockReturnValueOnce('true') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce(['bug', 'enhancement'].join('\n')) // labels
      .mockReturnValueOnce('1') // issue_number
      .mockReturnValueOnce('issue-ops/labeler') // repository
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Removes valid labels', async () => {
    await main.run()

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
    mocktokit.rest.issues.removeLabel.mockRejectedValue({
      status: 404,
      message: 'Not found'
    })

    await main.run()

    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('Fails on GitHub API error', async () => {
    mocktokit.rest.issues.removeLabel.mockRejectedValue({
      status: 500,
      message: 'API error'
    })

    await main.run()

    expect(core.setFailed).toHaveBeenCalledWith('API error')
  })
})
