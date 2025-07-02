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
      .mockReturnValueOnce('') // api_url
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
      .mockReturnValueOnce('') // api_url

    await main.run()

    expect(core.getInput).toHaveBeenCalledWith('action', { required: true })
    expect(core.setFailed).toHaveBeenCalledWith('Invalid action: noop')
  })
})

describe('Input Validation', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Uses default API URL when api_url is empty', async () => {
    core.getInput
      .mockReturnValueOnce('add') // action
      .mockReturnValueOnce('false') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce(['test'].join('\n')) // labels
      .mockReturnValueOnce('1') // issue_number
      .mockReturnValueOnce('issue-ops/labeler') // repository
      .mockReturnValueOnce('') // api_url (empty)

    await main.run()

    expect(core.getInput).toHaveBeenCalledWith('api_url', { required: false })
    expect(core.info).toHaveBeenCalledWith(
      '  - API URL: https://api.github.com'
    )
  })

  it('Uses custom API URL when provided', async () => {
    const customApiUrl = 'https://github.enterprise.com/api/v3'

    core.getInput
      .mockReturnValueOnce('add') // action
      .mockReturnValueOnce('false') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce(['test'].join('\n')) // labels
      .mockReturnValueOnce('1') // issue_number
      .mockReturnValueOnce('issue-ops/labeler') // repository
      .mockReturnValueOnce(customApiUrl) // api_url

    await main.run()

    expect(core.getInput).toHaveBeenCalledWith('api_url', { required: false })
    expect(core.info).toHaveBeenCalledWith(`  - API URL: ${customApiUrl}`)
  })

  it('Handles invalid issue number', async () => {
    core.getInput
      .mockReturnValueOnce('add') // action
      .mockReturnValueOnce('false') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce(['test'].join('\n')) // labels
      .mockReturnValueOnce('not-a-number') // issue_number
      .mockReturnValueOnce('issue-ops/labeler') // repository
      .mockReturnValueOnce('') // api_url

    await main.run()

    // The parseInt will result in NaN, which should still be handled
    expect(core.info).toHaveBeenCalledWith('  - Issue Number: NaN')
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
      .mockReturnValueOnce('') // api_url
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
    expect(core.getInput).toHaveBeenCalledWith('api_url', { required: false })
    expect(core.getInput).toHaveReturnedWith('')
  })

  it('Uses custom API URL when provided', async () => {
    // Reset mocks and set up new inputs
    jest.resetAllMocks()

    core.getInput
      .mockReturnValueOnce('add') // action
      .mockReturnValueOnce('true') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce(['bug'].join('\n')) // labels
      .mockReturnValueOnce('1') // issue_number
      .mockReturnValueOnce('issue-ops/labeler') // repository
      .mockReturnValueOnce('https://github.enterprise.com/api/v3') // api_url

    await main.run()

    expect(core.getInput).toHaveBeenCalledWith('api_url', { required: false })
    expect(core.info).toHaveBeenCalledWith(
      '  - API URL: https://github.enterprise.com/api/v3'
    )
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

  it('Does not create labels when create is false', async () => {
    // Reset mocks and set up new inputs
    jest.resetAllMocks()

    core.getInput
      .mockReturnValueOnce('add') // action
      .mockReturnValueOnce('false') // create
      .mockReturnValueOnce('token') // github_token
      .mockReturnValueOnce(['nonexistent-label'].join('\n')) // labels
      .mockReturnValueOnce('1') // issue_number
      .mockReturnValueOnce('issue-ops/labeler') // repository
      .mockReturnValueOnce('') // api_url

    mocktokit.rest.issues.getLabel.mockRejectedValue({
      status: 404,
      message: 'Not found'
    })

    await main.run()

    expect(mocktokit.rest.issues.createLabel).not.toHaveBeenCalled()
    expect(mocktokit.rest.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 1,
      labels: ['nonexistent-label'],
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
      .mockReturnValueOnce('') // api_url
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
