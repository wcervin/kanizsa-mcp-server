# Kanizsa MCP Server API Documentation

**Version:** 12.0.0  
**Last Updated:** August 9, 2025  
**Gateway:** Kong API Gateway v3.4

## Overview

## Version '$version' - '$timestamp'

### New Features
- Enhanced modular commit workflow with separate scripts
- Improved version management with validation
- Better error handling and verification

### API Changes
- Updated version headers across all endpoints
- Enhanced error responses with version information

### Documentation Updates
- Comprehensive version and timestamp updates
- Improved API documentation structure
- Enhanced changelog tracking

### Technical Improvements
- Modular script architecture (01_update_version.sh, 02_update_documentation.sh, 03_commit.sh, 04_push.sh)
- Better sed pattern compatibility for macOS
- Enhanced verification and error handling


The Kanizsa MCP Server provides a comprehensive API for photo analysis, agent management, and task processing within the Kanizsa ecosystem.

## Authentication

## Version '$version' - '$timestamp'

### New Features
- Enhanced modular commit workflow with separate scripts
- Improved version management with validation
- Better error handling and verification

### API Changes
- Updated version headers across all endpoints
- Enhanced error responses with version information

### Documentation Updates
- Comprehensive version and timestamp updates
- Improved API documentation structure
- Enhanced changelog tracking

### Technical Improvements
- Modular script architecture (01_update_version.sh, 02_update_documentation.sh, 03_commit.sh, 04_push.sh)
- Better sed pattern compatibility for macOS
- Enhanced verification and error handling


All API requests require authentication via JWT tokens in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

## Version '$version' - '$timestamp'

### New Features
- Enhanced modular commit workflow with separate scripts
- Improved version management with validation
- Better error handling and verification

### API Changes
- Updated version headers across all endpoints
- Enhanced error responses with version information

### Documentation Updates
- Comprehensive version and timestamp updates
- Improved API documentation structure
- Enhanced changelog tracking

### Technical Improvements
- Modular script architecture (01_update_version.sh, 02_update_documentation.sh, 03_commit.sh, 04_push.sh)
- Better sed pattern compatibility for macOS
- Enhanced verification and error handling


```
http://localhost:8002
```

## Endpoints

## Version '$version' - '$timestamp'

### New Features
- Enhanced modular commit workflow with separate scripts
- Improved version management with validation
- Better error handling and verification

### API Changes
- Updated version headers across all endpoints
- Enhanced error responses with version information

### Documentation Updates
- Comprehensive version and timestamp updates
- Improved API documentation structure
- Enhanced changelog tracking

### Technical Improvements
- Modular script architecture (01_update_version.sh, 02_update_documentation.sh, 03_commit.sh, 04_push.sh)
- Better sed pattern compatibility for macOS
- Enhanced verification and error handling


### Health & Status

#### GET /health
Returns the health status of the MCP server.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-09T12:00:00Z",
  "service": "kanizsa-mcp-server"
}
```

#### GET /status
Returns detailed status information.

#### GET /version
Returns the current version information.

### Photo Analysis

#### POST /api/photos/analyze
Analyze a single photo using available agents.

**Request Body:**
```json
{
  "photoId": "photo123",
  "photoUrl": "https://example.com/photo.jpg",
  "agents": ["adjective-agent", "sentiment-agent"]
}
```

#### POST /api/photos/analyze/batch
Analyze multiple photos in batch.

#### GET /api/photos/metadata/:photoId
Get metadata for a specific photo.

#### POST /api/photos/scan
Scan photos for specific content or patterns.

### Agent Management

#### GET /api/agents
List all available agents.

#### GET /api/agents/:agentId
Get details for a specific agent.

#### POST /api/agents
Register a new agent.

#### POST /api/agents/:agentId/test
Test a specific agent.

### Task Management

#### GET /api/tasks/:taskId
Get task status and results.

#### POST /api/tasks/:taskId/cancel
Cancel a running task.

#### GET /api/tasks
List all tasks.

### Monitoring

#### GET /api/monitoring/metrics
Get performance metrics.

#### GET /api/monitoring/performance
Get performance data.

#### GET /api/monitoring/errors
Get error logs.

### Marketplace Integration

#### GET /api/marketplace
Get available agents from marketplace.

#### POST /api/marketplace/install/:agentId
Install an agent from marketplace.

#### PUT /api/marketplace/update/:agentId
Update an installed agent.

#### DELETE /api/marketplace/uninstall/:agentId
Uninstall an agent.

## Error Responses

## Version '$version' - '$timestamp'

### New Features
- Enhanced modular commit workflow with separate scripts
- Improved version management with validation
- Better error handling and verification

### API Changes
- Updated version headers across all endpoints
- Enhanced error responses with version information

### Documentation Updates
- Comprehensive version and timestamp updates
- Improved API documentation structure
- Enhanced changelog tracking

### Technical Improvements
- Modular script architecture (01_update_version.sh, 02_update_documentation.sh, 03_commit.sh, 04_push.sh)
- Better sed pattern compatibility for macOS
- Enhanced verification and error handling


All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-09T12:00:00Z"
}
```

## Rate Limiting

## Version '$version' - '$timestamp'

### New Features
- Enhanced modular commit workflow with separate scripts
- Improved version management with validation
- Better error handling and verification

### API Changes
- Updated version headers across all endpoints
- Enhanced error responses with version information

### Documentation Updates
- Comprehensive version and timestamp updates
- Improved API documentation structure
- Enhanced changelog tracking

### Technical Improvements
- Modular script architecture (01_update_version.sh, 02_update_documentation.sh, 03_commit.sh, 04_push.sh)
- Better sed pattern compatibility for macOS
- Enhanced verification and error handling


API requests are rate-limited to prevent abuse. Limits are enforced by the Kong API Gateway.

## Versioning

## Version '$version' - '$timestamp'

### New Features
- Enhanced modular commit workflow with separate scripts
- Improved version management with validation
- Better error handling and verification

### API Changes
- Updated version headers across all endpoints
- Enhanced error responses with version information

### Documentation Updates
- Comprehensive version and timestamp updates
- Improved API documentation structure
- Enhanced changelog tracking

### Technical Improvements
- Modular script architecture (01_update_version.sh, 02_update_documentation.sh, 03_commit.sh, 04_push.sh)
- Better sed pattern compatibility for macOS
- Enhanced verification and error handling


API versioning is handled through the X-Kanizsa-Version header.

---

**Footer:** Kanizsa MCP Server API v12.1.0 | Last Updated: August 09, 2025, 17:06:21 CDT
