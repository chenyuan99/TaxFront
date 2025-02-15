# Changelog

All notable changes to TaxFront will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- User registration system with email verification
- Tax calculator with support for multiple states
- Tax forms repository and viewer
- Firebase authentication integration
- Responsive navigation system
- User profile management
- Job tracking system
- Modern UI with Tailwind CSS
- Tax form automation system with browser support
  - Automatic IRS form downloading and caching
  - Support for Form 1040 and W-2 (2024)
  - Field validation with custom rules
  - PDF form filling capabilities
  - Browser automation for complex forms
- New API endpoints for tax form operations
  - GET /api/tax-forms/supported
  - POST /api/tax-forms/fill
- Comprehensive form field definitions
- Browser automation utilities in backend
- Docker configuration improvements
  - Chrome/Chromium support in backend container
  - Enhanced security configurations
  - Health checks for all services

### Changed
- Moved Tax Calculator and Tax Forms to main navigation
- Updated navigation layout for better accessibility
- Updated backend dependencies
  - Added PyPDF2, reportlab for PDF processing
  - Added Selenium and Playwright for browser automation
- Improved Docker configuration
  - Multi-stage builds for smaller images
  - Non-root user execution
  - Volume management for persistent data

### Security
- Implemented secure authentication flow
- Added password strength requirements
- Protected routes for authenticated users

### Fixed
- PDF form field positioning accuracy
- Form validation error handling
- Docker container permissions

## [1.2.0] - 2025-02-15

## [1.1.0] - 2025-01-30

### Added
- Job management system
- Real-time job status updates
- Enhanced error handling
- Progress tracking for long-running tasks

### Changed
- Improved Firebase integration
- Updated React components for better performance
- Enhanced TypeScript type definitions

## [1.0.0] - 2025-01-15

### Added
- Initial release
- User authentication
- Document upload
- Basic tax document processing
- Firebase integration
- React frontend
- Flask backend

## [0.1.0] - 2025-01-25

### Added
- Initial release
- Basic authentication system
- Core tax calculation features
- Fundamental UI components

[Unreleased]: https://github.com/chenyuan99/TaxFront/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/chenyuan99/TaxFront/releases/tag/v0.1.0
