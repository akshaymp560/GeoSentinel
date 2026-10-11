# /backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for geospatial libraries and PyTorch
RUN apt-get update && apt-get install -y gcc g++ libgdal-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir geemap earthengine-api

# Copy backend source code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]