# Contributing to LLM Command Action

Thank you for your interest in contributing to the LLM Command Action! This
guide will help you set up your development environment and understand the
project structure.

## Development Setup

### Prerequisites

You'll need to have a reasonably modern version of [Node.js](https://nodejs.org)
handy (20.x or later should work!). If you are using a version manager like
[`nodenv`](https://github.com/nodenv/nodenv) or
[`fnm`](https://github.com/Schniz/fnm), this template has a `.node-version` file
at the root of the repository that can be used to automatically switch to the
correct version when you `cd` into the repository.

### Initial Setup

After you've cloned the repository to your local machine or codespace, you'll
need to perform some initial setup steps:

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

2. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

3. :white_check_mark: Run the tests

   ```bash
   npm test
   ```

## Development Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format:write

# Build for distribution
npm run bundle

# Package the action (runs format, lint, test, coverage, and package)
npm run all

# Test action locally
npm run local-action

# Generate coverage badge
npm run coverage
```

## Project Architecture

### Core Components

- **src/main.ts** - Entry point for the GitHub Action
- **baml_src/** - BAML (BoundaryML) configuration for LLM interactions
  - `command.baml` - Defines the LLM function for executing commands in pull
    request context
  - `clients.baml` - Configures various LLM clients (OpenAI, Anthropic) with
    retry policies
  - `generators.baml` - Code generation configuration
- **src/baml_client/** - Auto-generated TypeScript client from BAML definitions
- **action.yml** - GitHub Action metadata and input/output definitions

### LLM Integration

The project uses BAML for structured LLM interactions:

- `ExecuteCommandInPullRequest` function processes commands with target files,
  pull request context, and reference files
- Supports multiple LLM providers: OpenAI (GPT-4o, GPT-4o-mini), Anthropic
  (Claude Sonnet, Haiku)
- Implements retry policies and fallback strategies for reliability

## Development Workflow

### Making Changes

1. Create a new branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to the source code
3. Add tests to `__tests__/` for your source code
4. Format, test, and build the action

   ```bash
   npm run all
   ```

   > This step is important! It will run [`rollup`](https://rollupjs.org/) to
   > build the final JavaScript action code with all dependencies included. If
   > you do not run this step, your action will not work correctly when it is
   > used in a workflow.

### Testing Locally

The [`@github/local-action`](https://github.com/github/local-action) utility can
be used to test your action locally. It is a simple command-line tool that
"stubs" (or simulates) the GitHub Actions Toolkit.

The `local-action` utility can be run in the following ways:

- **Visual Studio Code Debugger**

  Make sure to review and, if needed, update
  [`.vscode/launch.json`](./.vscode/launch.json)

- **Terminal/Command Prompt**

  ```bash
  # npx @github/local action <action-yaml-path> <entrypoint> <dotenv-file>
  npx @github/local-action . src/main.ts .env
  ```

  You can provide a `.env` file to the `local-action` CLI to set environment
  variables used by the GitHub Actions Toolkit. For example, setting inputs and
  event payload data used by your action. For more information, see the example
  file, [`.env.example`](./.env.example).

### BAML Development

- Modify `.baml` files in `baml_src/` to change LLM function definitions
- The TypeScript client in `src/baml_client/` is auto-generated from BAML files
- Test LLM functions using the test cases defined in `command.baml`

### Action Configuration

The action expects:

- **inputs.commands** - Commands to execute (defined in `.llm-commands.yaml`)
- **inputs.github_token** - GitHub token for API access
- **inputs.config_path** - Path to the commands configuration file (default:
  `.llm-commands.yaml`)
- **Environment Variables** - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` for LLM
  access

## Testing Strategy

- Unit tests in `__tests__/` using Jest
- BAML function tests defined inline in `command.baml`
- Local action testing via `@github/local-action`
- CI runs linting, testing, and distribution checks

## Important Files

- `docs/requirements/v0_initial_requirement.md` - Comprehensive project
  requirements and feature specifications
- `package.json` - All available npm scripts and dependencies
- `rollup.config.ts` - Build configuration for packaging the action

## Submitting Changes

1. Commit your changes

   ```bash
   git add .
   git commit -m "feat: describe your changes"
   ```

2. Push them to your repository

   ```bash
   git push -u origin feature/your-feature-name
   ```

3. Create a pull request and get feedback on your action
4. Merge the pull request into the `main` branch

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

The script performs the following steps:

1. **Retrieving the latest release tag:** Fetches the most recent SemVer release
   tag
2. **Prompting for a new release tag:** User enters a new release tag with
   format validation
3. **Tagging the new release:** Tags a new release and syncs major tag (e.g. v1,
   v2)
4. **Pushing changes to remote:** Pushes commits, tags and branches to the
   remote repository

For more information about versioning your action, see
[Versioning](https://github.com/actions/toolkit/blob/main/docs/action-versioning.md)
in the GitHub Actions toolkit.
