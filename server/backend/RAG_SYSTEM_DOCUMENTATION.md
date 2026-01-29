# Part 2: Intelligent Search Engine (RAG-Based) - Complete Implementation

## ✅ System Overview

This is a **production-ready RAG (Retrieval-Augmented Generation) system** with:
- ✅ Semantic search beyond keyword matching
- ✅ Syntax-aware code search for lab materials
- ✅ Structure-aware table extraction
- ✅ Vector embeddings with OpenAI
- ✅ PostgreSQL with pgvector for similarity search
- ✅ RAG-based chatbot for Q&A

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                          │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │ Upload  │   │ Generate │   │ RAG Chat │
    │Material │   │Embeddings│   │  Search  │
    └────┬────┘   └────┬─────┘   └────┬─────┘
         │             │              │
         │             ▼              ▼
         │      ┌────────────────────────┐
         │      │  OpenAI Embeddings API │
         │      │  text-embedding-3-small│
         │      │     (1536 dimensions)  │
         │      └──────────┬─────────────┘
         │                 │
         ▼                 ▼
    ┌────────────────────────────────────┐
    │      PostgreSQL + pgvector          │
    │                                     │
    │  ┌────────────┐  ┌──────────────┐  │
    │  │ material_  │  │    chunk_    │  │
    │  │  chunks    │  │  embeddings  │  │
    │  │            │  │              │  │
    │  │ • text     │  │ • vector     │  │
    │  │ • type     │  │ • model      │  │
    │  │ • page     │  │              │  │
    │  └────────────┘  └──────────────┘  │
    └────────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │  Vector Search   │
    │  (Cosine <=>)    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  GPT-4o-mini     │
    │  Answer Gen      │
    └──────────────────┘
```

---

## 📊 Database Schema

### material_chunks Table
Stores parsed content from PDFs/documents:

```sql
CREATE TABLE material_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(material_id) ON DELETE CASCADE,
  
  -- Content
  chunk_text TEXT NOT NULL,
  chunk_order INTEGER NOT NULL,
  chunk_type VARCHAR(50),  -- 'text', 'table', 'code'
  
  -- Context
  page_number INTEGER,
  line_start INTEGER,
  line_end INTEGER,
  
  -- Code-specific
  language VARCHAR(50),
  is_code BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### chunk_embeddings Table
Stores vector embeddings for semantic search:

```sql
CREATE TABLE chunk_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES material_chunks(chunk_id) ON DELETE CASCADE,
  
  embedding vector(1536),  -- pgvector type
  model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create vector similarity index for fast search
CREATE INDEX chunk_embeddings_vector_idx 
ON chunk_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

---

## 🔌 API Endpoints

### 1. Generate Embeddings
**POST** `/api/rag/generate-embeddings`

Generate OpenAI embeddings for all chunks of a material.

```bash
curl -X POST http://localhost:8000/api/rag/generate-embeddings \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "a7abe8f3-b432-4c12-bc56-bce5a4199899"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "material_id": "...",
    "total_chunks": 36,
    "embeddings_generated": 36
  },
  "message": "Embeddings generated successfully"
}
```

**How it works:**
1. Fetches all chunks for the material
2. Batches chunks (100 at a time) for efficiency
3. Calls OpenAI embeddings API
4. Stores 1536-dimensional vectors in `chunk_embeddings` table

---

### 2. Semantic Search
**POST** `/api/rag/semantic-search`

Search course materials using natural language queries.

```bash
curl -X POST http://localhost:8000/api/rag/semantic-search \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is DBMS architecture?",
    "course_id": "c57c60dd-1b35-49b3-be05-196a4787811a",
    "top_k": 5
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "query": "What is DBMS architecture?",
    "results": [
      {
        "chunk_id": "...",
        "material_title": "Database core",
        "page_number": 21,
        "chunk_type": "text",
        "text_excerpt": "The three-tier architecture...",
        "similarity_score": 0.8234
      }
    ]
  }
}
```

**How it works:**
1. Converts query to embedding using OpenAI
2. Performs vector similarity search using pgvector's `<=>` operator
3. Returns top-k most similar chunks with similarity scores
4. Filters by course_id if specified

---

### 3. RAG Chatbot (Q&A)
**POST** `/api/rag/chat`

Answer questions using course materials (Retrieval-Augmented Generation).

```bash
curl -X POST http://localhost:8000/api/rag/chat \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain the three-tier architecture in DBMS. What are the advantages?",
    "course_id": "c57c60dd-1b35-49b3-be05-196a4787811a",
    "top_k": 5
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "question": "Explain the three-tier architecture...",
    "answer": "The three-tier architecture in DBMS consists of...\n\n1. **Client Layer**: Handles user interface...\n2. **Application Server**: Processes business logic...\n3. **Database Server**: Manages data storage...\n\nAdvantages:\n- Separation of concerns\n- Improved scalability\n- Enhanced security...",
    "sources": [
      {
        "material": "Database core",
        "page": 21,
        "type": "text",
        "is_code": false
      }
    ],
    "tokens_used": 4239
  }
}
```

**How it works:**
1. **Retrieval**: Same as semantic search - find relevant chunks
2. **Context Building**: Constructs context from top-k chunks with citations
3. **Generation**: Sends context + question to GPT-4o-mini
4. **System Prompt**:
   - Answer ONLY using provided context
   - Cite sources (material name, page number)
   - Be pedagogical (help students understand)
   - Format code/tables properly

---

### 4. Syntax-Aware Code Search
**POST** `/api/rag/code-search`

Search specifically for code snippets in lab materials.

```bash
curl -X POST http://localhost:8000/api/rag/code-search \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "query": "binary search implementation",
    "course_id": "c57c60dd-1b35-49b3-be05-196a4787811a",
    "language": "python",
    "top_k": 3
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "query": "binary search implementation",
    "results": [
      {
        "chunk_id": "...",
        "material_title": "Lab Session 5",
        "page_number": 3,
        "language": "python",
        "code": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    ...",
        "similarity_score": 0.876
      }
    ]
  }
}
```

**How it works:**
1. Filters chunks where `is_code = true`
2. Optionally filters by programming language
3. Performs semantic search on code content
4. Returns code snippets with syntax highlighting metadata

---

## 🧪 Complete Testing Workflow

### Step 1: Upload Material
```bash
curl -X POST http://localhost:8000/api/materials/upload \
  -b /tmp/cookies.txt \
  -F "course_id=YOUR_COURSE_ID" \
  -F "title=Database Systems Lecture 1" \
  -F "category=theory" \
  -F "content_type=lecture_note" \
  -F "file=@lecture.pdf"
```

**Save:** `material_id` and `file_url`

---

### Step 2: Parse & Chunk Material
```bash
curl -X POST http://localhost:8000/api/pdf-parser/parse-from-url \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "YOUR_MATERIAL_ID",
    "file_url": "YOUR_FILE_URL"
  }'
```

**Result:** Creates 36 chunks in `material_chunks` table

---

### Step 3: Generate Embeddings
```bash
curl -X POST http://localhost:8000/api/rag/generate-embeddings \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "YOUR_MATERIAL_ID"
  }'
```

**Result:** 36 embeddings stored in `chunk_embeddings` table

---

### Step 4: Search & Chat
```bash
# Semantic Search
curl -X POST http://localhost:8000/api/rag/semantic-search \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is normalization?",
    "course_id": "YOUR_COURSE_ID",
    "top_k": 5
  }'

# RAG Chat
curl -X POST http://localhost:8000/api/rag/chat \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain the difference between 2NF and 3NF with examples",
    "course_id": "YOUR_COURSE_ID"
  }'
```

---

## 🎯 Key Features

### 1. Semantic Search (Beyond Keywords)
❌ Keyword matching: "database normalization" only finds exact matches  
✅ Semantic search: Understands "organizing data to reduce redundancy"

### 2. Syntax-Aware Code Search
- Filters chunks by `is_code` flag
- Filters by programming language
- Preserves code structure in chunks
- Returns code snippets with context

### 3. Structure-Aware Table Handling
- Tables extracted separately during parsing
- Stored as `chunk_type='table'`
- Preserves row/column structure
- Can be embedded and searched

### 4. RAG-Based Q&A
- Retrieves relevant context first
- Grounds LLM responses in course materials
- Cites sources (material + page number)
- Prevents hallucination

### 5. Multi-Course Support
- Filter search by `course_id`
- Students only access their enrolled courses
- Separate embeddings per material

---

## 📈 Performance Optimizations

### 1. Batch Embedding Generation
```typescript
const batchSize = 100;
for (let i = 0; i < chunks.length; i += batchSize) {
  const batch = chunks.slice(i, i + batchSize);
  await openai.embeddings.create({
    input: batch.map(c => c.chunk_text)
  });
}
```

### 2. Vector Index for Fast Search
```sql
CREATE INDEX chunk_embeddings_vector_idx 
ON chunk_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

### 3. Top-K Limiting
```typescript
.limit(top_k)  // Only fetch what's needed
```

---

## 🔒 Security

- ✅ All endpoints require authentication (`authMiddleware`)
- ✅ Students can only access materials from enrolled courses
- ✅ OpenAI API key stored in environment variables
- ✅ SQL injection prevention via Drizzle ORM

---

## 🛠️ Environment Setup

Add to `.env`:

```env
# OpenAI for embeddings and chat
OPENAI_API_KEY=sk-...

# PostgreSQL with pgvector
DATABASE_URL=postgresql://user:pass@localhost:5434/dbname
```

---

## 📊 Sample Query Results

### Test Case: Database Concepts
**Query:** "What is DBMS architecture?"

**Top Results:**
1. Page 11 - Similarity: 0.65 - "Scientific applications that store large amounts..."
2. Page 19 - Similarity: 0.62 - "Centralized and Client-Server Architecture"
3. Page 8 - Similarity: 0.60 - "Application Programmers implement..."

---

### Test Case: Complex Question
**Question:** "Explain the three-tier architecture in DBMS. What are the advantages?"

**RAG Answer:**
> The three-tier architecture in DBMS consists of:
> 
> 1. **Client (Presentation Layer)**: GUI interfaces for user interaction
> 2. **Application Server (Business Logic Layer)**: Processes requests and applies business rules
> 3. **Database Server (Data Management Layer)**: Handles data storage and retrieval
> 
> **Advantages:**
> - Separation of concerns - independent development
> - Improved scalability - scale layers independently
> - Enhanced security - middleware controls access
> - Reusability - share components across applications
> - Flexibility - modify layers without affecting others
>
> *Sources: Database core (Pages 21, 22)*

**Tokens Used:** 4,239

---

## 🚀 Next Steps (Part 3-5)

### Part 3: AI-Generated Learning Materials
- Generate study notes from chunks
- Create slides using GPT-4
- Use Wikipedia MCP for external context

### Part 4: Content Validation
- Verify generated content against source chunks
- Syntax checking for code
- Grounding score calculation

### Part 5: Chat Interface
- Streaming responses
- Chat history
- Multi-turn conversations with context

---

## ✅ Hackathon Requirements Met

| Requirement | Status | Implementation |
|------------|--------|---------------|
| Semantic search | ✅ | OpenAI embeddings + pgvector |
| Beyond keyword matching | ✅ | Vector similarity search |
| RAG-based approach | ✅ | Retrieval + GPT-4o-mini generation |
| Relevant excerpts | ✅ | Top-k chunks with page numbers |
| Code snippets | ✅ | `is_code` filtering + language detection |
| **Bonus:** Syntax-aware search | ✅ | `/code-search` endpoint |
| **Bonus:** Structure-aware | ✅ | Table extraction + separate embeddings |

---

## 📝 Code Quality

- ✅ TypeScript with full type safety
- ✅ Error handling with try-catch
- ✅ Consistent API responses (`ApiResponse`)
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ Async/await pattern
- ✅ Environment variable validation
- ✅ Comprehensive logging

---

## 🎓 Educational Value

This RAG system helps students:
1. **Find information quickly** - semantic search vs reading entire PDFs
2. **Get answers instantly** - chatbot explains concepts from course materials
3. **Discover code examples** - syntax-aware search for lab materials
4. **Learn with citations** - sources prevent misinformation
5. **Ask follow-up questions** - conversational interface

**Built for the hackathon with ❤️ by Team BUET**
