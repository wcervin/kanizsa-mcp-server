# Kanizsa MCP Photo Server

**VERSION:** 6.0.2 - Strong Typing & Code Quality  
**LAST UPDATED:** August 5, 2025, 14:25:00 CDT

## 🎯 **Independent MCP Server Repository**

This repository contains the **Kanizsa MCP Photo Server** - a standalone Model Context Protocol (MCP) server that provides photo analysis capabilities through a standardized interface.

### **🏗️ Architecture Principles**

- **🔗 Independent Repository**: Self-contained with no direct dependencies on other repositories
- **🌐 HTTP Communication**: Communicates with agents and services via HTTP APIs
- **📦 Containerized**: Runs as a Docker container with zero host dependencies
- **🔒 Secure**: JWT authentication, rate limiting, and input validation
- **📊 Observable**: Comprehensive monitoring, metrics, and distributed tracing

## 🚀 **Quick Start**

### **Prerequisites**
- Docker and Docker Compose
- Redis (for caching and rate limiting)

### **Start the MCP Server**
```bash
# Build and start
docker-compose up mcp-server

# Or build manually
docker build -t kanizsa-mcp-server .
docker run -p 8002:8002 kanizsa-mcp-server
```

### **Configuration**
```bash
# Environment variables
export MCP_SERVER_PORT=8002
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=your-secret-key
export KANIZSA_BASE_URL=http://kanizsa-app:5000
```

## 🔌 **Communication Patterns**

### **1. Agent Communication (HTTP)**
```typescript
// MCP Server communicates with agents via HTTP
const agentResponse = await fetch('http://adjective-agent:3000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ photoUrl, options })
});
```

### **2. Kanizsa Platform Communication (HTTP)**
```typescript
// MCP Server communicates with Kanizsa platform via HTTP
const platformResponse = await fetch('http://kanizsa-app:5000/api/photos/analyze', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({ photoPath, agentId, options })
});
```

### **3. Kong API Gateway Integration**
```yaml
# Kong routes MCP Server requests
- name: mcp-server
  url: http://mcp-server:8002
  routes:
    - name: mcp-routes
      paths: ["/mcp"]
      methods: ["GET", "POST"]
```

## 📋 **MCP Tools**

### **Photo Analysis Tools**
- `analyze_photo`: Analyze a single photo with specified agent
- `analyze_photo_batch`: Analyze multiple photos in batch
- `get_photo_metadata`: Retrieve photo metadata and analysis history

### **System Management Tools**
- `get_system_health`: Check system health and status
- `get_task_status`: Monitor background task progress
- `list_available_agents`: Discover available analysis agents

## 🔧 **Development**

### **Build**
```bash
npm install
npm run build
```

### **Test**
```bash
npm test
npm run test:type-safety
npm run test:integration
```

### **Development Mode**
```bash
npm run dev
```

## 📊 **Monitoring**

### **Health Check**
```bash
curl http://localhost:8002/health
```

### **Metrics**
```bash
curl http://localhost:8002/metrics
```

### **Logs**
```bash
docker logs kanizsa-mcp-server
```

## 🔒 **Security**

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Per-user, per-endpoint rate limiting
- **Input Validation**: Comprehensive Zod schema validation
- **Audit Logging**: Security event logging and monitoring

## 📚 **API Documentation**

### **MCP Protocol Endpoints**
- `POST /mcp/analyze_photo`: Analyze single photo
- `POST /mcp/analyze_batch`: Analyze multiple photos
- `GET /mcp/health`: System health check
- `GET /mcp/metrics`: System metrics

### **Internal API Endpoints**
- `GET /health`: Health check
- `GET /metrics`: Prometheus metrics
- `GET /version`: Version information

## 🏗️ **Repository Independence**

This repository is **completely independent** and:

- ✅ **No direct dependencies** on other repositories
- ✅ **HTTP-based communication** with agents and services
- ✅ **Self-contained deployment** with Docker
- ✅ **Independent versioning** and release management
- ✅ **Separate CI/CD pipeline** support
- ✅ **Independent testing** and validation

## 📦 **Deployment**

### **Docker Compose**
```yaml
mcp-server:
  build: ./mcp-server
  ports:
    - "8002:8002"
  environment:
    - MCP_SERVER_PORT=8002
    - REDIS_URL=redis://redis:6379
  depends_on:
    - redis
```

### **Kubernetes**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kanizsa-mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kanizsa-mcp-server
  template:
    metadata:
      labels:
        app: kanizsa-mcp-server
    spec:
      containers:
      - name: mcp-server
        image: kanizsa-mcp-server:6.0.2
        ports:
        - containerPort: 8002
```

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
**Deployment:** Containerized  
**Dependencies:** None on other repositories