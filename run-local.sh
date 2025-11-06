#!/bin/bash

echo "🏛️  Legal Strategy Platform - Local Development Setup"
echo "===================================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Create basic .env files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cat > backend/.env << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="local-development-jwt-secret-key"
JWT_EXPIRES_IN="7d"
OPENAI_API_KEY=""
GEMINI_API_KEY=""
PORT=3002
NODE_ENV="development"
FRONTEND_URL="http://localhost:3001"
EOF
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file..."
    cat > frontend/.env << EOF
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
BACKEND_URL=http://localhost:3002
EOF
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🗄️  Setting up SQLite database (no PostgreSQL needed)..."
npx prisma generate
npx prisma db push

echo "🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!

cd ../frontend
echo "📦 Installing frontend dependencies..."
npm install

echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Development servers starting!"
echo ""
echo "📍 Frontend: http://localhost:3001"
echo "📍 Backend API: http://localhost:3002"
echo "📍 Database: SQLite file (backend/dev.db)"
echo ""
echo "⏳ Wait 30-60 seconds for servers to fully start..."
echo "💡 Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait