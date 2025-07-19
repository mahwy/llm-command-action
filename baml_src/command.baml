
class CommandOuputInPullRequest {
  pull_request_comment string @description(#"
    A comment to add to the pull request as a response to the command.
  "#)
  summary string @description(#"
    A summary of the input prompt and the output response.
  "#)
}

class PullRequest {
  title string
  body string
  comments Comment[]
}

class Comment {
  author string
  body string
}

class File {
  name string?
  path string
  content string
}



function ExecuteCommandInPullRequest(inputPrompt: string, targetFiles: File[], pullRequest: PullRequest, referenceFiles: File[]) -> CommandOuputInPullRequest {
  // Specify a client as provider/model-name
  // you can use custom LLM params with a custom client name from clients.baml like "client CustomHaiku"
  client "openai/gpt-4o" // Set OPENAI_API_KEY to use this client.
  prompt #"

    {{ _.role("system")}}
    Execute a given prompt for given target files and a pull request and return the ouput response.

    {{ _.role("user")}}

    {{ inputPrompt }}

    <targetFiles>
    {% for f in targetFiles %}
    <file>
    {{f.path}}
    </file>
    {% endfor %}
    </targetFiles>

    <pullRequest>
    <title>
    {{ pullRequest.title }}
    </title>
    <body>
    {{ pullRequest.body }}
    </body>
    <comments>
    {% for c in pullRequest.comments %}
    <comment>
    <author>
    {{ c.author }}
    </author>
    <body>
    {{ c.body }}
    </body>
    </comment>
    {% endfor %}
    </pullRequest>
    
    {{ ctx.output_format }}

    <referenceFiles>
    {% for f in referenceFiles %}
    <file>
    {% if f.name %}
    <name>
    {{f.name}}
    </name>
    {% endif %}
    <path>
    {{f.path}}
    </path>
    <content>
    {{f.content}}
    </content>
    </file>
    {% endfor %}
    </referenceFiles>
  "#
}



test sql_schema_review {
  functions [ExecuteCommandInPullRequest]
  args {
    inputPrompt #"
      Review this SQL schema definition. Check for normalization, naming conventions, and indexing.
      Suggest improvements or raise warnings if there are any anti-patterns.
      Please write the response in markdown format in a concise manner.
    "#
    targetFiles [
      {
        path "schema.sql"
        content #"
          CREATE TABLE user (
            id INT PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255)
          );

          CREATE TABLE post (
            id INT PRIMARY KEY,
            title VARCHAR(255),
            content TEXT,
            user_id INT,
            FOREIGN KEY (user_id) REFERENCES user(id)
          );

          CREATE INDEX idx_posts_user_id ON post(user_id);
        "#
      }
    ]
    pullRequest {
      title "Add indexes to improve performance"
      body "We need to add indexes to improve the performance of the queries."
      comments [
        { author "John Doe", body "Looks good to me." }
      ]
    }
    referenceFiles [
      {
        path "guidelines/db-schema-style.md"
        content #"
          # Database Schema Style Guidelines

          ## Table Naming
          - Use plural nouns for table names.
          - Use lowercase with underscores for table names.
          - Use descriptive names that reflect the data they contain.
        "#
      }
    ]
  }
}
