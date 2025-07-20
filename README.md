# LLM Command Action

![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)

A GitHub Action that executes LLM-powered commands to enhance CI workflows with
code reviews, documentation generation, and automated analysis.

## Features

- **AI-Powered Code Reviews**: Automatically analyze pull requests for code
  quality, security issues, and best practices
- **Multi-LLM Support**: Works with OpenAI (GPT-4o, GPT-4o-mini) and Anthropic
  (Claude Sonnet, Haiku) or any LLM providers.
- **Configurable Commands**: Define custom commands in YAML configuration
- **Context-Aware**: Leverages pull request context, file changes, and reference
  materials

## Quick Start

### 1. Add the Action to Your Workflow

Create a workflow file (e.g., `.github/workflows/llm-review.yml`):

```yaml
name: LLM Code Review

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

permissions:
  contents: read
  pull-requests: write

jobs:
  llm-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: LLM Command Action
        uses: mahwy/llm-command-action@v1
        with:
          commands: |
            review-sql-schema
          github_token: ${{ secrets.GITHUB_TOKEN }}
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          # OR use Anthropic
          # ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 2. Configure Your Commands

Create a `.llm-commands.yaml` file in your repository root:

```yaml
# For provider name and options, see https://docs.boundaryml.com/ref/llm-client-providers/overview
llm-clients:
  # Currently, only one client is supported.
  - provider: openai
    options:
      api_key: env.OPENAI_API_KEY
      model: gpt-4o-mini
commands:
  review-sql-schema:
    description: |
      Reviews database schema files for consistency, normalization, and naming
        conventions.
    instructions:
      - applyTo: './migrations/*.sql'
        modifiedOnly: true # Default: true - only review files modified in PR
        prompt: |
          Review this SQL schema definition. Check for normalization, naming conventions, and indexing.
          Suggest improvements or raise warnings if there are any anti-patterns.
        files:
          - path: 'https://github.com/...../guidelines/db-schema-style.md'
            name: 'Database schema guidelines'
```

### 3. Set Up API Keys

Add your LLM provider API key to your repository secrets:

- Go to your repository Settings → Secrets and variables → Actions
- Add `OPENAI_API_KEY` for OpenAI models, or `ANTHROPIC_API_KEY` for Claude
  models

## Configuration

### Action Inputs

| Input          | Description                                                      | Required | Default               |
| -------------- | ---------------------------------------------------------------- | -------- | --------------------- |
| `commands`     | Comma-separated or newline-separated list of commands to execute | Yes      | -                     |
| `github_token` | GitHub token for API access                                      | Yes      | `${{ github.token }}` |
| `config_path`  | Path to the commands configuration file                          | No       | `.llm-commands.yaml`  |

### Action Outputs

| Output              | Description                               |
| ------------------- | ----------------------------------------- |
| `executed_commands` | JSON array of commands that were executed |
| `commands_summary`  | Summary of all executed commands          |

### Environment Variables

Please set environment varialbles referenced in the `llm-clients` section of the
`.llm-commands.yaml`.

## Advanced Usage

### Multiple Commands

Execute multiple commands in sequence:

```yaml
- name: LLM Analysis
  uses: mahwy/llm-command-action@main
  with:
    commands: |
      review-code
      security-scan
      update-docs
      generate-tests
```

### Custom Configuration Path

Use a different configuration file:

```yaml
- name: LLM Command Action
  uses: mahwy/llm-command-action@main
  with:
    commands: review-code
    config_path: .github/llm-config.yaml
```

## Examples

Check out the [.llm-commands](/.llm-commands.yaml)

## Contributing

Interested in contributing? See our [Contributing Guide](CONTRIBUTION.md) for
development setup, architecture overview, and how to submit changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
