# Frontend Setup Guide

This is the frontend client for the Buet CSE FEST application built with Next.js 15, React, TypeScript, and Tailwind CSS.

## Features Implemented

### Authentication
- ✅ User Sign Up (with role selection: student/admin)
- ✅ User Sign In with JWT token management
- ✅ Sign Out
- ✅ Protected routes with authentication check
- ✅ Persistent auth state with localStorage
- ✅ Auth context provider for global state management

### Courses Management
- ✅ Browse all available courses
- ✅ View course details
- ✅ Enroll in courses
- ✅ View enrolled courses on dashboard
- ✅ Course search functionality
- ✅ Theory and Lab materials display

### Materials Management
- ✅ View theory materials
- ✅ View lab materials
- ✅ Download materials with tracking
- ✅ View material metadata (week, topic, tags)
- ✅ View and download counts display

### UI Components
- ✅ Sidebar navigation
- ✅ Breadcrumb navigation
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Loading states
- ✅ Empty states

## API Integration

All API endpoints are fully integrated with the backend:

### Auth APIs (`lib/auth-api.ts`)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `PUT /api/auth/update-profile-picture` - Update avatar

### Course APIs (`lib/courses-api.ts`)
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/my-courses` - Get enrolled courses
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin)

### Material APIs (`lib/materials-api.ts`)
- `GET /api/materials` - Get all materials (with filters)
- `GET /api/materials/:id` - Get material by ID
- `GET /api/materials/browse/:category` - Browse by theory/lab
- `GET /api/materials/week/:week_number` - Get materials by week
- `POST /api/materials/:id/download` - Track download
- `POST /api/materials/upload` - Upload material (admin)
- `PUT /api/materials/:id` - Update material (admin)
- `DELETE /api/materials/:id` - Delete material (admin)

## Environment Setup

1. Create `.env.local` file in the client directory:

```bash
cp .env.local.example .env.local
```

2. Configure the API base URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
client/
├── app/                      # Next.js app directory
│   ├── auth/                # Authentication pages
│   │   ├── signin/         # Sign in page
│   │   └── signup/         # Sign up page
│   ├── courses/            # Courses pages
│   │   ├── [id]/          # Course detail page
│   │   └── page.tsx       # Browse courses page
│   ├── dashboard/          # Dashboard page
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── auth/              # Auth components
│   │   └── auth-provider.tsx  # Auth context provider
│   ├── ui/                # UI components (shadcn)
│   └── app-sidebar.tsx    # App sidebar
├── lib/                   # Utility functions and API clients
│   ├── api-client.ts     # Base API client
│   ├── auth-api.ts       # Auth API functions
│   ├── auth-storage.ts   # Local storage helpers
│   ├── courses-api.ts    # Courses API functions
│   └── materials-api.ts  # Materials API functions
└── package.json
```

## Key Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - UI component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Sonner** - Toast notifications
- **Lucide React** - Icon library

## Usage

### As a Student

1. **Sign Up**: Create an account with role "student"
2. **Sign In**: Login with your credentials
3. **Browse Courses**: View all available courses
4. **Enroll**: Enroll in courses you're interested in
5. **View Materials**: Access theory and lab materials
6. **Download**: Download course materials

### As an Admin

1. **Sign Up**: Create an account with role "admin"
2. **Sign In**: Login with admin credentials
3. **Create Courses**: Add new courses to the system
4. **Upload Materials**: Upload theory and lab materials
5. **Manage Content**: Update or delete courses and materials

## API Authentication

The frontend uses JWT token authentication:

1. Token is received on successful login
2. Stored in localStorage for persistence
3. Automatically attached to API requests via Authorization header
4. Cookie-based authentication is also supported by the backend

## Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Dark Mode

The app supports dark mode with automatic system preference detection and manual toggle.

## Next Steps

To extend the frontend:

1. **Profile Management**: Add profile editing pages
2. **Admin Dashboard**: Create admin-specific views
3. **Material Upload UI**: Add file upload interface for admins
4. **Search Enhancement**: Add advanced filters
5. **Progress Tracking**: Add course progress features
6. **Notifications**: Add real-time notifications
7. **Comments**: Add discussion features for materials

## Troubleshooting

### CORS Issues
Make sure the backend CORS configuration allows requests from `http://localhost:3000`

### API Connection Failed
Verify the `NEXT_PUBLIC_API_BASE_URL` in `.env.local` matches your backend URL

### Authentication Issues
Clear localStorage and cookies, then try signing in again

## Support

For issues or questions, contact the development team.
