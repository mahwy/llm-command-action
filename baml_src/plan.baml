
class Command {
  name string
  description string
  instructions CommandInstruction
}

class CommandInstruction {
  applyTo string?
  prompt string
  files CommandReferenceFile[]
  modifiedOnly bool?
}

class CommandReferenceFile {
  name string?
  path string
}

class PullRequestForPlan {
  title string
  body string
  comments PullRequestCommentForPlan[]
  files PullRequestFileForPlan[]
}

class PullRequestCommentForPlan {
  author string
  body string
}

class PullRequestFileForPlan {
  filename string
  status "added" | "modified" | "removed" | "renamed"
}

class CommandPlan {
  name string
  loadFiles LoadFileIntoContext[]
  loadCommandOutputs LoadCommandOutputIntoContext[]
}

class LoadFileIntoContext {
  reason string @description(#"
    The reason for loading the file into the context
  "#)
  fullContent bool @description(#"
    Whether to load the full content of the file or just the patch(diff)
  "#)
  path string @description(#"
    The path of the file to load into the context
  "#)
}

class LoadCommandOutputIntoContext {
  reason string @description(#"
    The reason for loading the command output into the context
  "#)
  commandName string @description(#"
    The name of the command that generated the output
  "#)
}

class PlanResult {
  plans CommandPlan[]
}

function Plan(pullRequest: PullRequestForPlan, commands: Command[]) -> PlanResult {
  client CustomGPT41Mini // Set OPENAI_API_KEY to use this client.
  prompt #"
    {{ _.role("system")}}
    Plan the execution of the commands for the given pull request.

    {{ _.role("user")}}

    <pullRequest>
    <title>
    {{ pullRequest.title }}
    </title>
    <body>
    {{ pullRequest.body }}
    </body>
    <files>
    {% for f in pullRequest.files %}
    <file>
    {{ f.filename }}
    </file>
    {% endfor %}
    </files>
    </pullRequest>

    The following commands are defined:
    ```yaml
    {% for c in commands %}
    {{ c.name }}:
      description:
        {{ c.description }}
      instructions:
        - applyTo: '{{ c.instructions.applyTo }}'
          modifiedOnly: {{ c.instructions.modifiedOnly }}
          prompt: |
            {{ c.instructions.prompt }}

            {% if c.instructions.files %}
            files:
            {% for f in c.instructions.files %}            
              - path: '{{ f.path }}'
                {% if f.name %}
                name:  '{{ f.name }}'   
                {% endif %}
              {% endfor %}
            {% endif %}              
    {% endfor %}
    ```

    {{ ctx.output_format }}
  "#
}

test plan_single_command {
  functions [Plan]
  args {
    pullRequest {
      title "Add indexes to improve performance"
      body "We need to add indexes to improve the performance of the queries."
      comments []
      files [
        {
          filename "examples/sql-database/schema.sql"
          status "modified"
        }
      ]
    }
    commands [
      {
        name "review-database-schema"
        description "Reviews database schema files for consistency, normalization, and naming conventions."
        instructions {
          modifiedOnly true
          prompt "Review this SQL schema definition. Check for normalization, naming conventions, and indexing. Suggest improvements or raise warnings if there are any anti-patterns."
          files [
            {
              path "https://github.com/...../guidelines/db-schema-style.md"
              name "Database schema guidelines"
            }
          ]
        }
      }
    ]
  }
}

test plan_multiple_commands {
  functions [Plan]
  args {
    pullRequest {
      title "Add feature xyz"
      body "We need to add feature xyz to the application."
      comments []
      files [
        {
          filename "src/feature-xyz.ts"
          status "added"
        }
        {
          filename "src/feature-xyz.spec.ts"
          status "added"
        }
        {
          filename "src/database/schema.sql"
          status "modified"
        }
      ]
    }
    commands [
      {
        name "review-database-schema"
        description "Reviews database schema files for consistency, normalization, and naming conventions."
        instructions {
          applyTo "examples/sql-database/**/*.sql"
          modifiedOnly true
          prompt "Review this SQL schema definition. Check for normalization, naming conventions, and indexing. Suggest improvements or raise warnings if there are any anti-patterns."
          files [
            {
              path "https://github.com/...../guidelines/db-schema-style.md"
              name "Database schema guidelines"
            }
          ]
        }
      }
      {
        name "summarize-reviews"
        description "Summarizes the reviews of the pull request."
        instructions {
          applyTo "none"
          prompt #"
            Generate a summary of the reviews of the pull request.
          "#
          files []
        }
      }
    ]
  }
}
