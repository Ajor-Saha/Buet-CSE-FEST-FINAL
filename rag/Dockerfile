# Base image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Workdir
WORKDIR /app

# Python deps first (cache-friendly)
COPY requirements.txt /app/requirements.txt
ENV PIP_NO_CACHE_DIR=1
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# App code
COPY src /app/src
COPY README.md /app/README.md

# Create directories and set permissions
RUN mkdir -p /app/temp /cache /home/appuser && \
    chmod 777 /app/temp /cache

# Default envs can be overridden by compose
ENV PYTHONUNBUFFERED=1 \
    UVICORN_RELOAD=true \
    HF_HOME=/cache \
    TRANSFORMERS_CACHE=/cache/transformers

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command (overridden in compose)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
