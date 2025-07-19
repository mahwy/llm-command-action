# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-01-15

### Added
- Database migration system
- Basic user model and repository
- Input validation for user creation

### Fixed
- Configuration loading bug in production environment
- Memory leak in database connection pool

### Security
- Password hashing using bcrypt
- JWT token expiration handling

## [1.1.0] - 2024-01-10

### Added
- Initial project setup
- Basic Express.js server configuration
- Environment variable management
- Basic authentication endpoints

### Changed
- Updated dependencies to latest versions

## [1.0.0] - 2024-01-01

### Added
- Initial release
- User registration and login functionality
- Basic API structure