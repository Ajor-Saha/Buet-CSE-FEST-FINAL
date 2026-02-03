# Research Paper RAG System - API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:8000`  
**Content-Type:** `application/json` (unless otherwise specified)

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Paper Management](#paper-management)
  - [Query System](#query-system)
  - [Analytics](#analytics)
  - [Health Check](#health-check)

---

## Overview

The Research Paper RAG (Retrieval-Augmented Generation) System provides a complete API for managing academic papers and performing intelligent queries using vector search and LLMs.

### Key Features

- 📤 **Upload PDFs** from files or URLs
- 🔍 **Semantic search** across papers using vector embeddings
- 🤖 **AI-powered answers** with citations and confidence scores
- 📊 **Analytics** for query history and popular topics
- 🗑️ **Paper management** with full CRUD operations

### Technology Stack

- **Framework:** FastAPI
- **Vector Database:** Qdrant
- **Embeddings:** Sentence Transformers
- **LLM:** Ollama (llama3)
- **Database:** PostgreSQL

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Error Handling

### Standard Error Response

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate paper) |
| `422` | Validation error |
| `500` | Internal server error |

---

## Endpoints

### Paper Management

#### 1. Upload Papers from File

Upload one or more PDF research papers from local files.

**Endpoint:** `POST /api/papers/upload`  
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` or `files` | File | Yes | PDF file(s) to upload |

**Example Request (curl):**

```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -F "file=@paper1.pdf" \
  -F "file=@paper2.pdf"
```

**Response:**

```json
{
  "processed": [
    {
      "filename": "paper1.pdf",
      "paper_id": 1,
      "metadata": {
        "title": "Paper Title",
        "authors": "Author Names",
        "year": "2024",
        "pages": 10
      },
      "chunks": 45,
      "chunks_file": "temp/paper1_chunks.json",
      "status": "success"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

---

#### 2. Upload Papers from URL

Upload PDF papers from HTTP/HTTPS URLs.

**Endpoint:** `POST /api/papers/upload`  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "urls": [
    "https://example.com/paper1.pdf",
    "https://example.com/paper2.pdf"
  ]
}
```

**Example Request (curl):**

```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://pub-f4b2cb5b350e44308eb23c8c7ef20596.r2.dev/materials/theory/ba14402c-1537-4ca5-81a2-80de53e6f664/NYunD8NLQSqTfAQEO6UBr.pdf"
    ]
  }'
```

**Response:**

```json
{
  "processed": [
    {
      "url": "https://example.com/paper1.pdf",
      "filename": "paper1.pdf",
      "paper_id": 1,
      "metadata": {
        "title": "Paper Title",
        "authors": "Author Names",
        "year": "2024",
        "pages": 10
      },
      "chunks": 45,
      "chunks_file": "temp/paper1_chunks.json",
      "status": "success"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

**Error Cases:**

- `422` - Non-PDF URLs or invalid format
- `409` - Duplicate filename already exists

---

#### 3. List All Papers

Get a list of all uploaded papers.

**Endpoint:** `GET /api/papers`

**Example Request:**

```bash
curl http://localhost:8000/api/papers
```

**Response:**

```json
{
  "papers": [
    {
      "id": 1,
      "title": "Paper Title",
      "authors": "Author Names",
      "year": "2024",
      "filename": "paper1.pdf",
      "pages": 10,
      "created_at": "2026-01-29T12:00:00"
    }
  ],
  "total": 1
}
```

---

#### 4. Get Paper by ID

Retrieve detailed information about a specific paper.

**Endpoint:** `GET /api/papers/{paper_id}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `paper_id` | integer | The ID of the paper |

**Example Request:**

```bash
curl http://localhost:8000/api/papers/1
```

**Response:**

```json
{
  "id": 1,
  "title": "Paper Title",
  "authors": "Author Names",
  "year": "2024",
  "filename": "paper1.pdf",
  "pages": 10,
  "created_at": "2026-01-29T12:00:00"
}
```

**Error Cases:**

- `404` - Paper not found

---

#### 5. Get Paper Statistics

Get detailed statistics for a paper including chunk distribution by section.

**Endpoint:** `GET /api/papers/{paper_id}/stats`

**Example Request:**

```bash
curl http://localhost:8000/api/papers/1/stats
```

**Response:**

```json
{
  "paper_id": 1,
  "title": "Paper Title",
  "filename": "paper1.pdf",
  "pages": 10,
  "total_chunks": 45,
  "sections": {
    "Abstract": 7,
    "Introduction": 15,
    "Methods": 10,
    "Results": 8,
    "Conclusion": 5
  },
  "avg_chunk_length": 450,
  "created_at": "2026-01-29T12:00:00"
}
```

---

#### 6. Delete Paper

Delete a paper and all its associated vectors.

**Endpoint:** `DELETE /api/papers/{paper_id}`

**Example Request:**

```bash
curl -X DELETE http://localhost:8000/api/papers/1
```

**Response:**

```json
{
  "message": "Paper deleted successfully",
  "paper_id": 1,
  "paper_title": "Paper Title",
  "vectors_deleted": true
}
```

**Error Cases:**

- `404` - Paper not found

---

### Query System

#### 7. Query Papers (Standard)

Ask questions about the uploaded papers using RAG pipeline.

**Endpoint:** `POST /api/query`  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "question": "What is the main methodology discussed?",
  "top_k": 5,
  "paper_ids": [1, 2],
  "model": "llama3"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `question` | string | Yes | - | The question to answer |
| `top_k` | integer | No | 5 | Number of chunks to retrieve (1-50) |
| `paper_ids` | array | No | null | Limit search to specific papers |
| `model` | string | No | llama3 | LLM model to use |

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is blockchain sustainability?",
    "top_k": 5,
    "model": "llama3"
  }'
```

**Response:**

```json
{
  "answer": "Blockchain sustainability refers to...",
  "citations": [
    {
      "paper_id": 1,
      "paper_title": "Sustainability in Blockchain",
      "filename": "paper1.pdf",
      "section": "Introduction",
      "page": 3,
      "text": "Relevant excerpt from the paper..."
    }
  ],
  "sources_used": ["paper1.pdf"],
  "confidence": 0.85
}
```

**Error Cases:**

- `422` - Empty question or invalid top_k

---

#### 8. Query Papers (Streaming)

Stream the answer word-by-word using Server-Sent Events (SSE).

**Endpoint:** `POST /api/query/stream`  
**Content-Type:** `application/json`  
**Accept:** `text/event-stream`

**Request Body:** Same as standard query

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/query/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -N \
  -d '{
    "question": "What is blockchain sustainability?",
    "top_k": 5
  }'
```

**Response (SSE Stream):**

```
data: {"type": "token", "content": "Blockchain"}

data: {"type": "token", "content": " sustainability"}

data: {"type": "metadata", "citations": [...], "confidence": 0.85}

data: {"type": "done"}
```

**Note:** This endpoint is optimized for web UI. For API testing, use the standard `/api/query` endpoint.

---

### Analytics

#### 9. Query History

Retrieve recent query history.

**Endpoint:** `GET /api/queries/history?limit=20`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Number of queries to retrieve (1-100) |

**Example Request:**

```bash
curl http://localhost:8000/api/queries/history?limit=10
```

**Response:**

```json
{
  "queries": [
    {
      "id": 1,
      "question": "What is blockchain?",
      "paper_ids": [1, 2],
      "response_time_ms": 1200,
      "confidence": 0.85,
      "created_at": "2026-01-29T12:00:00"
    }
  ],
  "total": 1
}
```

---

#### 10. Popular Topics

Get the most frequently queried topics.

**Endpoint:** `GET /api/analytics/popular?limit=10`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of topics to retrieve (1-50) |

**Example Request:**

```bash
curl http://localhost:8000/api/analytics/popular?limit=5
```

**Response:**

```json
{
  "popular_topics": [
    {
      "topic": "blockchain",
      "count": 15
    },
    {
      "topic": "sustainability",
      "count": 12
    }
  ]
}
```

---

### Health Check

#### 11. Root Health Check

Basic health check endpoint.

**Endpoint:** `GET /`

**Example Request:**

```bash
curl http://localhost:8000/
```

**Response:**

```json
{
  "message": "RAG System API is running"
}
```

---

#### 12. Detailed Health Check

Check status of all services (database, vector store).

**Endpoint:** `GET /health`

**Example Request:**

```bash
curl http://localhost:8000/health
```

**Response:**

```json
{
  "status": "ok",
  "db": true,
  "qdrant": true
}
```

---

## Rate Limits

Currently, there are no rate limits enforced. However, it's recommended to:

- Limit concurrent uploads to 3 papers at a time
- Allow sufficient time between queries for LLM processing

---

## Best Practices

### Uploading Papers

1. **File Format:** Only PDF files are supported
2. **File Size:** Recommended maximum 50MB per file
3. **Naming:** Use descriptive filenames (they're stored as identifiers)
4. **Duplicates:** Delete existing papers before re-uploading

### Querying

1. **Specific Questions:** More specific questions yield better answers
2. **Top K:** Start with `top_k=5`, increase if needed
3. **Paper IDs:** Limit search to specific papers for focused answers
4. **Confidence Score:** Scores below 0.5 may indicate insufficient context

### Performance

1. **Concurrent Requests:** Limit to 5 concurrent query requests
2. **Caching:** Repeat queries are not cached
3. **Background Processing:** Uploads are processed asynchronously

---

## Examples

### Complete Workflow

```bash
# 1. Upload a paper from URL
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/paper.pdf"]}'

# 2. List all papers
curl http://localhost:8000/api/papers

# 3. Query the paper
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main conclusion?",
    "top_k": 5
  }'

# 4. Get paper statistics
curl http://localhost:8000/api/papers/1/stats

# 5. View query history
curl http://localhost:8000/api/queries/history?limit=5
```

---

## Troubleshooting

### Common Issues

**"Field 'urls' must be an array of strings"**
- Ensure JSON body has proper array format: `{"urls": ["url1", "url2"]}`

**"Only PDF files are accepted"**
- Verify URL ends with `.pdf` and returns PDF content-type

**"Paper already exists"**
- Delete existing paper first or use a different filename

**"Question is required"**
- Ensure question field is not empty or whitespace only

**"No relevant information found"**
- Try uploading more papers or rephrasing the question

---

## Support

For issues or questions:
- Check the [Docker Quickstart Guide](DOCKER_QUICKSTART.md)
- View [Testing Examples](TESTING.md)
- Review [Implementation Checklist](IMPLEMENTATION_CHECKLIST.md)

---

## Changelog

### Version 1.0 (2026-01-29)

- ✅ Added URL-based PDF upload
- ✅ Implemented RAG query system
- ✅ Added paper management endpoints
- ✅ Added analytics endpoints
- ✅ Streaming SSE support for queries

---

**Last Updated:** January 29, 2026  
**API Version:** 1.0
