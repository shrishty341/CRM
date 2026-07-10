# Pharma CRM HCP - Production Deployment Guide

## Overview
This is a FastAPI + React application for pharmaceutical CRM (Customer Relationship Management) for Healthcare Professionals (HCP). The app is configured for deployment on Render.com.

## Architecture
- **Backend**: FastAPI (Python 3.12) with PostgreSQL database
- **Frontend**: React + Vite + TypeScript
- **AI**: LangGraph + Groq LLM for natural language processing
- **Database**: PostgreSQL (NeonDB on Render)

## Production Configuration Files

### 1. `render.yaml`
Main deployment configuration for Render.com:
- Backend API service (Python 3.12)
- Frontend static site
- PostgreSQL database

### 2. `backend/requirements.txt`
Python dependencies including:
- FastAPI + Uvicorn for API
- SQLAlchemy for database
- LangChain + Groq for AI features
- Gunicorn for production server

### 3. `runtime.txt`
Specifies Python 3.12.4 for Render deployment

### 4. `backend/build.sh`
Build script that:
- Installs Python dependencies
- Runs database migrations with Alembic

### 5. Environment Variables

#### Backend (`backend/.env`)
```env
# Database (auto-configured by Render)
DATABASE_URL=postgresql://...

# AI Configuration
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=gemma2-9b-it

# Security
SECRET_KEY=your-secret-key-here
DEBUG=false

# CORS (update with your frontend URL)
CORS_ORIGINS=https://your-app.onrender.com

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

#### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=https://your-backend-app.onrender.com/api/v1
```

## Deployment Steps on Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Create PostgreSQL Database on Render
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Name: `pharma-crm-db`
4. Plan: Free (or your preferred plan)
5. Note the database credentials

### Step 3: Deploy Backend
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `pharma-crm-api`
   - **Runtime**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`
4. Add Environment Variables:
   - `DATABASE_URL`: (from your PostgreSQL database)
   - `GROQ_API_KEY`: (your Groq API key)
   - `SECRET_KEY`: (generate a secure random string)
   - `DEBUG`: `false`
   - `CORS_ORIGINS`: `https://your-frontend-app.onrender.com`
   - `TRUSTED_HOSTS`: `localhost,127.0.0.1,.onrender.com`
5. Click "Create Web Service"

### Step 4: Deploy Frontend
1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `pharma-crm-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://pharma-crm-api.onrender.com/api/v1`
5. Click "Create Static Site"

### Step 5: Update CORS
After both services are deployed:
1. Update backend's `CORS_ORIGINS` with your actual frontend URL
2. Redeploy the backend service

## Production Features Implemented

### Security
- ✅ DEBUG disabled in production
- ✅ SECRET_KEY configured via environment variables
- ✅ CORS restricted to specific origins
- ✅ TrustedHostMiddleware enabled
- ✅ GZip compression for responses
- ✅ No hardcoded credentials

### Performance
- ✅ Gunicorn with 4 workers
- ✅ Uvicorn worker class for async support
- ✅ Database connection pooling (pool_size=10, max_overflow=20)
- ✅ GZip compression middleware
- ✅ Request timeout configuration (120s)

### Database
- ✅ PostgreSQL with SSL (NeonDB)
- ✅ SQLAlchemy connection pooling
- ✅ Alembic migrations configured
- ✅ Auto-initialization on startup

### Monitoring
- ✅ Structured logging configured
- ✅ Health check endpoint (`/api/v1/health`)
- ✅ Error handlers for 404 and 500
- ✅ Request logging enabled

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:3000

## Environment Variables Reference

### Required for Production
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `GROQ_API_KEY` | Groq LLM API key | `gsk_...` |
| `SECRET_KEY` | Application secret key | `random-secret-string` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://app.onrender.com` |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `false` | Enable debug mode |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `TRUSTED_HOSTS` | `localhost,127.0.0.1,.onrender.com` | Allowed hostnames |
| `GROQ_MODEL` | `gemma2-9b-it` | Groq model to use |
| `HOST` | `0.0.0.0` | Server bind host |
| `PORT` | `8000` | Server bind port |

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check database is running and accessible
- Ensure SSL mode is enabled for NeonDB

### CORS Errors
- Update CORS_ORIGINS in backend/.env
- Ensure frontend URL matches exactly (including https://)
- Redeploy backend after changes

### Build Failures
- Check Python version (should be 3.12)
- Verify all dependencies in requirements.txt
- Check build logs in Render dashboard

### Application Errors
- Check Render logs for detailed error messages
- Verify all environment variables are set
- Test health endpoint: `/api/v1/health`

## API Endpoints

### Health Check
- `GET /api/v1/health` - Service health status

### Chat/AI
- `POST /api/v1/chat` - Process natural language interaction

### Interactions
- `POST /api/v1/interaction` - Create new interaction
- `GET /api/v1/interaction/{id}` - Get interaction by ID
- `GET /api/v1/interaction/history` - Get interaction history

### HCPs (Healthcare Professionals)
- `GET /api/v1/hcp` - List all HCPs
- `GET /api/v1/hcp/recent` - Get recent HCPs
- `GET /api/v1/hcp/{id}` - Get HCP by ID
- `GET /api/v1/hcp/{id}/interactions` - Get HCP interactions

## Support
For issues or questions, check the Render deployment logs or contact the development team.

## License
Proprietary - Pharma CRM HCP Interaction Module