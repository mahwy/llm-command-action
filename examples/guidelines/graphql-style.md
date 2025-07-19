# GraphQL Style Guide

## Naming Conventions

### Type Names
- Use **PascalCase** for type names
- Use descriptive, singular nouns
- **Good**: `User`, `BlogPost`, `CommentThread`
- **Bad**: `user`, `blog_post`, `commentthread`

### Field Names
- Use **camelCase** for field names
- Use descriptive names that clearly indicate the field's purpose
- **Good**: `firstName`, `createdAt`, `isPublished`
- **Bad**: `first_name`, `created_at`, `published`

### Enum Values
- Use **SCREAMING_SNAKE_CASE** for enum values
- **Good**: `USER_ROLE { ADMIN, MODERATOR, REGULAR_USER }`
- **Bad**: `UserRole { admin, moderator, regularUser }`

## Schema Design Best Practices

### Non-Null Types
- Always use non-null types (`!`) where appropriate
- Required fields should be non-null
- IDs should almost always be non-null
- **Good**: `id: ID!`, `email: String!`
- **Bad**: `id: ID`, `email: String`

### Pagination
- Implement pagination for list fields that could return large datasets
- Use cursor-based pagination following Relay Connection specification
- **Good**: `posts(first: Int, after: String): PostConnection!`
- **Bad**: `posts: [Post!]!` (for potentially large lists)

### Date and Time
- Use ISO 8601 format for dates
- Prefer `DateTime` scalar type over `String` for dates
- **Good**: `createdAt: DateTime!`
- **Bad**: `createdAt: String!`

### Relationships
- Define clear relationships between types
- Use descriptive field names for relationships
- **Good**: `author: User!`, `comments: [Comment!]!`
- **Bad**: `user: User!`, `data: [SomeType!]!`

## Input Types

### Mutation Inputs
- Use input types for complex mutations
- Group related fields together
- **Good**: `createUser(input: CreateUserInput!): CreateUserPayload!`
- **Bad**: `createUser(name: String!, email: String!, age: Int!): User!`

### Input Naming
- Use descriptive names ending with "Input"
- **Good**: `CreateUserInput`, `UpdatePostInput`
- **Bad**: `UserInput`, `PostData`

## Error Handling

### Error Types
- Define custom error types for better error handling
- Include field-level errors in mutation payloads
- **Good**: 
```graphql
type CreateUserPayload {
  user: User
  errors: [UserError!]!
}

type UserError {
  field: String!
  message: String!
}
```

### Nullable Returns
- Make mutation return types nullable to handle errors gracefully
- Always include an errors field in mutation payloads

## Query Organization

### Root Query Structure
- Keep root queries flat and simple
- Use arguments for filtering and pagination
- **Good**: `users(role: UserRole, first: Int): UserConnection!`
- **Bad**: `adminUsers: [User!]!`, `regularUsers: [User!]!`

### Nested Queries
- Design for efficient data fetching
- Avoid deeply nested structures that could cause N+1 problems
- Consider using DataLoader for efficient batching

## Documentation

### Field Descriptions
- Add descriptions to all public fields
- Use clear, concise language
- **Good**: 
```graphql
type User {
  """The user's unique identifier"""
  id: ID!
  
  """The user's email address (must be unique)"""
  email: String!
}
```

### Deprecation
- Use `@deprecated` directive with clear migration instructions
- **Good**: `oldField: String @deprecated(reason: "Use newField instead")`

## Examples

### Well-Designed Schema
```graphql
scalar DateTime

type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  posts(first: Int, after: String): PostConnection!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  publishedAt: DateTime
  isPublished: Boolean!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type Mutation {
  createPost(input: CreatePostInput!): CreatePostPayload!
}

input CreatePostInput {
  title: String!
  content: String!
}

type CreatePostPayload {
  post: Post
  errors: [ValidationError!]!
}
```

### Poorly Designed Schema
```graphql
type user {
  ID: String
  email: string
  name: string
  posts: [post]
}

type post {
  ID: String
  title: string
  content: string
  created_at: string
}

type Query {
  getAllUsers: [user]
  getAllPosts: [post]
}
```