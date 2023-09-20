import { Octokit } from '@octokit/rest'
import * as core from '@actions/core'

/**
 * The entrypoint for the action
 */
export async function run(): Promise<void> {
  // Get input: action
  const action: string = core.getInput('action', { required: true })

  // Verify action is `add` or `remove`
  if (!['add', 'remove'].includes(action)) {
    core.setFailed(`Invalid action: ${action}`)
    return
  }

  // Get input: create
  const create: boolean = core.getInput('create') === 'true'

  // Get input: github_token
  const githubToken: string = core.getInput('github_token', { required: true })

  // Get input: labels
  const labels: string[] = core
    .getInput('labels', { required: true })
    .trim()
    .split('\n')

  // Get input: number
  const issueNumber: number = parseInt(
    core.getInput('issue_number', { required: true })
  )

  // Get input: repository
  const repositoryInput: string = core.getInput('repository', {
    required: true
  })
  const owner: string = repositoryInput.split('/')[0]
  const repository: string = repositoryInput.split('/')[1]

  // Create the Octokit client
  const github: Octokit = new Octokit({ auth: githubToken })

  if (action === 'add') {
    const missingLabels: string[] = []

    // Check if labels exist
    for (const label of labels) {
      try {
        await github.rest.issues.getLabel({
          name: label,
          owner,
          repo: repository
        })
      } catch (error: any) {
        // Raise error if it's not a 404
        if (error.status !== 404) {
          core.error(error)
          core.setFailed(error.message)
          return
        }

        // Label doesn't exist
        missingLabels.push(label)
      }
    }

    // Create missing labels (assign a random-ish color)
    if (create && missingLabels.length > 0) {
      for (const label of missingLabels) {
        await github.rest.issues.createLabel({
          name: label,
          owner,
          repo: repository,
          color: Math.floor((Math.random() * 0xffffff) << 0)
            .toString(16)
            .padStart(6, '0')
        })

        core.info(`Created label: ${label}`)
      }
    }

    // Add the labels to the issue
    await github.rest.issues.addLabels({
      issue_number: issueNumber,
      labels,
      owner,
      repo: repository
    })

    core.info(`Added labels to #${issueNumber}: ${labels.join(', ')}`)
  } else {
    for (const label of labels) {
      try {
        await github.rest.issues.removeLabel({
          issue_number: issueNumber,
          name: label,
          owner,
          repo: repository
        })
      } catch (error: any) {
        // Raise error if it's not a 404
        if (error.status !== 404) {
          core.error(error)
          core.setFailed(error.message)
          return
        }
      }
    }

    core.info(`Removed labels from #${issueNumber}: ${labels.join(', ')}`)
  }

  core.info('Done!')
}
