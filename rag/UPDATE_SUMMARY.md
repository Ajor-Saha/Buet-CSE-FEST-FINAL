# RAG Service - Update Summary

## What Changed

### 1. **PDF Upload from URLs** ✅
The `/api/papers/upload` endpoint now supports two modes:

#### Mode 1: File Upload (Existing)
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -F "file=@paper.pdf"
```

#### Mode 2: URL Upload (NEW)
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://pub-f4b2cb5b350e44308eb23c8c7ef20596.r2.dev/materials/theory/ba14402c-1537-4ca5-81a2-80de53e6f664/NYunD8NLQSqTfAQEO6UBr.pdf"
    ]
  }'
```

**Features:**
- Downloads PDFs from HTTP/HTTPS URLs
- Validates that URLs point to PDF files
- Supports multiple URLs in one request
- Checks for duplicate filenames
- Same processing pipeline as file uploads
- Returns detailed status for each URL

### 2. **Docker Configuration** ✅
Updated Docker setup for easier deployment:

#### Files Updated:
- `docker-compose.yml` - Simplified configuration, removed frontend, fixed networking
- `Dockerfile` - Added curl for health checks, optimized build
- `start.sh` (NEW) - Automated startup script with validation
- `DOCKER_QUICKSTART.md` (NEW) - Comprehensive Docker guide
- `.env.example` (NEW) - Environment variable template
- `TESTING.md` (NEW) - API testing examples

## How to Start the Service

### Option 1: Using the Start Script (Recommended)
```bash
cd /home/sk-sazid/Desktop/Buet-CSE-FEST-FINAL/rag
./start.sh
```

The script will:
- Check if Docker is installed
- Check if Ollama is running
- Start all services (API, PostgreSQL, Qdrant)
- Wait for services to be ready
- Display service URLs and helpful commands

### Option 2: Manual Docker Compose
```bash
cd /home/sk-sazid/Desktop/Buet-CSE-FEST-FINAL/rag
docker-compose up -d
```

## Service Architecture

```
┌─────────────────┐
│   RAG API       │  Port 8000
│   (FastAPI)     │  - Upload PDFs (file or URL)
│                 │  - Query papers
└────────┬────────┘  - Manage papers
         │
         ├──────────┐
         │          │
    ┌────▼────┐  ┌──▼──────┐
    │PostgreSQL│  │ Qdrant  │
    │         │  │ Vector  │
    │ Papers  │  │   DB    │
    │Metadata │  │Embeddings│
    │Port 5433│  │Port 6333│
    └─────────┘  └─────────┘
         │
    ┌────▼────┐
    │ Ollama  │
    │  (Host) │
    │Port 11434│
    └─────────┘
```

## API Changes

### `/api/papers/upload` - Enhanced

**Request (New URL mode):**
```json
{
  "urls": [
    "https://example.com/paper1.pdf",
    "https://example.com/paper2.pdf"
  ]
}
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

### Error Handling

#### Invalid URL:
```bash
# Non-PDF URL
{"urls": ["https://example.com/doc.txt"]}
→ 422 Unprocessable Entity: "Only HTTP(S) URLs ending with .pdf are supported"
```

#### Duplicate File:
```bash
# Same filename already exists
→ Individual item marked as failed with error message
```

#### Download Failure:
```bash
# URL returns 404 or times out
→ Individual item marked as failed with error details
```

## Configuration

### Environment Variables (docker-compose.yml)

```yaml
environment:
  DATABASE_URL: postgresql+psycopg2://rag_user:rag_pass@postgres:5432/ragdb
  QDRANT_HOST: qdrant
  QDRANT_PORT: 6333
  QDRANT_COLLECTION: research_papers
  OLLAMA_BASE_URL: http://host.docker.internal:11434
  RERANK_RETRIEVAL_MULTIPLIER: 2
```

### Ports

- **8000**: RAG API (FastAPI)
- **5433**: PostgreSQL (mapped from container 5432)
- **6333**: Qdrant HTTP API
- **6334**: Qdrant gRPC API

## Testing

See [TESTING.md](TESTING.md) for comprehensive test examples.

### Quick Test:
```bash
# 1. Upload a paper from URL
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://pub-f4b2cb5b350e44308eb23c8c7ef20596.r2.dev/materials/theory/ba14402c-1537-4ca5-81a2-80de53e6f664/NYunD8NLQSqTfAQEO6UBr.pdf"]
  }'

# 2. List papers
curl http://localhost:8000/api/papers

# 3. Query the paper
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this paper about?",
    "top_k": 5
  }'
```

## Troubleshooting

### Check Service Health
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok", "db": true, "qdrant": true}
```

### View Logs
```bash
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f qdrant
```

### Restart Services
```bash
docker-compose restart
```

### Reset Everything
```bash
docker-compose down -v  # ⚠️ Deletes all data
docker-compose up -d --build
```

## Data Persistence

Data is stored in Docker volumes:
- `pgdata`: All paper metadata and query history
- `qdrant_storage`: Vector embeddings
- `hf_cache`: Hugging Face model cache
- `./temp`: Uploaded PDFs and chunk JSON files (mounted directory)

To backup data:
```bash
docker-compose exec postgres pg_dump -U rag_user ragdb > backup.sql
```

## Next Steps

1. **Start the service**: `./start.sh` or `docker-compose up -d`
2. **Upload papers**: Use the URL upload feature
3. **Query papers**: Use the `/api/query` endpoint
4. **Monitor**: Check logs with `docker-compose logs -f`

## Files Modified

- `src/api/routes.py` - Added URL download functionality
- `docker-compose.yml` - Simplified Docker setup
- `Dockerfile` - Added health check support

## Files Created

- `start.sh` - Automated startup script
- `DOCKER_QUICKSTART.md` - Docker usage guide
- `TESTING.md` - API testing examples
- `.env.example` - Environment template
- `UPDATE_SUMMARY.md` - This file

## Dependencies

All required dependencies are already in `requirements.txt`:
- `requests` - For downloading PDFs from URLs
- `fastapi`, `uvicorn` - Web framework
- `sentence-transformers` - Embeddings
- `qdrant-client` - Vector database
- `sqlalchemy`, `psycopg2-binary` - Database
- `PyPDF2`, `pdfminer.six` - PDF processing
