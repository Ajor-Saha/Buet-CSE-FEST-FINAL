#!/bin/bash

# RAG Service Startup Script
# This script helps you start the RAG service using Docker

set -e

echo "=========================================="
echo "   RAG Service Docker Startup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if Ollama is running
echo "Checking Ollama availability..."
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Ollama is not running on localhost:11434${NC}"
    echo "The RAG service requires Ollama for LLM inference."
    echo "To install and start Ollama:"
    echo "  1. Visit: https://ollama.ai"
    echo "  2. Run: ollama serve"
    echo "  3. Run: ollama pull llama3"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "Starting RAG services..."
echo ""

# Start services
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check health
echo ""
echo "Checking service health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo -e "${GREEN}✓ RAG API is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Service failed to start${NC}"
        echo "Check logs with: docker-compose logs -f"
        exit 1
    fi
    sleep 2
done

echo ""
echo "=========================================="
echo -e "${GREEN}   Services Started Successfully!${NC}"
echo "=========================================="
echo ""
echo "Service URLs:"
echo "  - API:     http://localhost:8000"
echo "  - Health:  http://localhost:8000/health"
echo "  - Qdrant:  http://localhost:6333"
echo ""
echo "Useful commands:"
echo "  - View logs:        docker-compose logs -f"
echo "  - Stop services:    docker-compose down"
echo "  - Restart services: docker-compose restart"
echo ""
echo "Test the API:"
echo '  curl -X POST http://localhost:8000/api/papers/upload \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{"urls": ["https://example.com/paper.pdf"]}'"'"
echo ""
echo "For more information, see DOCKER_QUICKSTART.md"
echo ""
