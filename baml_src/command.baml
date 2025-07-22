
class CommandOuputInPullRequest {
  command string @description(#"
    The name of the command that generated this output.
  "#)
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
  patch string?
}



function ExecuteCommandInPullRequest(inputPrompt: string, targetFiles: File[], pullRequest: PullRequest, referenceFiles: File[], otherCommandOutputs: CommandOuputInPullRequest[]) -> CommandOuputInPullRequest {
  // Specify a client as provider/model-name
  // you can use custom LLM params with a custom client name from clients.baml like "client CustomHaiku"
  client CustomGPT41 // Set OPENAI_API_KEY to use this client.
  prompt #"

    {{ _.role("system")}}
    Execute a given prompt for given target files and a pull request and return the ouput response. Refer to the pull requeest metadata, reference files and other command outputs for context.

    {{ _.role("user")}}

    {{ inputPrompt }}

    {% if targetFiles %}
    <targetFiles>
    {% for f in targetFiles %}
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
    {% if f.patch %}
    <patch>
    {{f.patch}}
    </patch>
    {% endif %}
    </file>
    {% endfor %}
    </targetFiles>
    {% endif %}

    {% if pullRequest %}
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
    {% endif %}


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

    {% if otherCommandOutputs %}
    <otherCommandOutputs>
    {% for o in otherCommandOutputs %}
    <commandOutput>
    <command>
    {{o.command}}
    </command>
    <summary>
    {{o.summary}}
    </summary>
    <pullRequestComment>
    {{o.pull_request_comment}}
    </pullRequestComment>    
    </commandOutput>
    {% endfor %}
    </otherCommandOutputs>
    {% endif %}

    {{ ctx.output_format }}
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
    otherCommandOutputs []
  }
}

test graphql_schema_review {
  functions [ExecuteCommandInPullRequest]
  args {
    inputPrompt #"
      Review this GraphQL schema file against the provided style and naming guidelines.
      Highlight any issues and suggest improvements.
      Please write the response in markdown format in a concise manner.
    "#
    targetFiles [
      {
        path "schema.graphql"
        content #"
          type User {
            id: ID!
            name: String!
            email: String!
            posts: [Post!]!
          }

          type Post {
            id: ID!
            title: String!
            content: String!
            author: User!
            createdAt: String!
          }

          type Query {
            user(id: ID!): User
            posts: [Post!]!
          }

          type Mutation {
            createPost(title: String!, content: String!, authorId: ID!): Post!
          }
        "#
      }
    ]
    pullRequest {
      title "Add GraphQL schema for blog posts"
      body "This PR introduces the initial GraphQL schema for our blog functionality, including User and Post types."
      comments [
        { 
          author "reviewer", 
          body "The schema looks good overall, but we should consider adding pagination for the posts query." 
        },
        { 
          author "author", 
          body "Good point about pagination. Should I use cursor-based or offset-based pagination?" 
        }
      ]
    }
    referenceFiles [
      {
        path "guidelines/graphql-style.md"
        name "GraphQL style guide"
        content #"
          # GraphQL Style Guide

          ## Naming Conventions
          - Use PascalCase for type names
          - Use camelCase for field names
          - Use descriptive names that clearly indicate the field's purpose

          ## Best Practices
          - Always use non-null types (!) where appropriate
          - Implement pagination for list fields that could return large datasets
          - Use ISO 8601 format for dates (DateTime scalar type preferred over String)
          - Group related fields into separate types when appropriate
        "#
      }
    ]
    otherCommandOutputs []
  }
}

test discussion_summarization {
  functions [ExecuteCommandInPullRequest]
  args {
    inputPrompt #"
      Summarize the conversation between reviewers and authors in this pull request.
      Highlight key concerns, decisions, and remaining open questions.
      Please write the response in markdown format in a concise manner.
    "#
    targetFiles [
      {
        path "."
        content ""
      }
    ]
    pullRequest {
      title "Refactor authentication system to use JWT tokens"
      body #"
        This PR refactors our authentication system to use JWT tokens instead of session-based authentication.
        
        ## Changes
        - Replace session middleware with JWT verification
        - Add token refresh mechanism
        - Update user login/logout endpoints
        - Add proper error handling for expired tokens
        
        ## Breaking Changes
        - Clients will need to store JWT tokens instead of relying on cookies
        - Token expiration is now 24 hours instead of indefinite session
      "#
      comments [
        {
          author "security_reviewer"
          body #"
            This looks good overall, but I have a few security concerns:
            
            1. Are we storing the JWT secret securely?
            2. Should we implement token blacklisting for logout?
            3. 24 hours seems long for token expiration - maybe 1 hour with refresh tokens?
          "#
        },
        {
          author "author"
          body #"
            Thanks for the review! Addressing your points:
            
            1. Yes, JWT secret is stored in environment variables and rotated monthly
            2. Good point about blacklisting - I'll add a Redis-based token blacklist
            3. I chose 24h based on UX feedback, but we do have refresh tokens. Open to shorter if team prefers.
          "#
        },
        {
          author "frontend_dev"
          body #"
            How will this affect the mobile app? We'll need to update token storage there too.
            Also, what's the migration plan for existing users?
          "#
        },
        {
          author "author"
          body #"
            @frontend_dev Great questions:
            
            - Mobile app will need updates to store tokens in secure storage
            - Migration: existing sessions will remain valid until expiry, then users login normally
            - I'll create a separate ticket for mobile app updates
          "#
        },
        {
          author "security_reviewer"
          body #"
            Sounds good on the blacklisting. For token expiration, let's go with 1 hour for now - we can always increase it later if users complain.
            
            Also, please make sure we're validating the token signature properly and checking issuer claims.
          "#
        },
        {
          author "author"
          body #"
            @security_reviewer Will do! I'll update to 1 hour expiration and add the additional JWT validation you mentioned.
          "#
        }
      ]
    }
    referenceFiles []
    otherCommandOutputs []
  }
}

test changelog_generation {
  functions [ExecuteCommandInPullRequest]
  args {
    inputPrompt #"
      Based on the code changes and PR title and description, generate or update an entry in CHANGELOG.md.
      Maintain consistent formatting and group changes by type (e.g., Feature, Fix, Docs).
      Please write the response in markdown format in a concise manner.
    "#
    targetFiles [
      {
        path "src/api/users.ts"
        content #"
          export class UserService {
            async createUser(userData: CreateUserRequest): Promise<User> {
              // Validate required fields
              if (!userData.email || !userData.name) {
                throw new Error('Email and name are required');
              }
              
              // Check for existing user
              const existingUser = await this.findByEmail(userData.email);
              if (existingUser) {
                throw new Error('User with this email already exists');
              }
              
              // Create new user with hashed password
              const hashedPassword = await bcrypt.hash(userData.password, 10);
              return await this.userRepository.create({
                ...userData,
                password: hashedPassword,
                createdAt: new Date()
              });
            }
            
            async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<User> {
              const user = await this.userRepository.findById(userId);
              if (!user) {
                throw new Error('User not found');
              }
              
              return await this.userRepository.update(userId, {
                ...updates,
                updatedAt: new Date()
              });
            }
          }
        "#
      },
      {
        path "src/api/auth.ts"
        content #"
          export class AuthService {
            async login(email: string, password: string): Promise<{ token: string; user: User }> {
              const user = await this.userService.findByEmail(email);
              if (!user) {
                throw new Error('Invalid credentials');
              }
              
              const isPasswordValid = await bcrypt.compare(password, user.password);
              if (!isPasswordValid) {
                throw new Error('Invalid credentials');
              }
              
              // Generate JWT token with 1 hour expiration
              const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
              );
              
              return { token, user: this.sanitizeUser(user) };
            }
          }
        "#
      }
    ]
    pullRequest {
      title "Add user management and authentication APIs"
      body #"
        This PR adds comprehensive user management and authentication functionality:

        ## Features Added
        - User registration with validation and duplicate checking
        - User profile updates
        - JWT-based authentication with 1-hour token expiration
        - Password hashing using bcrypt
        - Proper error handling for invalid credentials

        ## Security Improvements
        - Passwords are hashed before storage
        - JWT tokens have reasonable expiration times
        - Input validation for required fields
        - Sanitized user data in responses

        ## Breaking Changes
        None - this is new functionality.

        ## Testing
        - Added unit tests for UserService and AuthService
        - Integration tests for auth endpoints
      "#
      comments [
        {
          author "reviewer"
          body "The implementation looks solid. Are we planning to add rate limiting for the auth endpoints?"
        },
        {
          author "author"
          body "Good point! I'll add that in a follow-up PR focused on security enhancements."
        }
      ]
    }
    referenceFiles [
      {
        path "CHANGELOG.md"
        content #"
          # Changelog

          All notable changes to this project will be documented in this file.

          The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
          and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

          ## [Unreleased]

          ## [1.2.0] - 2024-01-15

          ### Added
          - Database migration system
          - Basic user model and repository

          ### Fixed
          - Configuration loading bug in production environment

          ## [1.1.0] - 2024-01-10

          ### Added
          - Initial project setup
          - Basic Express.js server configuration
          - Environment variable management
        "#
      },
      {
        path "https://example.com/templates/changelog-format.md"
        name "Changelog formatting template"
        content #"
          # Changelog Format Guidelines

          ## Structure
          - Use semantic versioning (MAJOR.MINOR.PATCH)
          - Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security
          - List changes in reverse chronological order

          ## Entry Format
          ```markdown
          ### Added
          - New feature description [#123](link-to-issue)

          ### Fixed
          - Bug fix description [#456](link-to-pr)
          ```

          ## Best Practices
          - Write clear, concise descriptions
          - Link to relevant issues or PRs when available
          - Focus on user-facing changes
          - Avoid technical implementation details
        "#
      }
    ]
    otherCommandOutputs []
    
  }
}


test large_pr_with_multiple_files {
  functions [ExecuteCommandInPullRequest]
  args {
    inputPrompt #"
      Review these files as part of a major refactoring effort. Focus on architecture changes and potential breaking changes.
      Please write the response in markdown format in a concise manner.
    "#
    targetFiles [
      {
        path "src/models/User.ts"
        content #"
          export interface User {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            createdAt: Date;
            updatedAt: Date;
          }
          
          export enum UserRole {
            ADMIN = 'admin',
            USER = 'user',
            MODERATOR = 'moderator'
          }
        "#
      },
      {
        path "src/services/UserService.ts"
        content #"
          import { User, UserRole } from '../models/User';
          
          export class UserService {
            async createUser(userData: Partial<User>): Promise<User> {
              // Implementation here
              return {} as User;
            }
            
            async getUsersByRole(role: UserRole): Promise<User[]> {
              // Implementation here
              return [];
            }
          }
        "#
      },
      {
        path "src/controllers/UserController.ts"
        content #"
          import { Request, Response } from 'express';
          import { UserService } from '../services/UserService';
          
          export class UserController {
            constructor(private userService: UserService) {}
            
            async createUser(req: Request, res: Response): Promise<void> {
              try {
                const user = await this.userService.createUser(req.body);
                res.status(201).json(user);
              } catch (error) {
                res.status(400).json({ error: error.message });
              }
            }
          }
        "#
      }
    ]
    pullRequest {
      title "Major refactor: Migrate to TypeScript and implement clean architecture"
      body #"
        This is a major refactoring effort that includes:
        
        ## Changes
        - Migrate entire codebase from JavaScript to TypeScript
        - Implement clean architecture with proper separation of concerns
        - Add proper error handling and validation
        - Introduce dependency injection pattern
        
        ## Breaking Changes
        - API response formats have changed
        - Database schema updates required
        - Configuration file format changed
        
        ## Migration Guide
        - Run database migrations before deployment
        - Update client applications to use new API response formats
        - Update environment configuration files
      "#
      comments [
        {
          author "lead_dev"
          body "This is a significant change. Let's make sure we have proper rollback procedures in place."
        },
        {
          author "qa_engineer"
          body "I'll need at least a week to update all our test suites for this change."
        }
      ]
    }
    referenceFiles [
      {
        path "docs/architecture.md"
        name "Architecture guidelines"
        content #"
          # Architecture Guidelines
          
          ## Principles
          - Separation of concerns
          - Dependency inversion
          - Single responsibility
          
          ## Folder Structure
          - models/ - Data models and interfaces
          - services/ - Business logic
          - controllers/ - HTTP request handlers
          - repositories/ - Data access layer
        "#
      }
    ]
    otherCommandOutputs []
  }
}
