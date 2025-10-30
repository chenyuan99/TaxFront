# TaxFront Product Overview

TaxFront is a modern, secure web application designed to streamline tax document management and form automation. The platform provides an intuitive interface for users to upload, organize, and track their tax documents with built-in security features and real-time updates.

## Core Features

- **User Authentication**: Firebase-based authentication with role-based access control (users and accountants)
- **Document Management**: Secure document upload with client-side encryption, automatic document type detection, and status tracking
- **Tax Form Automation**: Automatic IRS form downloading, field validation, PDF form filling, and browser-based automation for complex forms
- **Dashboard & Analytics**: Real-time document status updates, tax summary insights, and document categorization
- **Security**: End-to-end encryption, CORS protection, rate limiting, and input validation

## User Types

- **Regular Users**: Individual taxpayers managing their tax documents
- **Accountants**: Professional users with enhanced dashboard and client management features (identified by email containing 'accountant')

## Key Business Logic

- Documents are automatically processed upon upload using Firebase Cloud Functions
- Document processing includes text extraction, metadata parsing, and status tracking
- User profiles store tax-related information including tax ID and business type
- Real-time updates are provided through Firebase Firestore listeners