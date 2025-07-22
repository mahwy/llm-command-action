# **LLM Command Action - Requirement Document**

## **Overview**

**LLM Command Action** is a GitHub Action that allows repositories to define and
execute structured instructions that leverage Large Language Models (LLMs) to
enhance Continuous Integration (CI) workflows. These commands streamline
repetitive developer tasks such as code reviews, documentation generation, test
scaffolding, and more.

## **Goals**

- Automate structured developer workflows using LLMs.
- Enable maintainable, declarative instruction definitions in version control.
- Support modular and composable actions that integrate into CI pipelines.
- Optimize LLM interactions for token efficiency and execution time.

## **Features**

### **1. Command Definition**

- YAML-based schema (`.llm-commands.yaml`) for defining reusable LLM commands
- Each command configuration includes:
  - command `e.g. "review_code"`
  - description: e.g. "This command reviews code"
  - instructions:
    - applyTo: glob filter e.g. `**/*.ts`
    - prompt (string): e.g. "Review this file"
    - files (array):
      - path: (local or remote path) name: (optional, a human-friendly hint to
        describe the file's purpose for the LLM)

### **2. Execution Modes**

- Manual (via `workflow_dispatch`)
- PR-triggered (`pull_request`, `pull_request_review`)
- Commit-triggered (`push`)
- File-triggered (on changes to specific paths)
- Comment-triggered (via slash commands or bot handles)

### **3. LLM Context**

- Changed files / diffs
- Entire file contents from local or remote paths
- GitHub metadata (e.g., PR title, description, author)
- PR comments from humans and the LLM Command itself
- Git Commit history

### **4. Two-Tier LLM Execution Engine**

The action employs a two-tier LLM client architecture to optimize token usage
and execution efficiency:

#### **Large Client**

- **Purpose**: Executes the actual command instructions
- **Model**: High-capability models (e.g., GPT-4.1, Claude Sonnet)
- **Usage**: Processes the main command logic, code analysis, and content
  generation
- **Context**: Receives the full context including target files, reference
  files, and PR metadata

#### **Small Client**

- **Purpose**: Executes the planning steps before executing the command
- **Model**: Lightweight, fast models (e.g., GPT-4.1-mini, Claude Haiku)
- **Context**: Receives the command definitions

### **5. Planning**

The planning phase is responsible for analyzing command configurations using the
**small LLM client** before the main command execution. This phase is designed
for efficiency.

#### Responsibilities:

- Infer from the command definition and and the current PR's metadata(PR title,
  description, the list of modified files as well as comments):
  - Whether to include specific files as context beyond those explicitly
    configured
  - Whether to include the full content of files or just the patch(diff)
  - Whether to reference the outputs from other commands already executed
- Produce a **plan object** describing what content should be retrieved or
  generated before invoking the large LLM client

#### Output:

- A deterministic and cacheable execution plan that:
  - Ensures completeness by adding any implicit references inferred from the
    prompt
  - Enables reproducibility by isolating the planning logic into a discrete and
    reviewable step

### **6. Comment Trigger Parsing**

The action supports comment-based invocation using either slash commands or bot
handles:

- Slash command format: `/command_name` (e.g., `/review_graphql_schema`)
- Handle prompt format: `@llm_command "summarize the discussions"`
- The comment handle (e.g., `@llm_command`) is defined in the configuration
  file:
- Only comments on open pull requests are evaluated
- Optional filters for authorized users or roles may be configured (see also:
  future enhancement for fine-grained authorization control)
- Only comments on open pull requests are evaluated
- Optional filters for authorized users or roles may be configured (see also:
  future enhancement for fine-grained authorization control)

### **7. Command Filtering via Workflow Inputs**

- A `commands` input must be passed to the action to specify which commands are
  run in a given job context
- This enables selective execution in response to triggers such as branch type,
  file paths, or user input

### 8. Default Capabilities

The following capabilities are provided and can be utilized by the commands.

- `pr_comment`: If a command produces a textual output and is triggered in a
  pull request context, a comment will be posted automatically with the result.
- `set_output`: All command outputs are automatically exposed as GitHub Action
  outputs for downstream use, without requiring tool declaration.
- `write_file`: If a command generates file output targeting a known path, the
  action will either update the file if it exists or create it if it does not.

## **Non-Goals**

- Real-time chat with the LLM
- Arbitrary code execution or tool calling
- Non-deterministic workflows

## **Configuration Example**

```
handle: llm_command
llm-clients:
  large:
    provider: openai
    options:
      api_key: env.OPENAI_API_KEY
      model: gpt-4.1
    description: "High-capability model for executing command instructions"
  small:
    provider: openai
    options:
      api_key: env.OPENAI_API_KEY
      model: gpt-4.1-mini
    description: "Lightweight model for preprocessing and coordination tasks"

commands:
  review-database-schema:
    description: Reviews database schema files for consistency, normalization, and naming conventions.
    instructions:
      - applyTo: "**/*.sql"
        prompt: |
          Review this SQL schema definition. Check for normalization, naming conventions, and indexing.
          Suggest improvements or raise warnings if there are any anti-patterns.
        files:
          - path: "guidelines/db-schema-style.md"
            name: "Database schema guidelines"
  review-graphql-schema:
    description: Reviews GraphQL schema files for consistency and best practices.
    instructions:
      - applyTo: "**/*.graphql"
        prompt: |
          Review this GraphQL schema file against the provided style and naming guidelines.
          Highlight any issues and suggest improvements.
        files:
          - path: "guidelines/graphql-style.md"
            name: "GraphQL style guide"

  summarize-discussion:
    description: Summarizes the discussion in a pull request thread.
    instructions:
      - applyTo: "."
        prompt: |
          Summarize the conversation between reviewers and authors in this pull request.
          Highlight key concerns, decisions, and remaining open questions.

      - applyTo: "."
        files:
          - path: "."
            name: "Entire PR discussion thread"
    description: Updates or creates the CHANGELOG.md file based on changes in the pull request.
    instructions:
      - applyTo: "**/*"
        prompt: |
          Based on the code changes and PR title and description, generate or update an entry in CHANGELOG.md.
          Maintain consistent formatting and group changes by type (e.g., Feature, Fix, Docs).
        files:
          - path: "CHANGELOG.md"
          - path: "https://example.com/templates/changelog-format.md"
            name: "Changelog formatting template"

```

## **GitHub Actions Usage Examples**

### **Trigger on Pull Request Open or Push to PR**

```
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  llm-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: mahwy/llm-command-action@v1
        with:
          commands: |
            review-graphql-schema
            review-database-schema

```

### **Trigger on Push to Main Branch**

```
on:
  push:
    branches:
      - main

jobs:
  llm-main-ops:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: mahwy/llm-command-action@v1
        with:
          commands: |
            update-changelog

```

### **Trigger via PR Comment (Slash Command or Handle)**

```yaml
on:
  issue_comment:
    types: [created]

jobs:
  llm-comment:
    if: github.event.issue.pull_request
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: mahwy/llm-command-action@v1
        with:
          commands: |
            review-graphql-schema
            update-changelog
```

> The action will parse comments
> like `/review_graphql_schema` or `@llm_command "summarize the discussions"` to
> determine the appropriate command to execute. The handle name
> (e.g., `@llm_command`) is configurable.

## **Security Considerations**

- Logging and redaction for sensitive contexts

## **Milestones**

1. MVP
   - Config parsing
   - LLM Context construction
   - "pr_comment" capability
2. Additional capabilities
3. PR comment-based conversation support

## **Future Enhancements**

- Context Optimization to support large files or length conversations and Git
  commits
- Prompt testing via CLI or GitHub UI
- Auto-suggested commands based on file types or PR history
- Fine-grained authorization rules for comment-triggered commands (e.g.,
  restrict specific commands to org members or reviewers only)
- Read GitHub Copilot Custom Instructions or CLAUDE.MD, AGENT.MD and etc
