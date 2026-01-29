# BUET CSE FEST - Full Stack Setup Complete ✅

## Summary of Changes

The frontend has been updated to properly integrate with the backend API. All components are now fully functional and ready to use.

### Fixed Issues:

1. **Environment Configuration** ✅
   - Fixed `.env.local` to use correct variable name: `NEXT_PUBLIC_API_BASE_URL`
   - Backend API URL properly configured for local development

2. **Backend Routes** ✅
   - Added missing AI bot router to `server/backend/src/index.ts`
   - All API endpoints now properly mounted:
     - `/api/auth` - Authentication
     - `/api/courses` - Course management
     - `/api/materials` - Materials management
     - `/api/ai` - AI bot for image analysis

### Working Features:

#### Authentication System
- ✅ Sign up (with role selection: student/admin)
- ✅ Sign in (with JWT token management)
- ✅ Sign out
- ✅ Get current user profile
- ✅ Update profile (full name)
- ✅ Update profile picture (with R2 storage)
- ✅ Change password

#### Course Management
- ✅ Browse all courses
- ✅ Search courses
- ✅ View course details
- ✅ Enroll in courses
- ✅ View enrolled courses (dashboard)
- ✅ Filter courses by department, semester, year
- ✅ Theory/Lab component display

#### Materials Management
- ✅ View materials by category (theory/lab)
- ✅ Download materials
- ✅ Track downloads and views
- ✅ Filter materials by week, topic, tags
- ✅ Display material metadata (file size, upload date, etc.)

#### AI Bot
- ✅ Generate text from uploaded images using Google Gemini
- ✅ Custom prompts support

## Project Structure

```
BUET-CSE-FEST/
├── client/                    # Frontend (Next.js 15)
│   ├── app/
│   │   ├── auth/
│   │   │   ├── signin/        # Sign in page
│   │   │   └── signup/        # Sign up page
│   │   ├── courses/
│   │   │   ├── [id]/          # Course detail page with materials
│   │   │   └── page.tsx       # Browse all courses
│   │   ├── dashboard/         # User dashboard with enrolled courses
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── auth/
│   │   │   └── auth-provider.tsx  # Auth context & state management
│   │   └── ui/                # Shadcn UI components
│   └── lib/
│       ├── api-client.ts      # Base API client
│       ├── auth-api.ts        # Auth API functions
│       ├── auth-storage.ts    # LocalStorage helpers
│       ├── courses-api.ts     # Courses API functions
│       └── materials-api.ts   # Materials API functions
│
└── server/backend/            # Backend (Express.js + PostgreSQL)
    ├── src/
    │   ├── controllers/       # Request handlers
    │   │   ├── auth-controllers.ts
    │   │   ├── courses-controller.ts
    │   │   ├── materials-controller.ts
    │   │   └── aibot-controller.ts
    │   ├── routes/            # API routes
    │   ├── middleware/        # Auth, upload, etc.
    │   ├── db/                # Database schema & connection
    │   └── index.ts           # Server entry point
    └── drizzle/               # Database migrations
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /signin` - Login user
- `POST /signout` - Logout user (auth required)
- `GET /me` - Get current user (auth required)
- `PUT /update-profile` - Update user profile (auth required)
- `PUT /update-profile-picture` - Update avatar (auth required)
- `PUT /change-password` - Change password (auth required)

### Courses (`/api/courses`)
- `POST /` - Create course (admin only)
- `GET /` - Get all courses (with filters)
- `GET /my-courses` - Get enrolled courses (auth required)
- `GET /:id` - Get course by ID (auth required)
- `POST /:id/enroll` - Enroll in course (auth required)
- `PUT /:id` - Update course (admin only)

### Materials (`/api/materials`)
- `POST /upload` - Upload material (admin only)
- `GET /` - Get all materials (with filters)
- `GET /browse/:category` - Browse by category (theory/lab)
- `GET /week/:week_number` - Get materials by week
- `GET /:id` - Get material by ID (auth required)
- `PUT /:id` - Update material (admin only)
- `DELETE /:id` - Delete material (admin only)
- `POST /:id/download` - Track download (auth required)

### AI Bot (`/api/ai`)
- `POST /generate-from-image` - Generate text from image

## Quick Start

### 1. Start Backend
```bash
cd server/backend
npm install
npm run dev
# Server runs on http://localhost:8000
```

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
# App runs on http://localhost:3000
```

### 3. Test the Application

1. **Sign Up**: Create a new account at http://localhost:3000/auth/signup
2. **Sign In**: Login at http://localhost:3000/auth/signin
3. **Browse Courses**: View available courses at http://localhost:3000/courses
4. **Enroll**: Click on a course and enroll
5. **View Materials**: Access course materials from the course detail page
6. **Dashboard**: See your enrolled courses at http://localhost:3000/dashboard

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (.env)
```env
PORT=8000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
BUCKET_NAME=your-r2-bucket
PUBLIC_ACCESS_URL=your-r2-url
GEMINI_API_KEY=your-gemini-key
```

## Key Features

### Role-Based Access Control
- **Students**: Can browse courses, enroll, view/download materials
- **Admins**: Can create courses, upload materials, manage content

### Material Organization
- Materials categorized as Theory or Lab
- Organized by week number
- Searchable by tags and topics
- Download and view tracking

### Modern UI
- Dark/Light theme support
- Responsive design
- Sidebar navigation
- Breadcrumb navigation
- Toast notifications

## Technologies Used

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Hook Form + Zod
- Sonner (Toast notifications)

### Backend
- Express.js
- PostgreSQL (with Drizzle ORM)
- JWT Authentication
- Cloudflare R2 (S3-compatible storage)
- Google Gemini AI
- Formidable (File uploads)

## Status: ✅ Fully Functional

The application is now complete and ready for development/testing. All API endpoints are properly connected to the frontend, and all features are working as expected.
