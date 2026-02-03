# RAG Service - Quick Reference Card

## 🚀 Start Service
```bash
cd /home/sk-sazid/Desktop/Buet-CSE-FEST-FINAL/rag
./start.sh
```

## 📤 Upload PDF from URL (NEW!)
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://pub-f4b2cb5b350e44308eb23c8c7ef20596.r2.dev/materials/theory/ba14402c-1537-4ca5-81a2-80de53e6f664/NYunD8NLQSqTfAQEO6UBr.pdf"]}'
```

## 📤 Upload PDF from File
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -F "file=@/path/to/paper.pdf"
```

## 🔍 Query Papers
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?", "top_k": 5}'
```

## 📋 List All Papers
```bash
curl http://localhost:8000/api/papers
```

## 🗑️ Delete Paper
```bash
curl -X DELETE http://localhost:8000/api/papers/1
```

## 💊 Health Check
```bash
curl http://localhost:8000/health
```

## 🔧 Service Management
```bash
# View logs
docker-compose logs -f api

# Restart
docker-compose restart

# Stop
docker-compose down

# Stop + delete data
docker-compose down -v
```

## 📊 Service URLs
- **API**: http://localhost:8000
- **Health**: http://localhost:8000/health
- **Qdrant**: http://localhost:6333
- **PostgreSQL**: localhost:5433

## 📖 Documentation
- [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) - Complete Docker guide
- [TESTING.md](TESTING.md) - API testing examples
- [UPDATE_SUMMARY.md](UPDATE_SUMMARY.md) - What changed
- [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) - Full checklist
