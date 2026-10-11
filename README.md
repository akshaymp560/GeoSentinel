# GeoSentinel-AI 🌍🛰️
**Multimodal Geospatial Intelligence & Disaster Attribution Platform**

GeoSentinel-AI is an enterprise-grade decision support system that fuses optical satellite imagery, deep learning, and multi-source environmental telemetry to detect, quantify, and attribute Earth surface changes (e.g., landslides, floods, deforestation).

## 🚀 Architecture
- **Frontend:** React, Vite, Tailwind CSS, MapLibre GL, Framer Motion (Premium Dark UI)
- **Backend:** FastAPI, Google Earth Engine API
- **Computer Vision:** Siamese Vision Transformer (ChangeFormer) via PyTorch
- **Multi-Agent Swarm:** 8 independent asynchronous agents (Open-Meteo, NASA FIRMS, ESA WorldCover, GDELT)
- **Generative AI:** Multimodal Qwen LLM for autonomous intelligence dossier synthesis
- **Infrastructure:** Fully containerized via Docker

## ⚡ Quick Start (Docker)
Ensure Docker Desktop is running, then deploy the entire stack:
```bash
# Add your API keys to the backend/.env file
docker-compose up --build