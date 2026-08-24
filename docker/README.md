# Docker Configuration for TaxFront

This directory contains Docker-related configurations for the TaxFront application.

Docker packages the **frontend only**. Server-side work runs on Firebase Cloud Functions
(`functions/`), which are deployed with the Firebase CLI rather than containerized —
see the root `README.md`.

## Directory Structure

```
docker/
├── frontend/
│   ├── Dockerfile        # Multi-stage Dockerfile for the React frontend
│   └── nginx.conf        # Nginx configuration for serving the frontend
└── README.md             # This file
```

## Features

- Multi-stage build for the frontend
- Security best practices:
  - Non-root user
  - Security headers
  - Minimal base image
- Health check
- Production-ready Nginx configuration
- Network isolation
- Environment variable management

## Quick Start

1. Create a `.env` file in the project root with required environment variables:
   ```env
   FRONTEND_PORT=80
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

   These are build arguments baked into the bundle at build time. The app reaches the
   backend through Firebase callable functions, so no API URL is configured here.

2. Build and start:
   ```bash
   docker-compose up --build
   ```

3. Access the application at http://localhost:80

## Maintenance

- **Logs**: View container logs with `docker-compose logs frontend`
- **Updates**: Rebuild the image with `docker-compose build`
- **Cleanup**: Remove unused resources with `docker system prune`

## Health Checks

The frontend container checks that Nginx is serving the application.

## Security

- Non-root user
- Minimal base image
- Security headers in Nginx
- Network isolation
- Environment variable management
- No sensitive data in images
