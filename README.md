
# Asana-Move-Task action

This action uses the Asana API to move a task when a PR is opened or closed.

### Prerequisites

- Asana account with the permission on the particular project you want to integrate with.
- Must provide the task url in the PR description.

## Inputs

### `asana-pat`

**Required** Your public access token of asana, you can find it in [asana docs](https://developers.asana.com/docs/#authentication-basics).

### `targets`

**Required** JSON array of objects having project and section where to move current task. Move task only if it exists in target project. e.g 
```yaml
targets: '[{"project": "Backlog", "section": "Development Done"}, {"project": "Current Sprint", "section": "In Review"}]'
```


## Example usage

```yaml
uses: https://github.com/insurify/github-actions@v2.0.4
with:
  asana-pat: 'Your PAT'
  targets: '[{"project": "Backlog", "section": "Development Done"}, {"project": "Current Sprint", "section": "In Review"}]'
```