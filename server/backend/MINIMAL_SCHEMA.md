# Minimal Hackathon Schema - 5 Core Parts

## Overview
This is a streamlined database schema focusing **only** on the 5 core functional parts required by the hackathon problem statement. All bonus features and unnecessary tables have been removed.

---

## Schema Architecture

### **Core Foundation (3 tables)**
1. **users** - Authentication (admin/student roles)
2. **departments** - Organizational structure
3. **courses** - Courses with `has_theory` and `has_lab` flags
4. **enrollments** - Student course enrollment

---

## **Part 1: Content Management System (1 table)**

### `materials`
Stores all uploaded course content with **Theory/Lab categorization**.

**Key Fields:**
- `category`: 'theory' or 'lab' ✅
- `material_type`: slides, pdf, code, notes, video
- **Metadata**: topic, week_number, tags
- File storage: file_url, file_name, file_size
- Analytics: view_count, download_count

**Why minimal:**
- Single table handles all materials
- No separate tables for different material types
- Tags stored as PostgreSQL array
- Removed: material_dependencies (complexity)

---

## **Part 2: Intelligent Search Engine (2 tables)**

### `material_chunks`
Chunked content for RAG-based retrieval.

**Key Fields:**
- `chunk_text`: Actual content
- `chunk_type`: text, code, equation
- `is_code`: Boolean flag for code-specific search
- Context: page_number, line_start, line_end, language

### `chunk_embeddings`
Vector embeddings for semantic search using pgvector.

**Key Fields:**
- `embedding`: vector(1536) - OpenAI embeddings
- `chunk_id`: Links to material_chunks
- Vector index: `ivfflat` for fast similarity search

**Why minimal:**
- Combined all chunk types into one table
- Removed: search_queries logging (analytics)
- Removed: search_logs (not core functionality)

---

## **Part 3: AI-Generated Learning Materials (1 table)**

### `generated_content`
AI-generated study aids (notes, slides for theory; code for lab).

**Key Fields:**
- `category`: 'theory' or 'lab' ✅
- `content_type`: notes, slides, code, summary
- `content`: Generated text
- `formatted_content`: JSONB for structured output
- `source_material_ids`: Array of materials used
- `external_sources`: MCP sources (Wikipedia, etc.)
- `status`: draft, validated, published, rejected

**Why minimal:**
- Single table for all generated content
- Removed: generated_content_sections (over-engineering)
- JSON storage for flexibility

---

## **Part 4: Content Validation & Evaluation (1 table)**

### `validation_results`
Validation of AI-generated content.

**Key Fields:**
- `validation_type`: syntax, grounding, rubric, automated_test
- `is_valid`: Boolean result
- `score`: 0-100 numerical score
- `findings`: JSONB with detailed results
- `syntax_errors`: For code validation
- `test_results`: For automated testing

**Why minimal:**
- Single table for all validation types
- Removed: validation_rubrics (can be in JSONB)
- Removed: test_cases (can be in JSONB findings)
- JSONB provides flexibility without extra tables

---

## **Part 5: Conversational Chat Interface (2 tables)**

### `chat_sessions`
Chat conversation sessions.

**Key Fields:**
- `user_id`: User chatting
- `course_id`: Course context (optional)
- `is_active`: Session state
- `last_activity`: Auto-updated via trigger

### `chat_messages`
Individual chat messages with RAG context.

**Key Fields:**
- `role`: user, assistant, system
- `content`: Message text
- `retrieved_chunks`: Array of chunk IDs used in RAG
- `generated_content_id`: Links to generated content
- `tokens_used`: Cost tracking

**Why minimal:**
- Simple two-table structure
- Removed: message_feedback (nice-to-have)
- Removed: context_windows (over-engineering)

---

## What Was Removed

### ❌ Bonus Features (Not Core)
- `digitized_notes` (OCR)
- `generated_videos` (Video generation)
- `community_posts`, `community_comments`, `community_votes` (Community)

### ❌ Over-Engineering
- `material_dependencies` - Materials can reference via JSONB
- `generated_content_sections` - Use JSONB instead
- `validation_rubrics` - Store in JSONB findings
- `test_cases` - Store in JSONB findings
- `search_queries` - Not essential for hackathon
- `analytics_*` tables - Not core functionality

### ❌ Complex Features
- `course_structure` - Week organization (can be derived from materials)
- Multiple specialized validation tables - Merged into one

---

## Total Table Count

**Before:** 24+ tables  
**After:** 10 core tables

### Breakdown:
- Foundation: 4 tables (users, departments, courses, enrollments)
- Part 1 (CMS): 1 table
- Part 2 (Search): 2 tables
- Part 3 (Generation): 1 table
- Part 4 (Validation): 1 table
- Part 5 (Chat): 2 tables

---

## Theory/Lab Implementation

### At Course Level:
```sql
CREATE TABLE courses (
    ...
    has_theory BOOLEAN DEFAULT TRUE,
    has_lab BOOLEAN DEFAULT FALSE,
    total_weeks INTEGER DEFAULT 16,
    ...
);
```

### At Material Level:
```sql
CREATE TABLE materials (
    ...
    category VARCHAR(20) CHECK (category IN ('theory', 'lab')),
    ...
);
```

### At Generation Level:
```sql
CREATE TABLE generated_content (
    ...
    category VARCHAR(20) CHECK (category IN ('theory', 'lab')),
    content_type VARCHAR(50),  -- 'code' for lab, 'notes'/'slides' for theory
    ...
);
```

---

## Key Features Preserved

✅ **Theory/Lab Categorization** - At course, material, and generation levels  
✅ **Rich Metadata** - Topics, weeks, tags  
✅ **RAG Search** - Vector embeddings + semantic search  
✅ **AI Generation** - Grounded in course content + external sources  
✅ **Validation** - Syntax checking, grounding verification  
✅ **Chat Interface** - Conversational interaction with context  

---

## Performance Optimizations

### Indexes:
- GIN index on tags array
- Vector index (ivfflat) for similarity search
- Foreign key indexes on all relations
- Composite indexes on common query patterns

### Views:
- `v_course_materials_summary` - Theory/lab breakdown per course
- `v_generated_content_status` - Validation status overview

---

## Migration Strategy

### Option 1: Use Minimal Schema
```bash
# Drop existing database
docker exec -it learning_platform_db psql -U postgres -d learning_platform -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Apply minimal schema
docker exec -i learning_platform_db psql -U postgres -d learning_platform < server/data/init-minimal.sql
```

### Option 2: Keep Both
- `init.sql` - Full schema with bonuses
- `init-minimal.sql` - Hackathon-focused (recommended)

---

## Benefits of Minimal Schema

1. **Faster Development** - Less tables = less boilerplate
2. **Easier Testing** - Fewer dependencies to mock
3. **Better Performance** - Less joins, simpler queries
4. **Clearer Focus** - Only what's needed for 5 core parts
5. **Quick Pivots** - JSONB allows schema flexibility

---

## When to Add Back Tables

After core functionality works:
1. Add `course_structure` for better week organization
2. Add analytics tables for usage insights
3. Add bonus features (OCR, video, community)
4. Normalize JSONB fields if performance requires

---

## Example Queries

### Get all theory materials for Week 1:
```sql
SELECT * FROM materials 
WHERE category = 'theory' 
  AND week_number = 1 
  AND course_id = 'course-uuid';
```

### RAG search with embeddings:
```sql
SELECT c.chunk_text, c.chunk_id
FROM chunk_embeddings e
JOIN material_chunks c ON e.chunk_id = c.chunk_id
ORDER BY e.embedding <=> '[query_embedding]'
LIMIT 5;
```

### Get generated content with validation:
```sql
SELECT 
    gc.*,
    v.is_valid,
    v.score,
    v.validation_type
FROM generated_content gc
LEFT JOIN validation_results v ON gc.content_id = v.content_id
WHERE gc.course_id = 'course-uuid';
```
