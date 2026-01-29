# Database Schema Documentation

## AI-Powered Supplementary Learning Platform

This database schema supports a comprehensive learning management system with AI-powered content generation, semantic search, and validation capabilities.

## Schema Structure

### Core Tables

#### 1. **Users & Departments**
- `users` - Stores admin (instructors/TAs) and student accounts
- `departments` - Academic departments with hierarchy

#### 2. **Course Management**
- `courses` - Course catalog linked to departments
- `enrollments` - Student-course enrollment tracking
- `course_admins` - Instructor/TA assignments per course

#### 3. **Content Management System (CMS)**
- `materials` - Course materials (PDFs, slides, code, videos)
- `material_dependencies` - Prerequisite/reference relationships

#### 4. **RAG & Semantic Search**
- `material_chunks` - Content broken into searchable chunks
- `chunk_embeddings` - Vector embeddings for semantic search (requires pgvector)
- `search_queries` - Search history and analytics

#### 5. **AI-Generated Content**
- `generated_content` - AI-generated notes, slides, code
- `generated_content_sections` - Structured sections of generated content

#### 6. **Validation System**
- `validation_results` - Validation outcomes for generated content
- `validation_rubrics` - Evaluation criteria templates
- `test_cases` - Automated test cases for lab code

#### 7. **Chat Interface**
- `chat_sessions` - Conversation sessions
- `chat_messages` - Messages with context and grounding

#### 8. **Community Features**
- `community_posts` - Discussion forum posts
- `bot_replies` - AI-generated replies to posts
- `post_reactions` - User reactions (upvotes, helpful, etc.)

#### 9. **Bonus Features**
- `digitized_notes` - Handwritten note OCR results
- `generated_videos` - Content-to-video conversions

#### 10. **Analytics**
- `activity_logs` - User activity tracking
- `course_analytics` - Course-level metrics

## Key Features

### 1. Department Hierarchy
The `departments` table provides organizational structure:
- Links courses to academic departments
- Tracks department heads
- Supports multi-department universities

### 2. Semantic Search (RAG)
- Materials are chunked into `material_chunks`
- Each chunk gets vector embeddings via `chunk_embeddings`
- Supports code-aware chunking with `code_language` and `code_context`

### 3. Content Validation
Multiple validation strategies:
- **Syntax checking** - For code generation
- **Grounding** - Verify content matches source materials
- **Rubric-based** - Custom evaluation criteria
- **Test execution** - Run automated tests on generated code

### 4. Contextual Chat
Chat messages track:
- Referenced materials (`context_materials`)
- Specific chunks used (`grounding_chunks`)
- Actions performed (search, generate, summarize)

## Database Setup

### Prerequisites
- PostgreSQL 14+
- pgvector extension (for semantic search)
- uuid-ossp extension

### Installation

1. **Run the SQL schema:**
```bash
psql -U your_username -d your_database -f server/data/init.sql
```

2. **Generate Drizzle migrations:**
```bash
cd server/backend
npm run db:generate
```

3. **Push schema to database:**
```bash
npm run db:push
```

## Drizzle ORM Usage

### Example Queries

#### Insert a User
```typescript
import { db } from './db';
import { usersTable } from './db/schema';

const newUser = await db.insert(usersTable).values({
  email: 'student@university.edu',
  password_hash: 'hashed_password',
  full_name: 'John Doe',
  role: 'student'
}).returning();
```

#### Create Course with Department
```typescript
import { coursesTable, departmentsTable } from './db/schema';

// Get department
const cse = await db.select().from(departmentsTable)
  .where(eq(departmentsTable.code, 'CSE'))
  .limit(1);

// Create course
const course = await db.insert(coursesTable).values({
  code: 'CSE301',
  name: 'Data Structures',
  department_id: cse[0].department_id,
  semester: 'Fall',
  year: 2026
}).returning();
```

#### Upload Material
```typescript
import { materialsTable } from './db/schema';

const material = await db.insert(materialsTable).values({
  course_id: courseId,
  title: 'Lecture 1 - Introduction',
  category: 'theory',
  content_type: 'pdf',
  file_path: '/uploads/lecture1.pdf',
  week_number: 1,
  tags: ['introduction', 'basics'],
  uploaded_by: userId
}).returning();
```

#### Search with Vector Similarity
```typescript
import { sql } from 'drizzle-orm';

// Find similar chunks (requires pgvector setup)
const results = await db.execute(sql`
  SELECT c.chunk_id, c.chunk_text, c.material_id,
         1 - (e.embedding <=> ${queryEmbedding}) AS similarity
  FROM material_chunks c
  JOIN chunk_embeddings e ON c.chunk_id = e.chunk_id
  ORDER BY e.embedding <=> ${queryEmbedding}
  LIMIT 10
`);
```

#### Track Generated Content
```typescript
import { generatedContentTable } from './db/schema';

const generated = await db.insert(generatedContentTable).values({
  course_id: courseId,
  user_id: userId,
  prompt: 'Generate notes on binary trees',
  topic: 'Binary Trees',
  category: 'theory',
  content_type: 'notes',
  content: generatedText,
  source_materials: [materialId1, materialId2],
  model_used: 'gpt-4',
  is_validated: false
}).returning();
```

## Indexes & Performance

The schema includes optimized indexes for:
- Email lookups (unique index)
- Course/material filtering
- Vector similarity search (IVFFlat index)
- Chat message chronological queries
- Community post tag searches (GIN index)
- Activity log analytics

## Views

Pre-built views for common queries:
- `v_material_catalog` - Material info with course details
- `v_student_courses` - Student enrollment overview
- `v_generated_content_summary` - Generation stats
- `v_community_activity` - Forum engagement metrics

## Triggers

Automatic timestamp management:
- `update_users_updated_at`
- `update_departments_updated_at`
- `update_courses_updated_at`
- `update_materials_updated_at`
- `update_generated_content_updated_at`
- `update_community_posts_updated_at`
- `update_chat_session_activity` - Updates last_activity_at on new messages

## Sample Data

The schema includes sample data:
- 2 users (admin + student)
- 3 departments (CSE, EEE, ME)
- 1 sample course (CSE101)

## Next Steps

1. **Set up pgvector** for semantic search
2. **Implement file upload** service (S3/R2/local)
3. **Create embedding pipeline** for RAG
4. **Build validation services** for content checking
5. **Develop chat interface** with grounding

## Notes

- All UUIDs are auto-generated using `uuid_generate_v4()`
- Timestamps auto-update via triggers
- Foreign keys use appropriate CASCADE/SET NULL policies
- Arrays are used for tags, source materials, etc.
- JSONB fields store flexible metadata

## Type Safety

All tables have TypeScript types generated by Drizzle:
- `User`, `NewUser`
- `Department`, `NewDepartment`
- `Course`, `NewCourse`
- `Material`, `NewMaterial`
- `GeneratedContent`, `NewGeneratedContent`
- And more...

Use these types for full type safety across your application!
