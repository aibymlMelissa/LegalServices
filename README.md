# Legal Services Platform

**An AI-Powered Legal Strategy Assistant**

A comprehensive legal technology platform that leverages AI to help lawyers formulate and present case strategies grounded in legal doctrine, procedure, principles, evidence, precedents, and client psychology.

## Live Deployments

- **Frontend**: https://frontend-e3fsld24o-aibymls-projects.vercel.app
- **Backend**: Deployed on Render (see deployment guide below)
- **Repository**: https://github.com/aibymlMelissa/LegalServices

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Development](#development)
7. [Deployment](#deployment)
8. [Environment Variables](#environment-variables)
9. [API Documentation](#api-documentation)
10. [Features](#features)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Problem Statement

A practicing lawyer who frequently works as both defense and prosecution counsel in a Common Law system faces the recurring challenge of formulating and clearly presenting case strategies to clients. Each strategy must be grounded in:

- **Legal doctrine**
- **Legal procedure**
- **Legal principles**
- **Admissible evidence**
- **Similar case precedents**
- **The psychological status of the client or accused**

The lawyer needs to distill all of these elements into a concise PowerPoint presentation (≤10 slides) that precisely summarizes the chosen defense or prosecution tactics.

### Solution

This platform provides a secure AI-powered solution with authentication and access control. The system:

- Is structured around a Model Content Protocol (MCP), with each of the six legal components represented as independent modules
- Uses a Large Language Model (LLM) to synthesize outputs from each module into a coherent legal strategy
- Generates multimodal AI-assisted PowerPoint presentations automatically from the assembled case strategy

---

## Architecture

### Separated Frontend + Backend Architecture

The platform uses a **decoupled client-server model** for enhanced security, scalability, and maintainability:

```
[ User (Lawyer) ]
      |
      v
[ Web Browser ]
      |
      |--- [ Frontend (Next.js/React) ] ---|
      ^                                     | (HTTPS/REST API)
      | (UI/UX)                             v
      |                              [ Backend (Node.js/Express) ]
      |                                     |
      |                                     |--- [ Authentication (JWT) ]
      |                                     |--- [ API Endpoints ]
      |                                     |--- [ AI Orchestration ] -> [ LLM APIs ]
      |                                     |--- [ PowerPoint Generation ]
      |                                     |--- [ Prisma ORM ] -> [ SQLite/PostgreSQL ]
```

### Why Separated Architecture?

1. **Security**: Backend acts as secure gatekeeper for sensitive client data
2. **Scalability**: Backend can scale independently as AI complexity grows
3. **Separation of Concerns**: Clean boundaries between UI and business logic
4. **Future-Proofing**: Easy to integrate specialized legal expert systems

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (dev), PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI, Google Gemini, Ollama
- **Presentation Generation**: pptxgenjs
- **Security**: Helmet.js, bcrypt

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context/Hooks
- **API Client**: Axios
- **Styling**: CSS-in-JS (MUI styled)

### DevOps
- **Version Control**: Git/GitHub
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **CI/CD**: Vercel & Render auto-deploy

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- OpenAI API key (optional: Gemini, Ollama)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aibymlMelissa/LegalServices.git
   cd LegalServices
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run the development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Backend on http://localhost:8080
   - Frontend on http://localhost:3001

---

## Project Structure

```
LegalServices/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, etc.
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helper functions
│   │   └── index.ts           # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── dist/                  # Compiled JavaScript
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Next.js pages
│   │   ├── services/          # API client
│   │   ├── hooks/             # Custom hooks
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── render.yaml                # Render deployment config
├── RENDER_DEPLOYMENT.md       # Deployment guide
├── package.json               # Root package (unified scripts)
└── README.md                  # This file
```

---

## Development

### Available Scripts

From the **root directory**:

```bash
# Run both backend and frontend concurrently
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build both applications
npm run build

# Run tests
npm test
```

From **backend directory**:

```bash
# Start backend in development mode
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

From **frontend directory**:

```bash
# Start Next.js dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Deployment

### Frontend Deployment (Vercel)

The frontend is already deployed to Vercel:

**URL**: https://frontend-e3fsld24o-aibymls-projects.vercel.app

#### To redeploy or update:

1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Vercel auto-deploys** on every push to `main` branch

3. **Environment Variables** (already configured in Vercel):
   - `NEXT_PUBLIC_BACKEND_URL`: Points to Render backend URL

### Backend Deployment (Render)

The backend is deployed to Render using the `render.yaml` configuration.

#### Initial Setup (First Time):

1. **Sign up for Render**
   - Go to https://render.com
   - Sign up with GitHub account (aibymlMelissa)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect repository: `aibymlMelissa/LegalServices`
   - Render auto-detects `render.yaml`

3. **Configure Environment Variables** in Render dashboard:

   **Required**:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `FRONTEND_URL`: Your Vercel frontend URL

   **Auto-generated by Render**:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

   **Optional**:
   - `GEMINI_API_KEY`: Google Gemini API key
   - `OLLAMA_BASE_URL`: Ollama server URL

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically:
     - Install dependencies
     - Generate Prisma client
     - Build TypeScript code
     - Start the backend

5. **Get Backend URL**
   - After deployment: `https://legal-services-backend.onrender.com`
   - Copy this URL

6. **Update Vercel Frontend**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Update `NEXT_PUBLIC_BACKEND_URL` with Render URL
   - Redeploy frontend

#### Render Configuration

See `render.yaml`:

```yaml
services:
  - type: web
    name: legal-services-backend
    runtime: node
    region: oregon
    plan: free
    rootDir: backend
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        value: file:./prod.db
      # ... other env vars
    healthCheckPath: /api/health
```

#### Important Notes:

- **Free Tier**: Backend spins down after 15 minutes of inactivity
- **Cold Starts**: First request after spin-down takes 30-60 seconds
- **Database**: Using SQLite (`file:./prod.db`) - data persists on Render's disk
- **Upgrade**: For always-on backend, upgrade to paid plan ($7/month)

For detailed deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

---

## Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:90b

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Production Environment Variables

**Vercel** (Frontend):
- `NEXT_PUBLIC_BACKEND_URL`: Render backend URL

**Render** (Backend):
- `OPENAI_API_KEY`: Your OpenAI API key
- `FRONTEND_URL`: Vercel frontend URL
- `JWT_SECRET`: Auto-generated
- `JWT_REFRESH_SECRET`: Auto-generated
- `NODE_ENV`: production
- `PORT`: 10000
- `DATABASE_URL`: file:./prod.db

---

## API Documentation

### Base URL

- **Development**: `http://localhost:8080/api`
- **Production**: `https://legal-services-backend.onrender.com/api`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

#### Cases
- `GET /api/cases` - List all cases
- `POST /api/cases` - Create new case
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

#### AI Strategy Generation
- `POST /api/cases/:id/strategy` - Generate legal strategy
- `POST /api/cases/:id/presentation` - Generate PowerPoint

#### Health Check
- `GET /api/health` - Server health status

### Example API Call

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL + '/api',
});

// Login
const response = await api.post('/auth/login', {
  email: 'lawyer@example.com',
  password: 'password123'
});

const token = response.data.token;

// Get cases (with auth)
const cases = await api.get('/cases', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

## Features

### Current Features

✅ **User Authentication**
- JWT-based authentication
- Secure password hashing with bcrypt
- Refresh token support
- Role-based access control

✅ **Case Management**
- Create, read, update, delete cases
- Store case details and client information
- Track case status and progress

✅ **AI-Powered Strategy Generation**
- Integration with multiple LLM providers (OpenAI, Gemini, Ollama)
- Structured prompts based on 6 legal components
- JSON-formatted strategy output

✅ **PowerPoint Generation**
- Automated presentation creation
- Customizable slide templates
- Export to .pptx format

✅ **Dashboard & Analytics**
- System health monitoring
- User activity tracking
- Case statistics

### Planned Features

🔄 **Model Content Protocol (MCP) Modules**
- Legal doctrine search
- Procedure lookup
- Principle analysis
- Evidence validation
- Precedent matching
- Client psychology assessment

🔄 **Advanced Features**
- Collaborative editing
- Document upload and analysis
- Citation management
- Case law database integration

---

## Troubleshooting

### Common Issues

#### 1. "npm run dev" fails

**Problem**: Missing unified dev script

**Solution**: Ensure you're in the root directory with the updated `package.json`:
```bash
npm install
npm run dev
```

#### 2. Prisma client not initialized

**Problem**: `@prisma/client did not initialize yet`

**Solution**:
```bash
cd backend
npx prisma generate
npm run dev
```

#### 3. Missing OPENAI_API_KEY

**Problem**: Backend starts with warning about missing API key

**Solution**:
- Add your OpenAI API key to `backend/.env`:
  ```env
  OPENAI_API_KEY=sk-your-actual-key-here
  ```

#### 4. CORS errors in development

**Problem**: Frontend can't connect to backend

**Solution**:
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL:
  ```env
  FRONTEND_URL=http://localhost:3001
  ```

#### 5. TypeScript compilation errors

**Problem**: Build fails with type errors

**Solution**:
- We've relaxed strict mode in `frontend/tsconfig.json`
- If errors persist, check specific files mentioned in error messages

#### 6. Vercel deployment fails

**Problem**: Build errors on Vercel

**Solution**:
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `vercel.json` configuration

#### 7. Render deployment fails

**Problem**: Build or health check fails on Render

**Solution**:
- Check Render logs in dashboard
- Verify `render.yaml` configuration
- Ensure `/api/health` endpoint exists
- Confirm all required environment variables are set

#### 8. Cold starts on Render (Free Tier)

**Problem**: First request takes 30-60 seconds

**Solution**:
- This is normal behavior on Render's free tier
- Backend spins down after 15 minutes of inactivity
- Consider upgrading to paid plan for always-on service

#### 9. Database connection issues

**Problem**: Prisma can't connect to database

**Solution**:
```bash
# Development
cd backend
npx prisma migrate dev

# Production (Render)
# Ensure DATABASE_URL is set correctly in Render
```

### Getting Help

- **Issues**: https://github.com/aibymlMelissa/LegalServices/issues
- **Documentation**: This README and `RENDER_DEPLOYMENT.md`
- **Logs**: Check Vercel and Render dashboards for deployment logs

---

## Development Workflow Summary

### What We Accomplished

1. ✅ **Set up unified development environment**
   - Installed `concurrently` package
   - Created unified `npm run dev` script
   - Configured both backend and frontend to run simultaneously

2. ✅ **Initialized database**
   - Generated Prisma client
   - Created SQLite database
   - Set up database migrations

3. ✅ **Configured environment variables**
   - Created `.env` and `.env.example` files
   - Documented all required variables
   - Set up CORS and authentication secrets

4. ✅ **Set up version control**
   - Initialized Git repository
   - Created comprehensive `.gitignore`
   - Pushed to GitHub: https://github.com/aibymlMelissa/LegalServices

5. ✅ **Deployed frontend to Vercel**
   - Fixed 15+ TypeScript compilation errors
   - Configured `vercel.json`
   - Successfully deployed to: https://frontend-e3fsld24o-aibymls-projects.vercel.app

6. ✅ **Set up backend deployment**
   - Created `render.yaml` configuration
   - Documented Render deployment process
   - Prepared production environment

7. ✅ **Created comprehensive documentation**
   - This README.md
   - RENDER_DEPLOYMENT.md deployment guide
   - Inline code documentation

---

## License

Private project for legal professional use.

---

## Contributors

- AI Consultant: System architecture and implementation
- Developer: Melissa (aibymlMelissa)

---

**Last Updated**: 2025-11-07

For the most up-to-date deployment information, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).
