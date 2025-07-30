import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'

/**
 * The entrypoint for the action
 */
export async function run(): Promise<void> {
  // Get inputs
  const action: string = core.getInput('action', { required: true })
  const apiUrl: string = core.getInput('api_url', { required: true })
  const create: boolean = core.getInput('create') === 'true'
  const githubToken: string = core.getInput('github_token', { required: true })
  const labels: string[] = core
    .getInput('labels', { required: false, trimWhitespace: true })
    .split('\n')
  const labelPatterns: string[] = core
    .getInput('label_patterns', { required: false, trimWhitespace: true })
    .split('\n')
  const issueNumber: number = parseInt(
    core.getInput('issue_number', { required: true })
  )
  const repository: string = core.getInput('repository', {
    required: true
  })

  core.info('Running action with the following inputs:')
  core.info(`  - Action: ${action}`)
  core.info(`  - API URL: ${apiUrl}`)
  core.info(`  - Create: ${create}`)
  core.info(`  - Issue Number: ${issueNumber}`)
  core.info(`  - Labels: ${labels.join(', ')}`)
  core.info(`  - Label Patterns: ${labelPatterns.join(', ')}`)
  core.info(`  - Repository: ${repository}`)

  // Verify action is `add` or `remove`
  if (!['add', 'remove'].includes(action))
    return core.setFailed(`Invalid action: ${action}`)

  // Remove empty labels and patterns since core.getInput will return an empty
  // string if the input is not provided
  if (labels.length > 0 && labels[0] === '') labels.pop()
  if (labelPatterns.length > 0 && labelPatterns[0] === '') labelPatterns.pop()

  // If action is add, ensure labels are provided
  if (action === 'add' && labels.length === 0)
    return core.setFailed('No labels provided for adding')
  if (action === 'add' && labelPatterns.length > 0)
    core.warning('The label_patterns input is ignored when action is add')

  // If action is remove, either labels or label patterns must be provided
  if (action === 'remove' && labels.length === 0 && labelPatterns.length === 0)
    return core.setFailed('No labels or label patterns provided for removal')

  const owner: string = repository.split('/')[0]
  const repo: string = repository.split('/')[1]

  // Create the Octokit client
  const github: Octokit = new Octokit({ auth: githubToken, baseUrl: apiUrl })

  if (action === 'add') {
    const missingLabels: string[] = []

    // Check if labels exist
    for (const label of labels) {
      try {
        await github.rest.issues.getLabel({
          name: label,
          owner,
          repo
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Raise error if it's not a 404
        if (error.status !== 404) return core.setFailed(error.message)

        // Label doesn't exist
        missingLabels.push(label)
      }
    }

    // Create missing labels (assign a random-ish color)
    if (create)
      for (const label of missingLabels) {
        await github.rest.issues.createLabel({
          name: label,
          owner,
          repo,
          color: Math.floor((Math.random() * 0xffffff) << 0)
            .toString(16)
            .padStart(6, '0')
        })

        core.info(`Created label: ${label}`)
      }

    // Add the labels to the issue
    await github.rest.issues.addLabels({
      issue_number: issueNumber,
      labels,
      owner,
      repo
    })

    core.info(`Added labels to #${issueNumber}: ${labels.join(', ')}`)
  } else {
    for (const label of labels) {
      try {
        await github.rest.issues.removeLabel({
          issue_number: issueNumber,
          name: label,
          owner,
          repo
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Raise error if it's not a 404
        if (error.status !== 404) return core.setFailed(error.message)
      }
    }

    // Get the existing labels on the issue
    const { data: issue } = await github.rest.issues.get({
      issue_number: issueNumber,
      owner,
      repo
    })

    for (const pattern of labelPatterns) {
      core.info(`Removing labels matching pattern: ${pattern}`)

      // Match against existing labels
      const matchingLabels = issue.labels
        .map((label) =>
          /* istanbul ignore next */ typeof label === 'string'
            ? label
            : label.name || ''
        )
        .filter((label) => new RegExp(pattern).test(label))

      // Remove matching labels
      for (const label of matchingLabels) {
        try {
          await github.rest.issues.removeLabel({
            issue_number: issueNumber,
            name: label,
            owner,
            repo
          })
          core.info(`Removed label: ${label}`)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          // Raise error if it's not a 404
          /* istanbul ignore next */
          if (error.status !== 404) return core.setFailed(error.message)
        }
      }
    }

    core.info(`Removed labels from #${issueNumber}: ${labels.join(', ')}`)
  }

  core.info('Done!')
}
