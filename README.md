# Kanizsa MCP Server

**Version:** 11.5.0  
**Last Updated:** August 9, 2025  
**Purpose:** Model Context Protocol Server for Kanizsa Photo Ecosystem

## 🎯 **Overview**

The Kanizsa MCP Server is a containerized Model Context Protocol (MCP) server that orchestrates photo analysis within the Kanizsa ecosystem. It provides a standardized interface for connecting photo analysis agents to the main Kanizsa platform.

## 🏗️ **Kanizsa Ecosystem Integration**

### **Architecture**
```
┌─────────────────┐    HTTP    ┌─────────────────┐    HTTP    ┌─────────────────┐
│  Kanizsa Platform│ ────────── │  MCP Server     │ ────────── │  Analysis Agents│
│  (Photo Categorizer)│         │  (This Repo)    │            │  (Adjective, etc)│
└─────────────────┘            └─────────────────┘            └─────────────────┘
```

### **Role in Ecosystem**
- **Orchestrates** photo analysis requests from the main platform
- **Routes** requests to appropriate analysis agents
- **Provides** standardized MCP protocol interface
- **Enables** agent marketplace and discovery

## 🚀 **Quick Start**

### **Containerized Deployment**
```bash
# Build and run with Docker
docker build -t kanizsa-mcp-server .
docker run -p 8002:8002 kanizsa-mcp-server

# Or with Docker Compose
docker-compose up -d
```

### **Environment Configuration**
```bash
# Required environment variables
MCP_SERVER_PORT=8002
JWT_SECRET=your-secret-key
KANIZSA_BASE_URL=http://kanizsa-app:8000
```

## 🔌 **API Endpoints**

### **MCP Protocol (Port 8002)**
- `POST /mcp/analyze_photo` - Analyze single photo
- `POST /mcp/analyze_batch` - Analyze multiple photos
- `GET /mcp/health` - System health check
- `GET /mcp/metrics` - System metrics

### **HTTP API (Port 8002)**
- `GET /health` - Health status
- `GET /api/agents` - List available agents
- `POST /api/photos/analyze` - Photo analysis
- `GET /api/tasks/{taskId}` - Task status

## 🔧 **Development**

### **Containerized Development**
```bash
# Build development image
docker build -t kanizsa-mcp-server:dev .

# Run with hot reload
docker run -p 8002:8002 -v $(pwd)/src:/app/src kanizsa-mcp-server:dev
```

### **Testing**
```bash
# Run tests in container
docker run kanizsa-mcp-server npm test

# Integration tests
docker run kanizsa-mcp-server npm run test:integration
```

## 📊 **Monitoring**

### **Health Checks**
```bash
# Container health
docker exec kanizsa-mcp-server curl http://localhost:8002/health

# Metrics
docker exec kanizsa-mcp-server curl http://localhost:8002/metrics
```

### **Logs**
```bash
# Container logs
docker logs kanizsa-mcp-server

# Follow logs
docker logs -f kanizsa-mcp-server
```

## 🔒 **Security**

- **JWT Authentication** - Token-based API security
- **Rate Limiting** - Per-user and per-endpoint limits
- **Input Validation** - Comprehensive request validation
- **Container Isolation** - Zero host dependencies

## 📦 **Deployment**

### **Docker Compose**
```yaml
kanizsa-mcp-server:
  build: .
  ports:
    - "8002:8002"
  environment:
    - MCP_SERVER_PORT=8002
    - JWT_SECRET=your-secret-key
```

### **Kubernetes**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kanizsa-mcp-server
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: kanizsa-mcp-server
        image: kanizsa-mcp-server:11.5.0
        ports:
        - containerPort: 8002
```

## 🔄 **Ecosystem Communication**

### **Platform Integration**
- Receives analysis requests from Kanizsa Photo Categorizer
- Routes requests to appropriate analysis agents
- Returns results to platform for user display
- Provides health and monitoring data

### **Agent Discovery**
- Discovers available analysis agents via HTTP
- Supports agent marketplace integration
- Enables dynamic agent registration
- Provides agent health monitoring

## 📚 **Documentation**

- **[API Documentation](API_DOCUMENTATION.md)** - Complete endpoint reference
- **[MCP Protocol](src/mcp-protocol.md)** - Protocol specification
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

---

**Repository:** Independent MCP Server  
**Communication:** HTTP APIs only  
**Deployment:** Fully containerized  
**Dependencies:** Zero host dependencies  
**Integration:** Kanizsa Photo Management Ecosystem
