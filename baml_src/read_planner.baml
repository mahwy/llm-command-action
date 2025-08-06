

class LoadPullRequestDescription {
  reason string @description(#" The reason for including or not including the pull request description. Justify your decision."#)
  shouldInclude bool @description(#" Whether to include the pull request description based on the reason. "#)
}

class LoadPullRequestComments {
  reason string @description(#" The reason for including or not including the pull request comments. Justify your decision."#)
  shouldInclude bool @description(#" Whether to include the pull request comments based on the reason. "#)
}

class FileDiffOption {
  reason string @description(#" The reason for including or not including the diff of the file. Justify your decision. "#)
  shouldInclude bool @description(#" Whether to include the diff of the file based on the reason. "#)
}

class FileFullContentOption {
  reason string @description(#" The reason for including or not including the full content of the file. Justify your decision. "#)
  shouldInclude bool @description(#" Whether to include the full content of the file based on the reason. "#)
}

class LoadPullRequestFiles {
  reason string @description(#" The reason for loading the pull request files. It can load just the metadata(path, number of lines, size) of the file, diffs or the full content of the file. "#)
  shouldInclude bool @description(#" Whether to include the pull request files based on the reason. "#)
  // file path, size, number of lines are loaded by default.
  fileDiffOption FileDiffOption @description(#"(Only applicalbe if shouldInclude is true) The option for including or not including the diff of the file. "#)
  fileFullContentOption FileFullContentOption @description(#"(Only applicalbe if shouldInclude is true) The option for including or not including the full content of the file. Including the full content can be very expensive so only include it if necessary. "#)
}

class LoadDirectoryStructure {
  reason string @description(#" The reason for loading the directory structure of the repository. "#)
  type "directory-structure"
}

class ReadPlannResult {
  // PR title will be loaded by default.
  loadPullRequestDescription LoadPullRequestDescription?
  loadPullRequestComments LoadPullRequestComments
  loadPullRequestFiles LoadPullRequestFiles
  loadDirectoryStructure LoadDirectoryStructure
}

function GetReadPlan(command: Command) -> ReadPlannResult {
  client CustomGPT41Mini // Set OPENAI_API_KEY to use this client.
  prompt #"
    {{ _.role("system")}}
    You are a planning assistant for a code assistant tool. Given a command definition, pick the information necessary to execute the command. 
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
