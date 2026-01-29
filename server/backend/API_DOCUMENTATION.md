# API Documentation - Part 1: Content Management System (CMS)

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require a valid JWT token. Include it in one of the following ways:
- **Cookie**: `accessToken`
- **Header**: `Authorization: Bearer <token>`

---

## Authentication Endpoints

### 1. Sign Up
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "student@bracu.ac.bd",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "role": "student"
}
```

**Note:** `department_id` field is optional and can be added later via profile update.

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "user_id": "uuid",
    "email": "student@bracu.ac.bd",
    "full_name": "John Doe",
    "role": "student",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "User registered successfully",
  "success": true
}
```

---

### 2. Sign In
**POST** `/auth/signin`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@bracu.ac.bd",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "admin@bracu.ac.bd",
    "full_name": "Admin User",
    "role": "admin",
    "avatar_url": null,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "accessToken": "jwt-token",
  "message": "Login successful"
}
```

**Note:** Token is also set as an httpOnly cookie named `accessToken`

---

### 3. Sign Out
**POST** `/auth/signout`

Sign out the current user (clears token cookie).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Logout successful",
  "success": true
}
```

---

### 4. Update Profile Picture
**PUT** `/auth/update-profile-picture`

Update user's profile picture (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar`: Image file (JPEG, PNG, etc.)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user_id": "uuid",
    "avatar_url": "https://r2-bucket-url/avatars/filename.jpg"
  },
  "message": "Profile picture updated successfully",
  "success": true
}
```

---

### 5. Change Password
**PUT** `/auth/change-password`

Change user's password (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password changed successfully",
  "success": true
}
```

---

### 6. Update Profile
**PUT** `/auth/update-profile`

Update user profile information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "department_id": "uuid-of-department"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user_id": "uuid",
    "email": "user@bracu.ac.bd",
    "full_name": "John Smith",
    "department_id": "uuid"
  },
  "message": "Profile updated successfully",
  "success": true
}
```

---

## AI Bot Endpoints

### 1. Generate Text from Image (Gemini AI)
**POST** `/ai/generate-from-image`

Upload an image and generate text description or analysis using Google Gemini AI.

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: Image file to analyze (required)
- `prompt` (optional): Custom prompt for the AI (default: "Caption this image.")

**Example using cURL:**
```bash
curl -X POST http://localhost:8000/api/ai/generate-from-image \
  -F "image=@photo.jpg" \
  -F "prompt=Describe this image in detail"
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "generatedText": "This image shows a beautiful sunset over the ocean...",
    "prompt": "Describe this image in detail",
    "imageInfo": {
      "originalFilename": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 245678
    }
  },
  "message": "Text generated successfully from image",
  "success": true
}
```

**Supported Image Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

**Note:** Uses Google Gemini 2.0 Flash model for fast and accurate image analysis.

---

## Course Management Endpoints

### 1. Create Course (Admin Only)
**POST** `/courses`

Create a new course. Only admins can create courses.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "code": "CSE220",
  "name": "Data Structures",
  "department_id": "uuid-of-department",
  "semester": "3/1",
  "year": 2024,
  "description": "Introduction to data structures and algorithms",
  "has_theory": true,
  "has_lab": false,
  "total_weeks": 16
}
```

**Note:** 
- `semester` format is "year/semester" (e.g., "1/1", "1/2", "2/1", "2/2", "3/1", "3/2", "4/1", "4/2")
- `has_theory` defaults to true if not provided
- `has_lab` defaults to false if not provided
- `total_weeks` defaults to 16 if not provided
- Course must have at least theory OR lab (cannot be both false)

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "course_id": "uuid",
    "code": "CSE220",
    "name": "Data Structures",
    "department_id": "uuid",
    "semester": "3/1",
    "year": 2024,
    "description": "Introduction to data structures and algorithms",
    "has_theory": true,
    "has_lab": false,
    "total_weeks": 16,
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Course created successfully",
  "success": true
}
```

---

### 2. Get All Courses
**GET** `/courses`

Retrieve all courses with optional filters.

**Query Parameters:**
- `department_id` (optional): Filter by department
- `semester` (optional): Filter by semester (e.g., "1/1", "1/2", "2/1", "2/2", "3/1", "3/2", "4/1", "4/2")
- `year` (optional): Filter by year (e.g., 2024)

**Example:**
```
GET /courses?department_id=uuid&semester=3/1&year=2024
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "course_id": "uuid",
      "code": "CSE220",
      "name": "Data Structures",
      "description": "Introduction to data structures",
      "department_id": "uuid",
      "department_name": "Computer Science",
      "department_code": "CSE",
      "semester": "3/1",
      "year": 2024,
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "message": "Courses retrieved successfully",
  "success": true
}
```

---

### 3. Get Course by ID
**GET** `/courses/:course_id`

Get detailed information about a specific course.

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "course_id": "uuid",
    "code": "CSE220",
    "name": "Data Structures",
    "description": "Introduction to data structures",
    "department_id": "uuid",
    "department_name": "Computer Science",
    "department_code": "CSE",
    "semester": "3/1",
    "year": 2024,
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Course retrieved successfully",
  "success": true
}
```

---

### 4. Update Course (Admin Only)
**PUT** `/courses/:course_id`

Update course details. Only admins can update courses.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Advanced Data Structures",
  "description": "Updated description",
  "semester": "3/2",
  "year": 2024,
  "has_theory": true,
  "has_lab": true,
  "total_weeks": 16,
  "is_active": true
}
```

**Note:** All fields are optional. Only provide fields you want to update.

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "course_id": "uuid",
    "course_name": "Advanced Data Structures",
    "description": "Updated description"
  },
  "message": "Course updated successfully",
  "success": true
}
```

---

### 5. Enroll in Course
**POST** `/courses/:course_id/enroll`

Enroll the current user in a course.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "enrollment_id": "uuid",
    "user_id": "uuid",
    "course_id": "uuid",
    "enrolled_at": "2024-01-15T10:00:00Z"
  },
  "message": "Enrolled in course successfully",
  "success": true
}
```

---

### 6. Get My Enrolled Courses
**GET** `/courses/my/enrollments`

Get all courses the current user is enrolled in.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "enrollment_id": "uuid",
      "enrolled_at": "2024-01-15T10:00:00Z",
      "course_id": "uuid",
      "code": "CSE220",
      "name": "Data Structures",
      "description": "Introduction to data structures",
      "semester": "3/1",
      "year": 2024,
      "department_name": "Computer Science"
    }
  ],
  "message": "Enrolled courses retrieved successfully",
  "success": true
}
```

---

## Material Management Endpoints

### 1. Upload Material (Admin Only)
**POST** `/materials/upload`

Upload a new course material (slides, PDF, code file, notes).

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The material file to upload (required)
- `course_id`: UUID of the course (required)
- `material_type`: Type of material - "slides", "pdf", "code", "notes", "video", "other" (required)
- `category`: Category - "theory" or "lab" (required)
- `title`: Title of the material (required)
- `description` (optional): Description
- `topic` (optional): Topic name
- `week_number` (optional): Week number (1-52)
- `tags` (optional): JSON array of tags (e.g., ["algorithms", "sorting", "arrays"])

**Example using cURL:**
```bash
curl -X POST http://localhost:8000/api/materials/upload \
  -H "Authorization: Bearer <admin-token>" \
  -F "file=@lecture-slides.pdf" \
  -F "course_id=uuid" \
  -F "material_type=slides" \
  -F "category=theory" \
  -F "title=Introduction to Data Structures" \
  -F "description=Lecture 1 slides" \
  -F "topic=Introduction" \
  -F "week_number=1" \
  -F "tags=introduction,data-structures,basics"
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "material_id": "uuid",
    "course_id": "uuid",
    "material_type": "slides",
    "category": "theory",
    "title": "Introduction to Data Structures",
    "description": "Lecture 1 slides",
    "file_url": "https://r2-bucket-url/materials/filename.pdf",
    "file_name": "lecture-slides.pdf",
    "file_size": 2048576,
    "mime_type": "application/pdf",
    "topic": "Introduction",
    "week_number": 1,
    "tags": ["introduction", "data-structures", "basics"],
    "view_count": 0,
    "download_count": 0,
    "uploaded_at": "2024-01-15T10:00:00Z"
  },
  "message": "Material uploaded successfully",
  "success": true
}
```

---

### 2. Get All Materials
**GET** `/materials`

Retrieve materials with extensive filtering options.

**Query Parameters:**
- `course_id` (optional): Filter by course
- `category` (optional): Filter by category ("theory" or "lab")
- `material_type` (optional): Filter by type ("slides", "pdf", "code", etc.)
- `week_number` (optional): Filter by week number
- `topic` (optional): Filter by topic (partial match)
- `tags` (optional): Filter by tags (comma-separated, e.g., "algorithms,sorting")
- `search` (optional): Search in title and description
- `limit` (optional, default=50): Number of results per page
- `offset` (optional, default=0): Offset for pagination

**Example:**
```
GET /materials?course_id=uuid&category=theory&week_number=1&search=introduction&limit=10
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "material_id": "uuid",
      "course_id": "uuid",
      "course_name": "Data Structures",
      "course_code": "CSE220",
      "title": "Introduction to Data Structures",
      "description": "Lecture 1 slides",
      "category": "theory",
      "material_type": "slides",
      "file_url": "https://r2-bucket-url/materials/filename.pdf",
      "file_name": "lecture-slides.pdf",
      "file_size": 2048576,
      "mime_type": "application/pdf",
      "week_number": 1,
      "topic": "Introduction",
      "tags": ["introduction", "data-structures", "basics"],
      "view_count": 42,
      "download_count": 15,
      "uploaded_at": "2024-01-15T10:00:00Z"
    }
  ],
  "message": "Materials retrieved successfully",
  "success": true
}
```

---

### 3. Get Material by ID
**GET** `/materials/:material_id`

Get detailed information about a specific material. Automatically increments view count.

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "material_id": "uuid",
    "course_id": "uuid",
    "course_name": "Data Structures",
    "course_code": "CSE220",
    "material_type": "slides",
    "category": "theory",
    "title": "Introduction to Data Structures",
    "description": "Lecture 1 slides",
    "file_url": "https://r2-bucket-url/materials/filename.pdf",
    "file_name": "lecture-slides.pdf",
    "file_size": 2048576,
    "mime_type": "application/pdf",
    "topic": "Introduction",
    "week_number": 1,
    "tags": ["introduction", "data-structures", "basics"],
    "view_count": 43,
    "download_count": 15,
    "uploaded_at": "2024-01-15T10:00:00Z"
  },
  "message": "Material retrieved successfully",
  "success": true
}
```

---

### 4. Update Material (Admin Only)
**PUT** `/materials/:material_id`

Update material metadata. Only admins can update materials.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "topic": "New Topic",
  "week_number": 2,
  "tags": ["updated", "tags"]
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "material_id": "uuid",
    "title": "Updated Title",
    "description": "Updated description"
  },
  "message": "Material updated successfully",
  "success": true
}
```

---

### 5. Delete Material (Admin Only)
**DELETE** `/materials/:material_id`

Delete a material and its associated file from storage.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Material deleted successfully",
  "success": true
}
```

---

### 6. Browse Materials by Category
**GET** `/materials/browse/:category`

Browse materials by category (theory or lab).

**Parameters:**
- `category`: "theory" or "lab"

**Query Parameters:**
- `course_id` (optional): Filter by specific course

**Example:**
```
GET /materials/browse/theory?course_id=uuid
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "material_id": "uuid",
      "course_id": "uuid",
      "course_name": "Data Structures",
      "course_code": "CSE220",
      "title": "Introduction to Data Structures",
      "description": "Lecture 1 slides",
      "category": "theory",
      "material_type": "slides",
      "week_number": 1,
      "topic": "Introduction",
      "tags": ["introduction", "data-structures"],
      "view_count": 43,
      "uploaded_at": "2024-01-15T10:00:00Z"
    }
  ],
  "message": "Materials retrieved successfully",
  "success": true
}
```

---

### 7. Get Materials by Week
**GET** `/materials/week/:week_number`

Get all materials for a specific week.

**Parameters:**
- `week_number`: Week number (1-16)

**Query Parameters:**
- `course_id` (required): Course UUID

**Example:**
```
GET /materials/week/1?course_id=uuid
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "material_id": "uuid",
      "course_id": "uuid",
      "course_name": "Data Structures",
      "title": "Introduction Lecture",
      "description": "Week 1 theory content",
      "category": "theory",
      "material_type": "slides",
      "topic": "Introduction",
      "tags": ["introduction"],
      "file_url": "https://r2-bucket-url/materials/file.pdf",
      "uploaded_at": "2024-01-15T10:00:00Z"
    }
  ],
  "message": "Materials for week 1 retrieved successfully",
  "success": true
}
```

**Note:** Results are ordered by category (theory first, then lab) and upload date.

---

### 8. Track Material Download
**POST** `/materials/:material_id/download`

Track when a material is downloaded. Increments download count.

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "material_id": "uuid",
    "download_count": 16,
    "file_url": "https://r2-bucket-url/materials/filename.pdf"
  },
  "message": "Download tracked",
  "success": true
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error description",
  "success": false
}
```

**Note:** Some error responses may return `data: {}` instead of `data: null`.

### Common Error Codes:
- **400**: Bad Request - Invalid input
- **401**: Unauthorized - Missing or invalid token
- **403**: Forbidden - Insufficient permissions (e.g., non-admin trying to upload)
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error

---

## User Roles

### Admin
- Can create courses
- Can upload materials
- Can update/delete materials
- Can update courses
- Has all student permissions

### Student
- Can view courses
- Can enroll in courses
- Can browse/view materials
- Can download materials
- Cannot modify any content

---

## Material Types
- `slides`: Presentation slides (PPT, PPTX, PDF)
- `pdf`: PDF documents
- `code`: Source code files
- `notes`: Text notes or documents
- `video`: Video files
- `other`: Other file types

## Categories
- `theory`: Theoretical lecture content
- `lab`: Lab/practical content

---

## Notes

1. **File Upload Limits**: Maximum file size is 10MB (configured in upload middleware)
2. **Authentication**: JWT tokens are valid for 7 days
3. **Token Storage**: Tokens are stored as httpOnly cookies AND returned in response body
4. **Pagination**: Use `limit` and `offset` for paginating results (not implemented for all endpoints)
5. **Tags**: Tags are stored as JSON arrays, not comma-separated strings
6. **Search**: The search parameter performs case-insensitive partial matching on title and description
7. **View/Download Tracking**: View count increments on GET by ID, download count increments on download endpoint
8. **Semester Format**: Use "year/semester" format (e.g., "1/1", "2/2", "3/1", "4/2")
9. **Course Requirements**: Courses must have at least theory OR lab enabled (both cannot be false)
10. **AI Image Analysis**: Uses Google Gemini 2.0 Flash model, requires GEMINI_API_KEY environment variable

---

## Testing with cURL

### Sign Up
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@bracu.ac.bd",
    "password": "SecurePass123",
    "full_name": "John Doe",
    "role": "student",
    "department_id": "your-department-uuid"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@bracu.ac.bd",
    "password": "Admin123!"
  }'
```

### Upload Profile Picture
```bash
curl -X PUT http://localhost:8000/api/auth/update-profile-picture \
  -b cookies.txt \
  -F "avatar=@profile.jpg"
```

### Create Course (with cookie auth)
```bash
curl -X POST http://localhost:8000/api/courses \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "course_code": "CSE220",
    "course_name": "Data Structures",
    "department_id": "department-uuid",
    "semester": "3/1",
    "year": 2024,
    "description": "Introduction to data structures"
  }'
```

### Upload Material (with cookie auth)
```bash
curl -X POST http://localhost:8000/api/materials/upload \
  -b cookies.txt \
  -F "file=@slides.pdf" \
  -F "course_id=course-uuid" \
  -F "material_type=slides" \
  -F "category=theory" \
  -F "title=Lecture 1" \
  -F "week_number=1" \
  -F "topic=Introduction"
```

### Get Materials
```bash
curl -X GET "http://localhost:8000/api/materials?course_id=course-uuid&category=theory&week_number=1"
```
