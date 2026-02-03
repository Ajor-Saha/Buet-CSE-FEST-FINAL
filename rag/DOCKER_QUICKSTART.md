# RAG Service Docker Quickstart

This guide explains how to start the RAG service using Docker.

## Prerequisites

1. **Docker & Docker Compose** installed on your system
2. **Ollama** running on your host machine (for LLM inference)
   - Install from: https://ollama.ai
   - Pull the model: `ollama pull llama3`

## Quick Start

### 1. Start the Services

Navigate to the `rag` directory and run:

```bash
cd /home/sk-sazid/Desktop/Buet-CSE-FEST-FINAL/rag
docker-compose up -d
```

This will start:
- **rag_api** (FastAPI backend) on port 8000
- **rag_postgres** (PostgreSQL database) on port 5433
- **rag_qdrant** (Vector database) on ports 6333, 6334

### 2. Check Service Health

```bash
# View logs
docker-compose logs -f api

# Check health endpoint
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "db": true,
  "qdrant": true
}
```

### 3. Upload Papers

#### Upload from URL:

```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://pub-f4b2cb5b350e44308eb23c8c7ef20596.r2.dev/materials/theory/ba14402c-1537-4ca5-81a2-80de53e6f664/NYunD8NLQSqTfAQEO6UBr.pdf"
    ]
  }'
```

#### Upload from file:

```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -F "file=@/path/to/paper.pdf"
```

### 4. Query Papers

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic of this paper?",
    "top_k": 5,
    "model": "llama3"
  }'
```

## Service Management

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ deletes all data)
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f qdrant
```

## API Endpoints

- **Upload Papers**: `POST /api/papers/upload`
  - Accepts file upload or JSON with `{"urls": [...]}`
- **Query**: `POST /api/query`
- **List Papers**: `GET /api/papers`
- **Get Paper**: `GET /api/papers/{paper_id}`
- **Delete Paper**: `DELETE /api/papers/{paper_id}`
- **Paper Stats**: `GET /api/papers/{paper_id}/stats`
- **Health Check**: `GET /health`

## Troubleshooting

### Cannot connect to Ollama
Make sure Ollama is running on your host machine:
```bash
ollama serve
```

If using Docker Desktop on Mac/Windows, `host.docker.internal` should work automatically.
On Linux, you may need to use your actual host IP address in `docker-compose.yml`:
```yaml
OLLAMA_BASE_URL: http://192.168.1.x:11434  # Replace with your IP
```

### Database connection issues
Check if PostgreSQL is healthy:
```bash
docker-compose ps
```

### Vector database issues
Check Qdrant logs:
```bash
docker-compose logs qdrant
```

### Port conflicts
If ports 8000, 5433, 6333, or 6334 are already in use, modify the port mappings in `docker-compose.yml`.

## Environment Variables

You can customize these in `docker-compose.yml`:

- `DATABASE_URL`: PostgreSQL connection string
- `QDRANT_HOST`: Qdrant hostname
- `QDRANT_PORT`: Qdrant port
- `QDRANT_COLLECTION`: Collection name for vectors
- `OLLAMA_BASE_URL`: Ollama API endpoint
- `RERANK_RETRIEVAL_MULTIPLIER`: Re-ranking multiplier (default: 2)

## Data Persistence

Data is persisted in Docker volumes:
- `pgdata`: PostgreSQL database
- `qdrant_storage`: Vector embeddings
- `hf_cache`: Hugging Face model cache
- `./temp`: PDF files and chunks (mounted directory)

## Development Mode

The service runs in development mode with auto-reload enabled. Any changes to Python files will trigger a restart.

To disable auto-reload, modify the command in `docker-compose.yml`:
```yaml
command: uvicorn src.main:app --host 0.0.0.0 --port 8000
```
