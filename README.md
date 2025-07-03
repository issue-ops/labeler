# IssueOps Labeler

![Check dist/](https://github.com/issue-ops/labeler/actions/workflows/check-dist.yml/badge.svg)
![CodeQL](https://github.com/issue-ops/labeler/actions/workflows/codeql.yml/badge.svg)
![Continuous Integration](https://github.com/issue-ops/labeler/actions/workflows/continuous-integration.yml/badge.svg)
![Continuous Delivery](https://github.com/issue-ops/labeler/actions/workflows/continuous-delivery.yml/badge.svg)
![Linter](https://github.com/issue-ops/labeler/actions/workflows/linter.yml/badge.svg)
![Code Coverage](./badges/coverage.svg)

Manage labels for issues and pull requests

> [!IMPORTANT]
>
> As of version `v2.0.0`, this action has been converted to ESM.

## About

This action can be used to add and remove labels from issues and pull requests.

## Setup

Here is a simple example of how to use this action in your workflow. Make sure
to replace `vX.X.X` with the latest version of this action.

```yaml
on:
  issues:
    types:
      - opened

jobs:
  example:
    name: Example
    runs-on: ubuntu-latest

    # Write permissions to issues is required
    permissions:
      issues: write

    steps:
      # Add labels to an issue in this repository
      - name: Add Labels
        id: add-labels
        uses: issue-ops/labeler@vX.X.X
        with:
          action: add
          issue_number: ${{ github.event.issue.number }}
          labels: |
            enhancement
            great-first-issue

      # Remove labels from an issue in this repository
      - name: Remove Labels
        id: remove-labels
        uses: issue-ops/labeler@vX.X.X
        with:
          action: remove
          issue_number: ${{ github.event.issue.number }}
          labels: |
            enhancement
            great-first-issue
```

## Behavior

- When adding labels, if you specify label(s) that do not exist and `create` is
  set to `'false'` (the default), this action will fail.
- When removing labels that do not exist, this action will continue without
  error.

## Inputs

| Input          | Default                                                                         | Description                    |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| `action`       | `add`                                                                           | The action (`add` or `remove`) |
| `create`       | `'false'`                                                                       | Create label, if not present   |
| `github_token` | `${{ github.token }}`                                                           | The GitHub API token to use    |
| `labels`       | `label1`                                                                        | **Line-separated** label list  |
| `issue_number` | `${{ github.event.issue.number }}` or `${{ github.event.pull_request.number }}` | The issue or PR numer          |
| `repository`   | `${{ github.repository }}`                                                      | The repository (`owner/repo`)  |
| `api_url`      | `${{ github.api_url }}`                                                         | The GitHub API URL to use      |

> [!WARNING]
>
> If you specify a repository other than the one the action is running in, you
> will need to provide a value for the `github_token` that has appropriate
> permissions (using either a PAT or a GitHub App).
