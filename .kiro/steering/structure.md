# TaxFront Project Structure

## Root Level Organization
```
TaxFront/
├── frontend/           # React TypeScript application
├── backend/           # Python Flask app and Cloud Functions
├── functions/         # Root-level Firebase Functions
├── docs/             # Documentation and API specs
├── docker/           # Docker configuration files
├── sample/           # Sample data and test files
└── api-docs/         # OpenAPI specifications
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── components/    # React components (PascalCase naming)
│   ├── services/      # API service layers
│   ├── types/         # TypeScript type definitions
│   └── pages/         # Page components (currently empty)
├── dist/             # Build output (generated)
├── node_modules/     # Dependencies (generated)
└── public assets in root (index.html, manifest.json)
```

### Component Organization
- **Auth Components**: `Auth.tsx`, `Register.tsx`, `Profile.tsx`
- **Dashboard Components**: `Dashboard.tsx`, `AccountantDashboard.tsx`
- **Document Components**: `DocumentList.tsx`, `DocumentUpload.tsx`
- **Tax Components**: `TaxCalculator.tsx`, `TaxForms.tsx`, `TaxFiling.tsx`
- **Layout Components**: `Navbar.tsx`, `Navigation.tsx`, `Footer.tsx`
- **Utility Components**: `Chat.tsx`, `CookieBanner.tsx`, `StorageTest.tsx`
- **Static Pages**: `About.tsx`, `Contact.tsx`, `Privacy.tsx`, `TermsOfService.tsx`

## Backend Structure (`backend/`)
```
backend/
├── src/              # Source code modules
│   ├── openai/       # OpenAI integration
│   ├── vertexai/     # Google Vertex AI integration
│   └── ollama/       # Ollama integration
├── parser/           # Document parsing Cloud Functions
│   └── functions/    # Firebase Functions code
├── embedding/        # Document embedding functions
├── tax_forms/        # Tax form processing modules
├── tools/           # Utility tools (calculator, etc.)
├── utils/           # Shared utilities
├── prompts/         # AI prompt templates
├── sample/          # Sample data and schemas
├── faiss_index/     # Vector search index files
└── logs/            # Application logs
```

## Key Configuration Files

### Frontend Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - TailwindCSS configuration
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (VITE_ prefixed)

### Backend Configuration
- `requirements.txt` - Python dependencies
- `firebase.json` - Firebase project configuration
- `app.py` - Flask application entry point
- `.env` - Environment variables for local development

### Docker Configuration
- `docker-compose.yml` - Multi-container orchestration
- `docker/frontend/Dockerfile` - Frontend container build
- `docker/backend/Dockerfile` - Backend container build

## Naming Conventions

### Files and Directories
- **React Components**: PascalCase (e.g., `TaxCalculator.tsx`)
- **Python Modules**: snake_case (e.g., `tax_forms.py`)
- **Configuration Files**: lowercase with extensions (e.g., `firebase.json`)
- **Directories**: lowercase with hyphens or underscores

### Code Conventions
- **TypeScript**: PascalCase for components, camelCase for functions/variables
- **Python**: snake_case for functions/variables, PascalCase for classes
- **CSS Classes**: TailwindCSS utility classes
- **API Endpoints**: kebab-case URLs (e.g., `/tax-forms/supported`)

## Import Patterns

### Frontend Imports
```typescript
// External libraries first
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Internal components
import { Auth } from './components/Auth.tsx';
import { Dashboard } from './components/Dashboard.tsx';

// Services and utilities
import { auth } from './firebase.ts';
```

### Backend Imports
```python
# Standard library
import json
from datetime import datetime

# Third-party packages
import firebase_admin
from firebase_functions import https_fn
from flask import Flask, request

# Local modules
from .parser import TaxDocumentParser
```

## Environment-Specific Files
- **Development**: `.env`, `.env.example`
- **Production**: Environment variables in deployment platform
- **Docker**: `.env` for container configuration
- **Firebase**: Service account JSON files (gitignored)

## Testing Structure
- **Frontend**: Tests alongside components (when implemented)
- **Backend**: `test/` directory with pytest files
- **Integration**: Docker-based testing environment