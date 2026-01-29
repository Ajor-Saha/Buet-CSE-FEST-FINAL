# Buet CSE FEST - Full Stack Quick Start

Complete guide to run the frontend and backend together.

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Cloudflare R2 or S3-compatible storage (for file uploads)
- Google Gemini API key (for AI features)

## Backend Setup

1. **Navigate to backend directory**:
```bash
cd server/backend
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Configure environment** (create `.env` file):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/buet_cse_fest

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=8000
NODE_ENV=development

# Cloudflare R2 / S3
BUCKET_NAME=your-bucket-name
BUCKET_REGION=auto
ACCESS_KEY_ID=your-access-key
SECRET_ACCESS_KEY=your-secret-key
ACCOUNT_ID=your-account-id
PUBLIC_ACCESS_URL=https://your-r2-public-url

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

4. **Setup database**:
```bash
# Run migrations
pnpm db:push

# Or use the SQL script
psql -U postgres -d buet_cse_fest -f ../data/init.sql
```

5. **Start backend**:
```bash
pnpm dev
```

Backend runs on `http://localhost:8000`

## Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd client
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Configure environment** (create `.env.local` file):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

4. **Start frontend**:
```bash
pnpm dev
```

Frontend runs on `http://localhost:3000`

## Quick Start (Both Services)

From the root directory, you can run both services:

**Terminal 1 (Backend)**:
```bash
cd server/backend && pnpm dev
```

**Terminal 2 (Frontend)**:
```bash
cd client && pnpm dev
```

## Testing the Application

### 1. Create Test User (Student)

**POST** `http://localhost:8000/api/auth/signup`
```json
{
  "full_name": "Test Student",
  "email": "student@test.com",
  "password": "password123",
  "role": "student"
}
```

### 2. Create Admin User

**POST** `http://localhost:8000/api/auth/signup`
```json
{
  "full_name": "Admin User",
  "email": "admin@test.com",
  "password": "admin123",
  "role": "admin"
}
```

### 3. Login

Open `http://localhost:3000/auth/signin` and login with:
- Email: `student@test.com`
- Password: `password123`

### 4. Create a Course (as Admin)

Login as admin and use Postman or API:

**POST** `http://localhost:8000/api/courses`
```json
{
  "code": "CSE101",
  "name": "Introduction to Programming",
  "description": "Learn programming basics",
  "has_theory": true,
  "has_lab": true,
  "total_weeks": 16
}
```

### 5. Browse and Enroll

1. Go to Dashboard: `http://localhost:3000/dashboard`
2. Click "Browse All Courses"
3. Find a course and click "Enroll"
4. View course details to see materials

## API Endpoints Summary

### Authentication
- POST `/api/auth/signup` - Register
- POST `/api/auth/signin` - Login
- POST `/api/auth/signout` - Logout
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/update-profile` - Update profile
- PUT `/api/auth/change-password` - Change password
- PUT `/api/auth/update-profile-picture` - Upload avatar

### Courses
- GET `/api/courses` - List all courses
- GET `/api/courses/:id` - Get course details
- GET `/api/courses/my-courses` - Get enrolled courses
- POST `/api/courses` - Create course (admin)
- POST `/api/courses/:id/enroll` - Enroll in course
- PUT `/api/courses/:id` - Update course (admin)

### Materials
- GET `/api/materials` - List materials (with filters)
- GET `/api/materials/:id` - Get material details
- GET `/api/materials/browse/:category` - Browse by theory/lab
- GET `/api/materials/week/:week_number` - Get materials by week
- POST `/api/materials/upload` - Upload material (admin)
- POST `/api/materials/:id/download` - Track download
- PUT `/api/materials/:id` - Update material (admin)
- DELETE `/api/materials/:id` - Delete material (admin)

### AI Bot
- POST `/api/ai/generate-from-image` - Analyze image with AI

## Postman Collection

Import the Postman collection for easy API testing:
```
server/Buet_CSE_FEST_API.postman_collection.json
```

## Common Issues

### Port Already in Use
```bash
# Backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in backend `.env`
- Ensure database exists

### CORS Error
- Verify backend CORS settings allow `http://localhost:3000`
- Check `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`

### Authentication Failed
- Clear browser localStorage
- Check JWT_SECRET is set in backend
- Verify token is being sent in requests

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **API Testing**: Use Postman collection for quick testing
3. **Database Changes**: Run `pnpm db:push` after schema changes
4. **Clear Cache**: Clear browser cache if seeing stale data
5. **Check Console**: Monitor browser console and terminal for errors

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure production database
4. Set up proper CORS origins
5. Enable HTTPS

### Frontend
1. Build: `pnpm build`
2. Start: `pnpm start`
3. Set production API URL
4. Enable HTTPS
5. Configure CDN (optional)

## Tech Stack

**Frontend**:
- Next.js 15 (React 19)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form + Zod

**Backend**:
- Node.js + Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- JWT Authentication
- Cloudflare R2
- Google Gemini AI

## Resources

- Backend API Documentation: `server/backend/API_DOCUMENTATION.md`
- Database Schema: `server/backend/DATABASE_SCHEMA.md`
- Frontend Setup: `client/FRONTEND_SETUP.md`
- Postman Collection: `server/Buet_CSE_FEST_API.postman_collection.json`

## Support

For issues or questions, check the documentation or contact the development team.
