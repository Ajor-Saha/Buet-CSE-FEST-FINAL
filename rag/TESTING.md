# Testing the RAG Service

## Test with URL Upload (New Feature)

### Example PDF URL from your system:
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://pub-f4b2cb5b350e44308eb23c8c7ef20596.r2.dev/materials/theory/ba14402c-1537-4ca5-81a2-80de53e6f664/NYunD8NLQSqTfAQEO6UBr.pdf"
    ]
  }'
```

### Expected Response:
```json
{
  "processed": [
    {
      "url": "https://...",
      "filename": "NYunD8NLQSqTfAQEO6UBr.pdf",
      "paper_id": 1,
      "metadata": {
        "title": "...",
        "authors": "...",
        "year": "...",
        "pages": 10
      },
      "chunks": 45,
      "chunks_file": "temp/NYunD8NLQSqTfAQEO6UBr_chunks.json",
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

## Test with Multiple URLs:
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/paper1.pdf",
      "https://example.com/paper2.pdf"
    ]
  }'
```

## Test File Upload (Still Supported):
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -F "file=@/path/to/paper.pdf"
```

## Test Query:
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic of this paper?",
    "top_k": 5,
    "model": "llama3"
  }'
```

## Error Cases:

### Invalid URL (not PDF):
```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/document.txt"]
  }'
```

Response: `422 Unprocessable Entity` - Only PDF URLs are supported

### Duplicate file:
If you try to upload the same URL twice, you'll get:
```json
{
  "processed": [
    {
      "url": "...",
      "filename": "...",
      "status": "failed",
      "error": "Paper already exists with ID: 1"
    }
  ]
}
```

## List All Papers:
```bash
curl http://localhost:8000/api/papers
```

## Get Paper Stats:
```bash
curl http://localhost:8000/api/papers/1/stats
```

## Delete Paper:
```bash
curl -X DELETE http://localhost:8000/api/papers/1
```
