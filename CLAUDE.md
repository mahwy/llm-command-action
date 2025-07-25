# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a GitHub Action that executes LLM-powered commands to enhance CI
workflows. The action allows repositories to define structured instructions in
YAML that leverage Large Language Models for tasks like code reviews,
documentation generation, and automated analysis.

## Architecture

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

## Key Development Workflows

### Building the Action

Run `npm run bundle` to format, package, and prepare the action for
distribution. This is required before testing or deploying.

### Testing Locally

Use `npm run local-action` or the VS Code debugger to test the action locally
without pushing to GitHub.

#### Direct Local Execution

You can also run the action directly using `@github/local-action`:

```bash
npx @github/local-action . src/main.ts .env
```

This command will:

- Use the current directory (`.`) as the action path
- Execute `src/main.ts` as the entry point
- Load environment variables from `.env` file

Make sure to:

1. Set your API keys in `.env` (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
2. Configure action inputs with `INPUT_` prefix (e.g., `INPUT_COMMANDS`)
3. Build the action first with `npm run bundle` if testing packaged version

### BAML Development

- Modify `.baml` files in `baml_src/` to change LLM function definitions
- The TypeScript client in `src/baml_client/` is auto-generated from BAML files
- Test LLM functions using the test cases defined in `command.baml`

## Action Configuration

The action expects:

- **inputs.milliseconds** - Currently a placeholder from the template
- **LLM Commands** - Defined in `.llm-commands.yaml` in consuming repositories
  (configurable via `config_path` input)
- **Environment Variables** - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` for LLM
  access

## Testing Strategy

- Unit tests in `__tests__/` using Jest
- BAML function tests defined inline in `command.baml`
- Local action testing via `@github/local-action`
- CI runs linting, testing, and distribution checks

## Important Files to Understand

- `docs/requirements/v0_initial_requirement.md` - Comprehensive project
  requirements and feature specifications
- `package.json` - All available npm scripts and dependencies
- `rollup.config.ts` - Build configuration for packaging the action
