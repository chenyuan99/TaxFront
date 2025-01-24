# TaxFront

[![Vercel](https://vercelbadge.vercel.app/api/chenyuan99/TaxFront)](https://tax-front.vercel.app)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront?ref=badge_shield)
[![Security Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront?ref=badge_shield&issueType=security)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/chenyuan99/TaxFront/frontend.yml)](https://github.com/chenyuan99/TaxFront/actions)

## Description
TaxFront is a modern, secure web application designed to streamline tax document management. It provides an intuitive interface for users to upload, organize, and track their tax documents, with built-in security features and real-time updates.

## Features
- **User Authentication**
  - Secure sign-up and sign-in with Firebase Authentication
  - Role-based access control (users and accountants)
  - OAuth 2.0 support for social login

- **Document Management**
  - Secure document upload with client-side encryption
  - Automatic document type detection
  - Document status tracking
  - Version history and audit trail

- **Dashboard & Analytics**
  - Real-time document status updates
  - Tax summary and insights
  - Document categorization
  - Year-over-year comparison

- **Security**
  - End-to-end encryption
  - CORS protection
  - Rate limiting
  - Input validation and sanitization
  - See [SECURITY.md](SECURITY.md) for details

## Tech Stack
### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Firebase SDK for authentication
- Vercel Analytics for usage tracking

### Backend
- Firebase Cloud Functions (Python)
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Google Cloud Platform

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- Firebase CLI
- Google Cloud SDK

### Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/chenyuan99/TaxFront.git
    cd TaxFront
    ```

2. Install frontend dependencies:
    ```sh
    cd frontend
    npm install
    ```

3. Install backend dependencies:
    ```sh
    cd ../backend/parser/functions
    pip install -r requirements.txt
    ```

4. Set up environment variables:
    ```sh
    # Frontend (.env)
    REACT_APP_FIREBASE_API_KEY=your_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
    REACT_APP_FIREBASE_PROJECT_ID=your_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    REACT_APP_FIREBASE_APP_ID=your_app_id
    REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
    ```

### Development
1. Start the frontend development server:
    ```sh
    cd frontend
    npm run dev
    ```

2. Start the backend functions locally:
    ```sh
    cd backend/parser/functions
    firebase emulators:start
    ```

### Deployment
The application uses GitHub Actions for CI/CD:
- Frontend is automatically deployed to Vercel
- Backend functions are deployed to Firebase
- See `.github/workflows` for configuration

## Testing
- Frontend: `npm test`
- Backend: `python -m pytest`
- E2E: `npm run cypress:run`

## Contributing
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## Security
See [SECURITY.md](SECURITY.md) for security policies and procedures.

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront?ref=badge_large)

## Contact
Yuan Chen - [@chenyuan99](https://github.com/chenyuan99)

Project Link: [https://github.com/chenyuan99/TaxFront](https://github.com/chenyuan99/TaxFront)
