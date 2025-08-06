
class LoadPullRequestTitle {
  purpose string @description(#" The purpose for loading the pull request title. "#)
  type "pr-title"
}

class LoadPullRequestDescription {
  purpose string @description(#" The purpose for loading the pull request title. "#)
  type "pr-description"
}

class LoadPullRequestComments {
  purpose string @description(#" The purpose for loading the pull request comments. "#)
  type "pr-comments"
}

class LoadPullRequestFiles {
  purpose string @description(#" The purpose for loading the pull request files. "#)
  type "pr-files"
  includeNumberOfLines bool @description(#" Whether to include the number of lines in the file. "#)
  includeFileSize bool @description(#" Whether to include the size of the file. "#)    
  includeDiff bool @description(#" Whether to include the diff of the file. "#)
}

class LoadDirectoryStructure {
  purpose string @description(#" The purpose for loading the directory structure of the repository. "#)
  type "directory-structure"
}

type PullRequestContextItem = LoadPullRequestTitle | LoadPullRequestDescription | LoadPullRequestComments | LoadPullRequestFiles | LoadDirectoryStructure

class ReadPlannResult {
  pullRequestContextItemsToLoad PullRequestContextItem[] @description(#"
    Necessary information to execute the command.
  "#)
}

function GetReadPlan(command: Command) -> ReadPlannResult {
  client CustomGPT41Nano // Set OPENAI_API_KEY to use this client.
  prompt #"
    {{ _.role("system")}}
    Given a command definition, pick the information necessary to execute the command. 
    {{ _.role("user")}}

    <command_definition>
    <name>
    {{ command.name }}
    </name>
    <description>
    {{ command.description }}
    </description>
    <instructions>
    <prompt>
    {{ command.instructions.prompt }}
    </prompt>
    </command_definition>
    {{ ctx.output_format }}
  "#
}


test test_review_database_schema {
  functions [GetReadPlan]
  args {
    command {
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
  }
}


test test_summarize_reviews {
  functions [GetReadPlan]
  args {
    command {
        name "summarize-reviews"
        description "Summarizes the reviews of the pull request."
        instructions {
          prompt #"
            Generate a summary of the reviews of the pull request.
          "#
          files []
        }
  
      }
  }

}
test test_pr_title_desc_lint {
  functions [GetReadPlan]
  args {
    command {
        name "pr-title-desc-lint"
        description "Ensure the pull request title and description is following the guidelines."
        instructions {
          prompt #"
            Review the pull request description and ensure it is following the guidelines.
            - The title should be a short summary of the pull request.
            - The title should be prefix with conventional commit message prefix.
            - The title must end with a JIRA issue key.
          "#
          files []
        }
      }
  }
}

test test_pr_desc_verification {
  functions [GetReadPlan]
  args {
    command {
        name "pr-desc-verification"
        description "Ensure the pull request description is matching the actual changes."
        instructions {
          prompt #"
            Verify the pull request description is matching the actual changes.
          "#
          files []
        }
      }
  }
}


test test_file_organization{
  functions [GetReadPlan]
  args {
    command {
        name "file-organization-verification"
        description "Ensure the files are added to the correct directory following the code organization guidelines."
        instructions {
          prompt #"
            Verify the files are added to the correct directory following the code organization guidelines.
            - The test files must be under the './test' directory.
            - The source files must be under the './src' directory.
            - The documentation files must be under the './docs' directory.
            - The configuration files must be under the './config' directory.
            - There should be less than 100 files in each directory.
          "#
          files []
        }
      }
  }
}
