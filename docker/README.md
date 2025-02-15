# Docker Configuration for TaxFront

This directory contains Docker-related configurations for the TaxFront application.

## Directory Structure

```
docker/
├── backend/
│   ├── Dockerfile        # Multi-stage Dockerfile for the Python backend
│   └── README.md         # Backend-specific Docker documentation
├── frontend/
│   ├── Dockerfile        # Multi-stage Dockerfile for the React frontend
│   ├── nginx.conf        # Nginx configuration for serving the frontend
│   └── README.md         # Frontend-specific Docker documentation
└── README.md            # This file
```

## Features

- Multi-stage builds for both frontend and backend
- Security best practices:
  - Non-root users
  - Security headers
  - Minimal base images
- Health checks for all services
- Production-ready Nginx configuration
- Container orchestration with Docker Compose
- Volume management for persistent data
- Network isolation
- Environment variable management

## Quick Start

1. Create a `.env` file in the project root with required environment variables:
   ```env
   FRONTEND_PORT=80
   BACKEND_PORT=5000
   FLASK_ENV=production
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_CREDENTIALS=path_to_credentials.json
   DATABASE_URL=your_database_url
   ```

2. Build and start the services:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000

## Development

For development, you can use the following command to mount your local source code:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Production

For production deployment:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Maintenance

- **Logs**: View container logs with `docker-compose logs [service]`
- **Updates**: Rebuild images with `docker-compose build`
- **Cleanup**: Remove unused resources with `docker system prune`

## Health Checks

Both services include health checks:
- Frontend: Checks if Nginx is serving the application
- Backend: Checks if the Flask application is responding

## Security

- Non-root users for both services
- Minimal base images
- Security headers in Nginx
- Network isolation
- Environment variable management
- No sensitive data in images
