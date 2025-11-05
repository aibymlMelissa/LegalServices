# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Development
```bash
cd backend && npm run dev          # Start backend dev server (port 3001)
cd backend && npm run build        # Build backend for production
cd backend && npm run lint         # Lint backend TypeScript code
cd backend && npm test            # Run backend tests
```

### Frontend Development
```bash
cd frontend && npm run dev         # Start frontend dev server (port 3000)
cd frontend && npm run build       # Build frontend for production
cd frontend && npm run lint        # Lint frontend TypeScript code
cd frontend && npm run type-check  # Run TypeScript type checking
```

### Database Operations
```bash
cd backend && npx prisma generate       # Generate Prisma client
cd backend && npx prisma migrate dev    # Run database migrations (dev)
cd backend && npx prisma db push        # Push schema to database (dev)
cd backend && npx prisma migrate deploy # Deploy migrations (production)
```

### Quick Start Scripts
```bash
./quick-start.sh      # Docker-based production setup (requires Docker)
./run-local.sh        # Local development setup with SQLite
npm run install:all   # Install all dependencies (root, backend, frontend)
```

## Architecture Overview

This is an AI-powered legal services platform with separated frontend/backend architecture:

### Core Architecture
- **Frontend**: Next.js with TypeScript, React, Material-UI
- **Backend**: Node.js with Express, TypeScript, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: JWT-based with bcryptjs
- **AI Integration**: OpenAI GPT-4 and Google Gemini APIs

### Model Content Protocol (MCP) Architecture
The platform implements a modular MCP system with six specialized legal analysis modules:

1. **Legal Doctrine Module** (`backend/src/services/mcp-modules/legalDoctrineModule.ts`)
2. **Legal Procedure Module** (`backend/src/services/mcp-modules/legalProcedureModule.ts`)
3. **Legal Principles Module** (`backend/src/services/mcp-modules/legalPrinciplesModule.ts`)
4. **Admissible Evidence Module** (`backend/src/services/mcp-modules/admissibleEvidenceModule.ts`)
5. **Case Precedents Module** (`backend/src/services/mcp-modules/casePrecedentsModule.ts`)
6. **Client Psychology Module** (`backend/src/services/mcp-modules/clientPsychologyModule.ts`)

### Key Services
- **AI Orchestration Service** (`backend/src/services/aiOrchestrationService.ts`): Manages LLM integration and services synthesis
- **Presentation Service** (`backend/src/services/presentationService.ts`): Generates PowerPoint presentations using pptxgenjs

### Database Schema
- **Users**: Lawyer accounts with authentication
- **Cases**: Case management with title, description, type, and status
- **Strategies**: Generated legal strategies linking to cases, storing MCP module outputs and synthesized strategies
- **Evidence**: Case evidence with file upload support

### API Structure
- **Authentication**: `/api/auth` (login, register, token refresh)
- **Cases**: `/api/cases` (CRUD operations for legal cases)
- **Strategies**: `/api/strategies` (services generation and management)

### Environment Configuration
The platform uses separate environment files:
- `backend/.env`: Database URL, JWT secrets, API keys, server config
- `frontend/.env`: Backend URL configuration

### Deployment Options
- **Local Development**: Use `./run-local.sh` for SQLite-based development
- **Docker Production**: Use `./quick-start.sh` for containerized deployment with PostgreSQL
- **Docker Compose**: Full stack deployment with nginx reverse proxy

### Security Features
- JWT-based authentication with secure token handling
- Helmet.js security headers
- CORS configuration for frontend/backend communication
- Input validation and sanitization
- Environment-based secret management

### PowerPoint Generation
The platform automatically generates legal services presentations (≤10 slides) using the pptxgenjs library, synthesizing outputs from all MCP modules into actionable legal strategies.

## Testing and Code Quality

Always run linting and type checking before committing:
```bash
# Backend
cd backend && npm run lint && npm run test

# Frontend  
cd frontend && npm run lint && npm run type-check
```

## Common Development Workflows

### Adding New MCP Modules
1. Create new module in `backend/src/services/mcp-modules/`
2. Export from `backend/src/services/mcp-modules/index.ts`
3. Update `AIOrchestrationService` to integrate the module
4. Update database schema if persistent storage needed

### Modifying Database Schema
1. Edit `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name <migration_name>`
3. Run `cd backend && npx prisma generate` to update client

### Adding New API Endpoints
1. Create route handler in `backend/src/routes/`
2. Add route to `backend/src/index.ts`
3. Update frontend API service in `frontend/src/services/api.ts`