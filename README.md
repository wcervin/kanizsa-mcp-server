# Kanizsa MCP Photo Server

**VERSION:** 11.4.0 - Comprehensive API Coverage  
**LAST UPDATED:** August 08, 2025, 13:33:08 CDT

## 🎯 **Independent MCP Server Repository**

## 🚀 New Features

### Modular Commit Workflow (v'$version')
- **01_update_version.sh**: Handles version number updates with validation
- **02_update_documentation.sh**: Updates documentation with new features and changes
- **03_commit.sh**: Stages and commits changes with proper version information
- **04_push.sh**: Pushes to remote with verification

### Enhanced Version Management
- Automatic version calculation (revision, minor, major)
- Comprehensive validation of version updates
- Cross-platform sed compatibility (macOS/Linux)
- Detailed logging and error handling

### Improved Documentation
- Automatic changelog generation
- Feature detection and documentation updates
- API endpoint tracking and updates
- Timestamp synchronization across all files


This repository contains the **Kanizsa MCP Photo Server** - a standalone Model Context Protocol (MCP) server that provides photo analysis capabilities through a standardized interface. It operates as an independent service within the Kanizsa platform ecosystem.

### **🏗️ Architecture Principles**

- **🔗 Independent Repository**: Self-contained with no direct dependencies on other repositories
- **🌐 HTTP Communication**: Communicates with agents and services via HTTP APIs
- **📦 Containerized**: Runs as a Docker container with zero host dependencies
- **🔒 Secure**: JWT authentication, rate limiting, and input validation
- **📊 Observable**: Comprehensive monitoring, metrics, and distributed tracing
- **🚀 Comprehensive API Coverage**: 100% endpoint coverage for platform and marketplace integration

## 🏗️ **Platform Integration**

This MCP Server is part of the **Kanizsa Platform** - a professional photo management ecosystem consisting of three independent repositories:

### **Related Repositories**
- **Kanizsa Photo Categorizer**: Core platform and API gateway
  - Repository: `kanizsa-photo-categorizer`
  - URL: https://github.com/wcervin/kanizsa-photo-categorizer
- **Kanizsa Adjective Agent**: Specialized photo analysis agent
  - Repository: `kanizsa-agent-adjective` 
  - URL: https://github.com/wcervin/kanizsa-agent-adjective

### **Communication Flow**
```
┌─────────────────┐    HTTP    ┌─────────────────┐    HTTP    ┌─────────────────┐
│  Kanizsa Platform│ ────────── │  MCP Server     │ ────────── │  Adjective Agent│
└─────────────────┘            └─────────────────┘            └─────────────────┘
```

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
const agentResponse = await fetch('http://available-agent:3000/analyze', {
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

## 📋 **Comprehensive API Coverage**

### **Photo Analysis Endpoints**
- `POST /api/photos/analyze`: Analyze single photo with agent selection
- `POST /api/photos/analyze/batch`: Analyze multiple photos in batch
- `GET /api/photos/metadata/{photoId}`: Get photo metadata from cache
- `POST /api/photos/scan`: Scan photo library

### **Agent Management Endpoints**
- `GET /api/agents`: List available agents
- `GET /api/agents/{agentId}`: Get agent details
- `POST /api/agents`: Register new agent
- `POST /api/agents/{agentId}/test`: Test agent connection

### **Task Management Endpoints**
- `GET /api/tasks/{taskId}`: Get task status
- `POST /api/tasks/{taskId}/cancel`: Cancel running task
- `GET /api/tasks`: List user tasks

### **Monitoring Endpoints**
- `GET /api/monitoring/metrics`: Get system metrics
- `GET /api/monitoring/performance`: Get performance statistics
- `GET /api/monitoring/errors`: Get error logs

### **Marketplace Endpoints**
- `GET /api/marketplace`: Browse marketplace for agents
- `POST /api/marketplace/install/{agentId}`: Install agent from marketplace
- `PUT /api/marketplace/update/{agentId}`: Update marketplace agent
- `DELETE /api/marketplace/uninstall/{agentId}`: Uninstall marketplace agent

### **MCP Protocol Tools**
- `analyze_photo`: MCP protocol for photo analysis
- `analyze_photo_batch`: MCP protocol for batch analysis
- `get_system_health`: Check system health and status
- `get_task_status`: Monitor background task progress

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

### **Comprehensive API Coverage**
The MCP Server provides **100% API endpoint coverage** for both Kanizsa platform integration and third-party agent marketplace management.

### **API Endpoints (Port 8003)**
- **Health & Status**: `/health`, `/status`, `/version`
- **Photo Analysis**: `/api/photos/*` (4 endpoints)
- **Agent Management**: `/api/agents/*` (4 endpoints)
- **Task Management**: `/api/tasks/*` (3 endpoints)
- **Monitoring**: `/api/monitoring/*` (3 endpoints)
- **Marketplace**: `/api/marketplace/*` (4 endpoints)

### **MCP Protocol Endpoints (Port 8002)**
- `POST /mcp/analyze_photo`: Analyze single photo
- `POST /mcp/analyze_batch`: Analyze multiple photos
- `GET /mcp/health`: System health check
- `GET /mcp/metrics`: System metrics

### **Complete Documentation**
See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for comprehensive endpoint documentation with examples, rate limits, and error codes.

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
        image: kanizsa-mcp-server:7.0.0
        ports:
        - containerPort: 8002
```

## 🔄 **Integration with Kanizsa Platform**

### **Platform Communication**
The MCP Server integrates seamlessly with the Kanizsa platform:

1. **Receives requests** from the Kanizsa Flask API
2. **Orchestrates analysis** by calling appropriate agents
3. **Returns results** to the platform for storage and user display
4. **Provides monitoring** and health information

### **Agent Discovery**
The MCP Server can discover and integrate with various analysis agents:
- **Adjective Agent**: Photo description and categorization
- **Future Agents**: Object detection, face recognition, etc.

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
**Platform Integration:** Kanizsa Photo Management Ecosystem
