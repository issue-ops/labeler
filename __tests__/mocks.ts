import { InputOptions } from '@actions/core'

/**
 * Returns valid inputs for adding labels
 */
export function addLabelValidInput(
  name: string,
  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
  options?: InputOptions | undefined
): string {
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
      return 'ncalteen/issueops-labeler'
    default:
      return ''
  }
}

/**
 * Returns invalid inputs for adding labels
 */
export function addLabelInvalidInput(
  name: string,
  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
  options?: InputOptions | undefined
): string {
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
      return 'ncalteen/invalid-repo'
    default:
      return ''
  }
}

/**
 * Returns valid inputs for removing labels
 */
export function removeLabelValidInput(
  name: string,
  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
  options?: InputOptions | undefined
): string {
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
      return 'ncalteen/issueops-labeler'
    default:
      return ''
  }
}
