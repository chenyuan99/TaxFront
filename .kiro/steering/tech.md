# TaxFront Technology Stack

## Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS for utility-first CSS
- **Routing**: React Router DOM v6
- **Authentication**: Firebase SDK v10.8.0
- **State Management**: React hooks with Firebase hooks
- **UI Components**: Lucide React for icons, custom components
- **Analytics**: Vercel Analytics
- **AI Integration**: CopilotKit for chat functionality

## Backend Stack
- **Runtime**: Firebase Cloud Functions (Python 3.12+)
- **Database**: Cloud Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Authentication**: Firebase Authentication
- **AI/ML**: LangChain with OpenAI, Vertex AI, and Ollama support
- **Document Processing**: PyPDF2, Tesseract OCR, Pillow
- **Vector Search**: FAISS for document embeddings
- **Web Framework**: Flask for local development

## Development Tools
- **Package Managers**: npm (frontend), pip (backend)
- **Linting**: ESLint for TypeScript/React
- **Testing**: pytest (backend), built-in Vite testing
- **Code Formatting**: Black (Python)
- **Type Checking**: TypeScript strict mode

## Deployment & Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Frontend Hosting**: Vercel, Firebase Hosting
- **Backend**: Firebase Cloud Functions
- **CI/CD**: GitHub Actions
- **Monitoring**: Firebase Analytics, Cloud Logging

## Common Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server (port 5173)
npm run build       # Build for production
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt    # Install Python dependencies
python app.py                     # Run Flask development server
firebase emulators:start          # Start Firebase emulators

# For Cloud Functions
cd backend/parser/functions
pip install -r requirements.txt
firebase deploy --only functions  # Deploy functions
```

### Testing
```bash
# Backend testing
cd backend
python -m pytest                 # Run all tests
python -m pytest --coverage     # Run with coverage

# Frontend testing
cd frontend
npm test                         # Run tests
```

### Docker Development
```bash
docker-compose up --build        # Build and start all services
docker-compose down              # Stop all services
docker-compose logs backend      # View backend logs
```

## Environment Configuration
- Frontend: `.env` files with `VITE_` prefixed variables
- Backend: Environment variables for Firebase credentials
- Docker: `.env` file for container configuration
- Firebase: `firebase.json` for function configuration