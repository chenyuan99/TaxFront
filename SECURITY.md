# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of TaxFront seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability?

Please send an email to [security@taxfront.app](mailto:security@taxfront.app) with the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue
- Your name/handle and contact information (optional)

### What to Expect

1. **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours.
2. **Status Updates**: We will keep you informed of the progress towards fixing the vulnerability.
3. **Resolution Timeline**: We aim to resolve critical issues within 30 days of disclosure.

### Security Measures

TaxFront implements the following security measures:

1. **Data Encryption**
   - All data in transit is encrypted using TLS 1.3
   - Sensitive data at rest is encrypted using Firebase's encryption
   - Client-side encryption for sensitive tax documents

2. **Authentication & Authorization**
   - Firebase Authentication for secure user management
   - JWT-based API authentication
   - Role-based access control

3. **Infrastructure Security**
   - Regular security updates and patches
   - Automated vulnerability scanning
   - Secure cloud infrastructure using Google Cloud Platform

4. **Compliance**
   - GDPR compliance for EU users
   - CCPA compliance for California residents
   - Regular security audits

5. **Best Practices**
   - Input validation and sanitization
   - Protection against XSS and CSRF attacks
   - Rate limiting on API endpoints
   - Secure session management

### Scope

The following are considered in scope for security reports:
- The TaxFront web application (https://tax-front.vercel.app)
- API endpoints (https://us-central1-taxfront-1e142.cloudfunctions.net/*)
- Authentication mechanisms
- File upload/download functionality

### Out of Scope

The following are considered out of scope:
- Denial of Service (DoS) attacks
- Social engineering attacks
- Physical security attacks
- Third-party services/websites
- Issues requiring physical access to a user's device

## Security Headers

We implement the following security headers:
```
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Embedder-Policy: require-corp
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Dependencies

We regularly monitor and update our dependencies for security vulnerabilities using:
- GitHub's Dependabot
- npm audit (frontend)
- safety (backend)
- Snyk vulnerability scanning
