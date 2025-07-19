# Database Schema Style Guidelines

## Table Naming Conventions

### Use Plural Nouns
- **Good**: `users`, `posts`, `comments`
- **Bad**: `user`, `post`, `comment`

### Use Lowercase with Underscores
- **Good**: `user_preferences`, `post_tags`, `email_templates`
- **Bad**: `UserPreferences`, `PostTags`, `EmailTemplates`

### Use Descriptive Names
- **Good**: `user_login_attempts`, `post_view_statistics`
- **Bad**: `attempts`, `stats`

## Column Naming

### Primary Keys
- Always use `id` as the primary key column name
- Use `SERIAL` or `AUTO_INCREMENT` for integer IDs
- Consider `UUID` for distributed systems

### Foreign Keys
- Use the format `{table_name}_id`
- **Good**: `user_id`, `post_id`, `category_id`
- **Bad**: `userId`, `postId`, `catId`

### Timestamps
- Always include `created_at` and `updated_at` for auditable tables
- Use `TIMESTAMP` or `DATETIME` data types
- Set `created_at` to `DEFAULT CURRENT_TIMESTAMP`
- Set `updated_at` to `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

## Indexing Best Practices

### Primary Keys
- Always define primary keys
- Primary keys automatically create unique indexes

### Foreign Keys
- Create indexes on foreign key columns for join performance
- Example: `CREATE INDEX idx_posts_user_id ON posts(user_id);`

### Common Query Patterns
- Index columns frequently used in WHERE clauses
- Index columns used in ORDER BY clauses
- Consider composite indexes for multi-column queries

### Email Fields
- Always create unique indexes on email columns
- Example: `CREATE UNIQUE INDEX idx_users_email ON users(email);`

## Data Types

### String Fields
- Use appropriate length limits
- **Email**: `VARCHAR(255)`
- **Names**: `VARCHAR(100)`
- **Descriptions**: `TEXT` for unlimited length

### Boolean Fields
- Use `BOOLEAN` type when available
- Default to `FALSE` unless there's a specific reason for `TRUE`
- Name clearly: `is_active`, `has_verified_email`

### Numeric Fields
- Use `INT` for most ID fields
- Use `DECIMAL` for monetary values
- Use `FLOAT` only when precision isn't critical

## Constraints

### NOT NULL
- Apply `NOT NULL` to required fields
- Always apply to foreign keys

### Unique Constraints
- Email addresses should be unique
- Usernames should be unique
- Consider unique constraints on business keys

### Check Constraints
- Validate data at the database level
- Example: `CHECK (age >= 0 AND age <= 120)`

## Examples

### Good Table Definition
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

### Bad Table Definition
```sql
CREATE TABLE User (
  ID INT PRIMARY KEY,
  Email VARCHAR(50),
  Name VARCHAR(255),
  Active BOOLEAN
);
```