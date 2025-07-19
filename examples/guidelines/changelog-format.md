# Changelog Format Guidelines

## Overview

This guide outlines the standard format for maintaining CHANGELOG.md files in our projects, based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles.

## Structure

### Versioning
- Use semantic versioning (MAJOR.MINOR.PATCH)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Sections
Group changes by type using these standard categories:

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Now removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Chronological Order
- List changes in reverse chronological order (newest first)
- Each version should have a release date
- Use "Unreleased" section for pending changes

## Entry Format

### Basic Structure
```markdown
## [1.2.0] - 2024-01-15

### Added
- New feature description [#123](link-to-issue)
- Another new feature

### Fixed
- Bug fix description [#456](link-to-pr)
- Another bug fix

### Security
- Security improvement description
```

### Writing Guidelines

#### Descriptions
- Write clear, concise descriptions
- Focus on user-facing changes, not implementation details
- Use imperative mood ("Add feature" not "Added feature")
- Start each entry with a capital letter
- Don't end with a period

#### Links
- Link to relevant issues or PRs when available
- Use descriptive link text
- **Good**: `[#123](https://github.com/owner/repo/issues/123)`
- **Good**: `[PR #456](https://github.com/owner/repo/pull/456)`

#### Examples
- **Good**: "Add user authentication with JWT tokens"
- **Bad**: "Implemented authentication system using JWT tokens for user login functionality"

- **Good**: "Fix memory leak in database connection pool"
- **Bad**: "Fixed bug where connections weren't being properly cleaned up"

## Best Practices

### What to Include
- User-facing changes
- API changes
- Breaking changes (always highlight these)
- Security fixes
- Performance improvements
- New features and enhancements

### What to Exclude
- Internal refactoring (unless it affects users)
- Code style changes
- Development tooling changes
- Dependency updates (unless they fix security issues)

### Breaking Changes
- Always highlight breaking changes prominently
- Include migration instructions when possible
- Consider using a separate "BREAKING CHANGES" section for major releases

### Migration Information
- Include upgrade instructions for breaking changes
- Link to migration guides when available
- Provide code examples for API changes

## Complete Example

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dark mode theme support
- Export functionality for user data

## [2.1.0] - 2024-02-01

### Added
- User profile customization [#234](https://github.com/owner/repo/issues/234)
- Bulk operations for admin users [PR #245](https://github.com/owner/repo/pull/245)
- Email notification preferences

### Changed
- Improved search performance by 40%
- Updated user interface for better accessibility

### Fixed
- Memory leak in real-time notifications [#243](https://github.com/owner/repo/issues/243)
- Incorrect date formatting in reports

### Security
- Updated authentication to use secure JWT storage
- Fixed XSS vulnerability in comment system

## [2.0.0] - 2024-01-15

### Added
- Complete API v2 with GraphQL support
- Multi-language support (English, Spanish, French)
- Advanced user roles and permissions

### Changed
- **BREAKING**: API endpoints now use v2 prefix
- **BREAKING**: User ID format changed from integer to UUID
- Redesigned dashboard interface

### Removed
- **BREAKING**: Deprecated API v1 endpoints
- Legacy authentication system

### Fixed
- Database migration issues from v1.x
- Performance bottlenecks in large datasets

### Security
- Implemented rate limiting on all API endpoints
- Added CORS protection

## [1.5.2] - 2023-12-20

### Fixed
- Critical bug in payment processing [#198](https://github.com/owner/repo/issues/198)
- Session timeout handling

### Security
- Updated dependencies to address CVE-2023-12345

## [1.5.1] - 2023-12-10

### Fixed
- Email delivery issues
- Mobile responsive layout problems

## [1.5.0] - 2023-12-01

### Added
- Integration with third-party payment providers
- Advanced search filters
- User activity audit logs

### Changed
- Improved error messages throughout the application
- Enhanced mobile user experience

### Deprecated
- Old payment API (will be removed in v2.0.0)

### Fixed
- Race condition in concurrent user updates
- Memory usage optimization
```

## Tools and Automation

### Automated Generation
- Consider using tools like `conventional-changelog` for automatic generation
- Ensure generated entries follow these guidelines
- Always review and edit automatically generated entries

### Integration with CI/CD
- Validate changelog format in pull requests
- Require changelog updates for feature branches
- Automate version bumping based on changelog categories