# Docker Setup Instructions

## Prerequisites
- Docker and Docker Compose installed
- API keys (Gemini and/or OpenAI)

## Setup Steps

1. **Add API Keys**
   
   Edit the `.env` file in the root directory and add your API keys:
   ```bash
   GEMINI_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   ```

2. **Start Everything**
   
   Run this single command:
   ```bash
   docker-compose up --build
   ```
   
   Or to run in the background:
   ```bash
   docker-compose up --build -d
   ```

3. **Run the Checker**
   
   In a new terminal:
   ```bash
   python3 checker/checker.py --url http://localhost:8000
   ```

## Available Services

- **Backend API**: http://localhost:8000
- **Database**: localhost:5434 (PostgreSQL)
- **Database UI**: http://localhost:8082 (pgweb)

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Check service status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

## Troubleshooting

If services fail to start:
1. Check logs: `docker-compose logs`
2. Ensure ports 8000, 5434, and 8082 are not in use
3. Rebuild: `docker-compose down && docker-compose up --build`
