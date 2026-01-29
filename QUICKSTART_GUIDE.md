# 🚀 Quick Start Guide - BUET CSE FEST

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- R2 bucket configured (for file uploads)
- Google Gemini API key (for AI features)

## 1. Backend Setup

```bash
cd server/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and API credentials

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Backend will run on: **http://localhost:8000**

## 2. Frontend Setup

```bash
cd client

# Install dependencies  
npm install

# Environment is already configured in .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:3000**

## 3. Test the Application

### Create Admin User
```bash
# Sign up at http://localhost:3000/auth/signup
# Use role: "admin" to create courses and upload materials
```

### Create Student User
```bash
# Sign up at http://localhost:3000/auth/signup  
# Use role: "student" (default) to browse and enroll in courses
```

### Test Workflow

1. **Admin Flow**:
   - Sign in as admin
   - Go to Dashboard
   - Create a new course
   - Upload course materials (theory/lab)

2. **Student Flow**:
   - Sign in as student
   - Browse courses at `/courses`
   - Enroll in a course
   - View course materials
   - Download materials

## 4. API Testing with Postman

Import the Postman collection:
```
server/Buet_CSE_FEST_API.postman_collection.json
```

Set environment variables in Postman:
- `base_url`: http://localhost:8000
- `access_token`: (will be auto-set after signin)

## Troubleshooting

### Backend Issues

**Database connection error**:
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
```

**File upload failing**:
```bash
# Check R2 credentials in .env:
# - BUCKET_NAME
# - PUBLIC_ACCESS_URL
# - AWS_ACCOUNT_ID
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
```

### Frontend Issues

**API calls failing**:
```bash
# Check .env.local has correct backend URL
# Ensure backend is running on http://localhost:8000
```

**CORS errors**:
```bash
# Backend index.ts already includes http://localhost:3000 in CORS origins
# Restart backend if you changed the port
```

## Default Ports

- Backend: **8000**
- Frontend: **3000**
- Database: **5432** (PostgreSQL)

## Key URLs

- Frontend App: http://localhost:3000
- Backend API: http://localhost:8000
- API Health Check: http://localhost:8000/

## Next Steps

1. Create admin account
2. Create a few test courses
3. Upload some materials
4. Create student account
5. Test enrollment and material downloads
6. Test AI image analysis at `/api/ai/generate-from-image`

## Production Deployment

### Frontend (Vercel)
```bash
cd client
vercel deploy
```

### Backend (Any Node.js hosting)
```bash
cd server/backend
npm run build
npm start
```

Update `NEXT_PUBLIC_API_BASE_URL` in frontend to point to production backend URL.

---

**Status**: ✅ All systems operational
**Last Updated**: January 29, 2026
