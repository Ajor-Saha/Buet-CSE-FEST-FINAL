# Material Upload & RAG Workflow

## Overview
This document describes the workflow for uploading materials, parsing them, and preparing data for the RAG-based intelligent search system.

---

## Workflow Steps

### 1️⃣ Upload Material (CMS)
**Endpoint:** `POST /api/materials/upload`

Upload course material (PDF, DOCX, PPTX, etc.) to R2 storage.

```bash
curl -X POST http://localhost:8000/api/materials/upload \
  -b /tmp/cookies.txt \
  -F "course_id=c57c60dd-1b35-49b3-be05-196a4787811a" \
  -F "title=Database Systems Week 1" \
  -F "category=theory" \
  -F "content_type=lecture_note" \
  -F "week_number=1" \
  -F "file=@lecture.pdf"
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "material_id": "80b510e4-fa14-44ce-af43-150d580d3354",
    "file_url": "https://pub-xxx.r2.dev/materials/theory/...",
    "title": "Database Systems Week 1",
    ...
  }
}
```

📝 **Save the `material_id` and `file_url` for next step**

---

### 2️⃣ Parse Material & Store Chunks
**Endpoint:** `POST /api/pdf-parser/parse-from-url`

Parse the uploaded file and store chunks in database for RAG.

```bash
curl -X POST http://localhost:8000/api/pdf-parser/parse-from-url \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "80b510e4-fa14-44ce-af43-150d580d3354",
    "file_url": "https://pub-xxx.r2.dev/materials/theory/..."
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "material_id": "80b510e4-fa14-44ce-af43-150d580d3354",
    "parsing_info": {
      "total_pages": 25,
      "total_tables": 5,
      "total_images": 3,
      "total_chunks": 30
    },
    "chunks_stored": 30,
    "content": {
      "text_pages": [...],
      "tables": [...],
      "images": [...]
    }
  },
  "message": "Document parsed and chunks stored successfully"
}
```

---

## What Gets Stored in Database

### `material_chunks` Table
Stores parsed content chunks for RAG retrieval:

```sql
material_chunks (
  chunk_id UUID PRIMARY KEY,
  material_id UUID REFERENCES materials,
  chunk_index INTEGER,
  chunk_type TEXT,  -- 'text' or 'table'
  content TEXT,     -- Actual text content
  page_number INTEGER,
  metadata JSONB    -- { has_tables, table_count, rows, columns, bbox }
)
```

**Example Chunks:**

```json
// Text chunk
{
  "chunk_type": "text",
  "content": "Introduction to Database Management Systems...",
  "page_number": 1,
  "metadata": {
    "has_tables": false,
    "table_count": 0
  }
}

// Table chunk
{
  "chunk_type": "table",
  "content": "[[\"Name\", \"Age\"], [\"John\", \"25\"]]",
  "page_number": 5,
  "metadata": {
    "rows": 10,
    "columns": 4,
    "bbox": [100, 200, 500, 600]
  }
}
```

---

## Next Steps: RAG System (Part 2)

### Phase 1: Generate Embeddings ⏭️
- For each chunk in `material_chunks`, generate OpenAI embedding
- Store in `chunk_embeddings` table with vector(1536)

### Phase 2: Semantic Search ⏭️
- Accept natural language queries
- Generate query embedding
- Use pgvector cosine similarity to find relevant chunks
- Return top-k chunks with context

### Phase 3: RAG Response ⏭️
- Retrieve relevant chunks
- Construct context from chunks
- Send to LLM (GPT-4, Claude) with context
- Stream response back to user

---

## Parsed Content Structure

### Text Pages
```json
{
  "page_number": 1,
  "text": "Full text content of the page..."
}
```

### Tables
```json
{
  "page": 5,
  "rows": 10,
  "columns": 4,
  "bbox": [x, y, width, height],
  "content": [
    [{"text": "Header 1"}, {"text": "Header 2"}],
    [{"text": "Cell 1"}, {"text": "Cell 2"}]
  ]
}
```

### Images
```json
{
  "filename": "page_1_screenshot.jpg",
  "page_number": 1,
  "presigned_url": "https://...",
  "size_bytes": 123456,
  "type": "screenshot"
}
```

---

## Supported File Types

- ✅ PDF (.pdf)
- ✅ Word Documents (.doc, .docx)
- ✅ PowerPoint (.ppt, .pptx)
- ✅ Excel/Spreadsheets (.xlsx)
- ✅ HTML files
- ✅ Text files (.txt, .md)
- ✅ Images (with OCR)

---

## Advanced Features for RAG

### 1. Chunking Strategy
Currently chunking by **pages**. Can be improved with:
- **Semantic chunking**: Split by topics/sections
- **Sliding window**: Overlapping chunks for context
- **Token-based**: Chunk by token count (512, 1024 tokens)

### 2. Table Handling
Tables are stored separately with structure preserved:
- Can embed table descriptions
- Can query tables specifically
- Can use SQL for structured queries

### 3. Image Handling
Images extracted with URLs:
- Can process with Vision LLM (GPT-4V)
- Can generate image descriptions
- Can embed descriptions for search

### 4. Code Block Detection
Code blocks in PDFs:
- Extract as text chunks
- Can add syntax highlighting metadata
- Can enable syntax-aware search

---

## Error Handling

### Large Files (>10MB)
- Uses streaming to avoid memory issues
- Automatic chunking for processing

### Failed Parsing
- Returns detailed error message
- Cleans up temporary files
- Material remains in database (chunks not created)

### Missing Dependencies
- Checks for LlamaCloud API key
- Validates material exists in database
- Validates file URL is accessible

---

## Testing the Workflow

```bash
# 1. Upload material
MATERIAL_RESPONSE=$(curl -X POST http://localhost:8000/api/materials/upload \
  -b /tmp/cookies.txt \
  -F "course_id=YOUR_COURSE_ID" \
  -F "title=Test Document" \
  -F "category=theory" \
  -F "content_type=lecture_note" \
  -F "file=@test.pdf" \
  2>/dev/null)

# Extract material_id and file_url
MATERIAL_ID=$(echo $MATERIAL_RESPONSE | jq -r '.data.material_id')
FILE_URL=$(echo $MATERIAL_RESPONSE | jq -r '.data.file_url')

echo "Material ID: $MATERIAL_ID"
echo "File URL: $FILE_URL"

# 2. Parse and store chunks
curl -X POST http://localhost:8000/api/pdf-parser/parse-from-url \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d "{
    \"material_id\": \"$MATERIAL_ID\",
    \"file_url\": \"$FILE_URL\"
  }" | jq .
```

---

## Database Queries

### Check stored chunks
```sql
SELECT 
  mc.chunk_id,
  mc.chunk_type,
  mc.page_number,
  LENGTH(mc.content) as content_length,
  mc.metadata
FROM material_chunks mc
WHERE mc.material_id = 'YOUR_MATERIAL_ID'
ORDER BY mc.chunk_index;
```

### Count chunks by type
```sql
SELECT 
  chunk_type,
  COUNT(*) as count
FROM material_chunks
WHERE material_id = 'YOUR_MATERIAL_ID'
GROUP BY chunk_type;
```

### Get all tables
```sql
SELECT 
  page_number,
  metadata->>'rows' as rows,
  metadata->>'columns' as columns,
  content
FROM material_chunks
WHERE material_id = 'YOUR_MATERIAL_ID'
  AND chunk_type = 'table';
```
