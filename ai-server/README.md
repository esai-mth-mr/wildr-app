# ai-server

## Getting Started

### Install Dependencies

```bash
poetry install
```

### Run Server

```bash
poetry run uvicorn app.main:app --reload
```

## Deployment

### Build Docker Image

```bash
docker build -t ai-server .
```

### Run Docker Container

```bash
docker run -d -p 8000:8000 --name ai-server ai-server
```

### Push Docker Image to AWS ECR

```bash
bash ai-server-build-push-image.sh
```
