# Local Deployment Guide

## Quick Local Setup (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed and running

### 1. Set Up Environment Variables

```bash
# Copy and edit the main environment file
cp .env.example .env
```

Edit `.env` with these minimal settings:
```
DB_PASSWORD=localpassword
JWT_SECRET=your-local-jwt-secret-key
OPENAI_API_KEY=your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here
```

### 2. One-Command Deployment

```bash
# Start everything with Docker Compose
docker-compose up --build
```

That's it! The services will start in this order:
1. PostgreSQL database
2. Backend API server
3. Frontend React app
4. Nginx reverse proxy

### 3. Access Your Application

- **Main App**: http://localhost (or http://localhost:3000)
- **API**: http://localhost:3001
- **Database**: localhost:5432

### 4. First Time Setup

1. Open http://localhost in your browser
2. Click "Register" to create your first account
3. Create a new case
4. Generate an AI strategy (requires API keys)

## Development Mode (For Making Changes)

If you want to make changes to the code:

```bash
# Terminal 1 - Start database only
docker-compose up database

# Terminal 2 - Backend development
cd backend
npm install
npm run dev

# Terminal 3 - Frontend development  
cd frontend
npm install
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v
```

## Troubleshooting

**Port conflicts?**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill processes if needed
sudo kill -9 <PID>
```

**Database connection issues?**
```bash
# Reset database
docker-compose down -v
docker-compose up database
```

**Need API keys?**
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://ai.google.dev/gemini-api

The platform will work without API keys but AI strategy generation will use fallback responses.