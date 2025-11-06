# Deploy Backend to Render

## Quick Setup Guide

### 1. Sign up for Render
- Go to: https://render.com
- Click "Get Started for Free"
- Sign up with your GitHub account (aibymlMelissa)

### 2. Create New Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository: `aibymlMelissa/LegalServices`
4. Render will auto-detect the `render.yaml` configuration

### 3. Configure Environment Variables

Render will auto-generate JWT secrets, but you need to add:

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key from https://platform.openai.com/api-keys
- `FRONTEND_URL` - Your Vercel frontend URL: `https://frontend-e3fsld24o-aibymls-projects.vercel.app`

**Optional:**
- `GEMINI_API_KEY` - Google Gemini API key (if using)
- `OLLAMA_BASE_URL` - Ollama server URL (if using)

### 4. Deploy
- Click "Create Web Service"
- Render will automatically:
  - Install dependencies
  - Generate Prisma client
  - Build TypeScript code
  - Start your backend

### 5. Get Your Backend URL
After deployment completes, you'll get a URL like:
```
https://legal-services-backend.onrender.com
```

### 6. Update Vercel Frontend
Add this environment variable to Vercel:
- Key: `NEXT_PUBLIC_BACKEND_URL`
- Value: `https://legal-services-backend.onrender.com` (your actual Render URL)

## Important Notes

- **Free Tier**: Backend will spin down after 15 minutes of inactivity
- **Cold Starts**: First request after spin-down will take 30-60 seconds
- **Database**: Using SQLite (file:./prod.db) - data persists on Render's disk
- **Upgrade**: For always-on backend, upgrade to paid plan ($7/month)

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compiles locally first

### Health Check Fails
- Ensure `/api/health` endpoint exists
- Check that PORT environment variable is used
- Review application logs

### Database Issues
- Prisma generates on build
- SQLite database persists on Render disk
- For production, consider PostgreSQL

## Alternative: Railway

If you prefer Railway instead:
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub
3. Select LegalServices repository
4. Railway auto-detects Node.js
5. Add environment variables
6. Deploy!

Railway Advantages:
- More generous free tier ($5/month credit)
- No cold starts on free tier
- PostgreSQL database included
