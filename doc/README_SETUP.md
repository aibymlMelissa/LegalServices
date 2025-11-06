# Legal Strategy Platform - Setup Guide

This guide explains how to set up and run the AI-powered legal strategy platform built according to the specifications in README.md.

## Architecture Overview

The platform uses a separated frontend and backend architecture as recommended:

- **Backend**: Node.js/Express with TypeScript, PostgreSQL, Prisma ORM
- **Frontend**: Next.js with React, TypeScript, Material-UI
- **AI Integration**: OpenAI/Gemini LLM APIs with MCP module architecture
- **Security**: JWT authentication, input validation, HTTPS
- **Deployment**: Docker containerization with Nginx reverse proxy

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL (if running locally)
- OpenAI or Gemini API keys

### 1. Environment Setup

```bash
# Clone/copy the project files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your configuration
```

### 2. Docker Deployment (Recommended)

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

### 3. Local Development Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up database
npm run prisma:migrate
npm run prisma:generate

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## MCP Module Architecture

The platform implements the 6 legal components as independent MCP modules:

1. **Legal Doctrine Module** (`legalDoctrineModule.ts`)
   - Analyzes relevant statutes, constitutional provisions, regulations
   - Currently uses placeholder data; ready for legal database integration

2. **Legal Procedure Module** (`legalProcedureModule.ts`)
   - Handles filing requirements, deadlines, court procedures
   - Tracks procedural compliance and strategic timing

3. **Legal Principles Module** (`legalPrinciplesModule.ts`)
   - Evaluates fundamental legal principles, burden of proof
   - Identifies applicable defenses and mitigating factors

4. **Admissible Evidence Module** (`admissibleEvidenceModule.ts`)
   - Assesses evidence admissibility and potential challenges
   - Plans evidence presentation strategy

5. **Case Precedents Module** (`casePrecedentsModule.ts`)
   - Searches and analyzes relevant legal precedents
   - Categorizes binding vs. persuasive authorities

6. **Client Psychology Module** (`clientPsychologyModule.ts`)
   - Evaluates client mental health and communication needs
   - Provides testimony preparation recommendations

## AI Orchestration

The `AIOrchestrationService` coordinates between:
- MCP modules for data gathering
- LLM APIs (OpenAI/Gemini) for strategy synthesis
- PowerPoint generation for presentation output

## Security Features

- JWT-based authentication with secure token management
- Input validation using Joi schemas
- HTTPS encryption (configurable)
- Helmet.js security headers
- Environment variable configuration for secrets

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Cases
- `GET /api/cases` - List user cases
- `POST /api/cases` - Create new case
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Strategies
- `POST /api/strategies` - Create strategy
- `POST /api/strategies/generate` - Generate AI strategy
- `GET /api/strategies/:id/presentation` - Download PowerPoint

## Database Schema

The Prisma schema includes:
- **Users**: Authentication and user management
- **Cases**: Case information and metadata
- **Strategies**: AI-generated legal strategies with MCP module data
- **Evidence**: Case evidence tracking

## Production Deployment

### SSL Configuration

1. Obtain SSL certificates
2. Update `nginx.conf` with SSL configuration
3. Set SSL paths in environment variables

### Environment Variables

```bash
# Required for production
DB_PASSWORD=secure_random_password
JWT_SECRET=crypto_random_secret
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

### Scaling Considerations

- Database connection pooling via Prisma
- Nginx load balancing for multiple backend instances
- Separate file storage service for presentations
- Redis for session management (optional)

## Legal Compliance

- All client data encrypted at rest and in transit
- Audit logging for legal strategy access
- Secure API key management
- Regular security updates and monitoring

## Development Workflow

1. Make changes to backend/frontend code
2. Test locally with `npm run dev`
3. Build and test with Docker: `docker-compose up --build`
4. Deploy to production environment

## Troubleshooting

### Common Issues

1. **Database Connection**: Check PostgreSQL service and connection string
2. **API Keys**: Verify OpenAI/Gemini API keys are valid
3. **CORS Issues**: Ensure frontend URL is whitelisted in backend
4. **File Permissions**: Check upload directory permissions

### Health Checks

- Backend health: `GET /api/health`
- Database connectivity: Check Prisma connection
- AI services: Verify API key validity

## Future Enhancements

- Integration with legal research databases
- Advanced AI model fine-tuning
- Mobile application development
- Multi-language support
- Advanced analytics and reporting

For technical support or feature requests, refer to the project documentation or contact the development team.