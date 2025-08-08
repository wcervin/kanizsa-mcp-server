/**
 * Kanizsa MCP Server - Comprehensive API Endpoints
 * 
 * This module provides comprehensive API endpoints for the MCP server
 * to communicate with both the Kanizsa platform and third-party agents
 * from the marketplace.
 * 
 * VERSION: 11.0.0 - Comprehensive API Coverage
 * LAST UPDATED: August 08, 2025, 12:10:43 CDT
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { SharedHttpClient } from './shared-http-client.js';
import { SharedCache } from './shared-cache.js';
import {
  PhotoAnalysisRequest,
  BatchPhotoAnalysisRequest,
  SystemHealthResponse,
  TaskStatusResponse,
  ErrorResponse,
  ApiResponse,
  validatePhotoAnalysisRequest,
  validateBatchPhotoAnalysisRequest,
  PhotoSchema,
  AnalysisOptionsSchema
} from './shared-types.js';
import { MonitoringManager } from './shared-monitoring.js';
import { SecurityManager } from './shared-security.js';

// =============================================================================
// API ENDPOINTS CLASS
// =============================================================================

export class MCPApiEndpoints {
  private app: express.Application;
  private kanizsaClient: SharedHttpClient;
  private monitoring: MonitoringManager;
  private security: SecurityManager;
  private marketplaceAgents: Map<string, string> = new Map();

  constructor() {
    this.app = express();
    this.kanizsaClient = new SharedHttpClient({
      baseUrl: process.env.KANIZSA_BASE_URL || 'http://kanizsa-app:8000',
      apiKey: process.env.KANIZSA_API_KEY
    });
    
    // Create cache instance for monitoring and security
    const cache = new SharedCache();
    this.monitoring = new MonitoringManager(cache);
    this.security = new SecurityManager(cache);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeMarketplaceAgents();
  }

  /**
   * Setup middleware for security and monitoring
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
      }
    });
    this.app.use(limiter);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.monitoring.logRequest({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      next();
    });
  }

  /**
   * Initialize marketplace agents
   */
  private initializeMarketplaceAgents(): void {
    // Register known agents
    this.marketplaceAgents.set('adjective-agent', 'http://adjective-agent:3000');
    this.marketplaceAgents.set('object-detection-agent', 'http://object-detection-agent:3000');
    this.marketplaceAgents.set('face-recognition-agent', 'http://face-recognition-agent:3000');
    this.marketplaceAgents.set('scene-analysis-agent', 'http://scene-analysis-agent:3000');
    this.marketplaceAgents.set('color-analysis-agent', 'http://color-analysis-agent:3000');
    
    // Load from environment variables
    const agentUrls = process.env.MARKETPLACE_AGENTS;
    if (agentUrls) {
      try {
        const agents = JSON.parse(agentUrls);
        Object.entries(agents).forEach(([name, url]) => {
          this.marketplaceAgents.set(name, url as string);
        });
      } catch (error) {
        console.error('Failed to parse marketplace agents:', error);
      }
    }
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health and status endpoints
    this.setupHealthRoutes();
    
    // Photo analysis endpoints
    this.setupPhotoAnalysisRoutes();
    
    // Agent management endpoints
    this.setupAgentManagementRoutes();
    
    // Task management endpoints
    this.setupTaskManagementRoutes();
    
    // System monitoring endpoints
    this.setupMonitoringRoutes();
    
    // Marketplace endpoints
    this.setupMarketplaceRoutes();
    
    // Error handling
    this.setupErrorHandling();
  }

  /**
   * Setup health and status routes
   */
  private setupHealthRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getSystemHealth();
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '11.0.0',
          services: health.services,
          mcp_server: {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage()
          }
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        const status = await this.getDetailedStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get status',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Version endpoint
    this.app.get('/version', (req, res) => {
      res.json({
        version: '11.0.0',
        name: 'kanizsa-mcp-photo-server',
        description: 'Kanizsa MCP Photo Server with comprehensive API coverage',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup photo analysis routes
   */
  private setupPhotoAnalysisRoutes(): void {
    // Analyze single photo
    this.app.post('/api/photos/analyze', async (req, res) => {
      try {
        const validatedRequest = validatePhotoAnalysisRequest(req.body);
        const result = await this.analyzePhoto(validatedRequest);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Analyze multiple photos
    this.app.post('/api/photos/analyze/batch', async (req, res) => {
      try {
        const validatedRequest = validateBatchPhotoAnalysisRequest(req.body);
        const result = await this.analyzePhotoBatch(validatedRequest);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Get photo metadata
    this.app.get('/api/photos/metadata/:photoId', async (req, res) => {
      try {
        const { photoId } = req.params;
        const metadata = await this.getPhotoMetadata(photoId);
        res.json(metadata);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Scan photo library
    this.app.post('/api/photos/scan', async (req, res) => {
      try {
        const { libraryPath, options } = req.body;
        const result = await this.scanPhotoLibrary(libraryPath, options);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });
  }

  /**
   * Setup agent management routes
   */
  private setupAgentManagementRoutes(): void {
    // List available agents
    this.app.get('/api/agents', async (req, res) => {
      try {
        const agents = await this.listAvailableAgents();
        res.json(agents);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Get agent details
    this.app.get('/api/agents/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const agent = await this.getAgentDetails(agentId);
        res.json(agent);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Register new agent
    this.app.post('/api/agents', async (req, res) => {
      try {
        const { name, url, capabilities } = req.body;
        const result = await this.registerAgent(name, url, capabilities);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Test agent connection
    this.app.post('/api/agents/:agentId/test', async (req, res) => {
      try {
        const { agentId } = req.params;
        const result = await this.testAgentConnection(agentId);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });
  }

  /**
   * Setup task management routes
   */
  private setupTaskManagementRoutes(): void {
    // Get task status
    this.app.get('/api/tasks/:taskId', async (req, res) => {
      try {
        const { taskId } = req.params;
        const status = await this.getTaskStatus(taskId);
        res.json(status);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Cancel task
    this.app.post('/api/tasks/:taskId/cancel', async (req, res) => {
      try {
        const { taskId } = req.params;
        const result = await this.cancelTask(taskId);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // List user tasks
    this.app.get('/api/tasks', async (req, res) => {
      try {
        const { userId, status, limit } = req.query;
        const tasks = await this.listUserTasks(
          userId as string,
          status as string,
          parseInt(limit as string) || 50
        );
        res.json(tasks);
      } catch (error) {
        this.handleError(res, error);
      }
    });
  }

  /**
   * Setup monitoring routes
   */
  private setupMonitoringRoutes(): void {
    // Get system metrics
    this.app.get('/api/monitoring/metrics', async (req, res) => {
      try {
        const metrics = await this.getSystemMetrics();
        res.json(metrics);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Get performance stats
    this.app.get('/api/monitoring/performance', async (req, res) => {
      try {
        const performance = await this.getPerformanceStats();
        res.json(performance);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Get error logs
    this.app.get('/api/monitoring/errors', async (req, res) => {
      try {
        const { limit, severity } = req.query;
        const errors = await this.getErrorLogs(
          parseInt(limit as string) || 100,
          severity as string
        );
        res.json(errors);
      } catch (error) {
        this.handleError(res, error);
      }
    });
  }

  /**
   * Setup marketplace routes
   */
  private setupMarketplaceRoutes(): void {
    // Browse marketplace
    this.app.get('/api/marketplace', async (req, res) => {
      try {
        const { category, search, sort } = req.query;
        const agents = await this.browseMarketplace(
          category as string,
          search as string,
          sort as string
        );
        res.json(agents);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Install agent from marketplace
    this.app.post('/api/marketplace/install/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const { version, configuration } = req.body;
        const result = await this.installMarketplaceAgent(agentId, version, configuration);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Update marketplace agent
    this.app.put('/api/marketplace/update/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const { version } = req.body;
        const result = await this.updateMarketplaceAgent(agentId, version);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    // Uninstall marketplace agent
    this.app.delete('/api/marketplace/uninstall/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const result = await this.uninstallMarketplaceAgent(agentId);
        res.json(result);
      } catch (error) {
        this.handleError(res, error);
      }
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  // =============================================================================
  // CORE API METHODS
  // =============================================================================

  /**
   * Analyze a single photo
   */
  async analyzePhoto(request: PhotoAnalysisRequest): Promise<ApiResponse<any>> {
    try {
      // Try Kanizsa platform first
      const kanizsaResult = await this.kanizsaClient.analyzePhoto(
        request.photo.url,
        'auto',
        request.options
      );

      if (kanizsaResult.success) {
        return {
          success: true,
          data: kanizsaResult.data,
          timestamp: new Date().toISOString(),
          source: 'kanizsa-platform'
        };
      }

      // Fallback to marketplace agents
      const agentResult = await this.analyzeWithMarketplaceAgent(request);
      return {
        success: true,
        data: agentResult,
        timestamp: new Date().toISOString(),
        source: 'marketplace-agent'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze multiple photos in batch
   */
  async analyzePhotoBatch(request: BatchPhotoAnalysisRequest): Promise<ApiResponse<any[]>> {
    try {
      const results = [];
      
      for (const photo of request.photos) {
        const result = await this.analyzePhoto({ photo, options: request.options });
        results.push(result);
      }

      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch analysis failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get photo metadata
   */
  async getPhotoMetadata(photoId: string): Promise<ApiResponse<any>> {
    try {
      // Try to get from Kanizsa platform cache
      const metadata = await this.kanizsaClient.makeRequest(`/api/photos/metadata/${photoId}`);
      
      return {
        success: true,
        data: metadata,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metadata',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scan photo library
   */
  async scanPhotoLibrary(libraryPath?: string, options?: any): Promise<ApiResponse<any>> {
    try {
      const result = await this.kanizsaClient.scanLibrary(libraryPath);
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Library scan failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * List available agents
   */
  async listAvailableAgents(): Promise<ApiResponse<any[]>> {
    try {
      const agents = [];
      
      // Add marketplace agents
      for (const [name, url] of this.marketplaceAgents) {
        try {
          const response = await fetch(`${url}/health`);
          if (response.ok) {
            const health = await response.json();
            agents.push({
              id: name,
              name: name.replace('-agent', ' Agent'),
              url,
              status: health.status || 'unknown',
              capabilities: health.capabilities || []
            });
          }
        } catch (error) {
          // Agent is unavailable
          agents.push({
            id: name,
            name: name.replace('-agent', ' Agent'),
            url,
            status: 'unavailable',
            error: error instanceof Error ? error.message : 'Connection failed'
          });
        }
      }

      return {
        success: true,
        data: agents,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list agents',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get agent details
   */
  async getAgentDetails(agentId: string): Promise<ApiResponse<any>> {
    try {
      const agentUrl = this.marketplaceAgents.get(agentId);
      if (!agentUrl) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const response = await fetch(`${agentUrl}/info`);
      if (!response.ok) {
        throw new Error(`Failed to get agent info: ${response.statusText}`);
      }

      const agentInfo = await response.json();
      
      return {
        success: true,
        data: {
          id: agentId,
          url: agentUrl,
          ...agentInfo
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get agent details',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Register new agent
   */
  async registerAgent(name: string, url: string, capabilities: string[]): Promise<ApiResponse<any>> {
    try {
      // Validate agent connection
      const response = await fetch(`${url}/health`);
      if (!response.ok) {
        throw new Error('Agent health check failed');
      }

      // Register agent
      this.marketplaceAgents.set(name, url);
      
      return {
        success: true,
        data: {
          id: name,
          name,
          url,
          capabilities,
          status: 'registered'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register agent',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test agent connection
   */
  async testAgentConnection(agentId: string): Promise<ApiResponse<any>> {
    try {
      const agentUrl = this.marketplaceAgents.get(agentId);
      if (!agentUrl) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const start = Date.now();
      const response = await fetch(`${agentUrl}/health`);
      const duration = Date.now() - start;

      return {
        success: response.ok,
        data: {
          agentId,
          url: agentUrl,
          status: response.ok ? 'connected' : 'failed',
          responseTime: duration,
          statusCode: response.status
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      return await this.kanizsaClient.getTaskStatus(taskId);
    } catch (error) {
      throw new Error(`Failed to get task status: ${error}`);
    }
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<ApiResponse<any>> {
    try {
      const result = await this.kanizsaClient.makeRequest(`/api/tasks/${taskId}/cancel`, {
        method: 'POST'
      });
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel task',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * List user tasks
   */
  async listUserTasks(userId?: string, status?: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (status) params.append('status', status);
      params.append('limit', limit.toString());

      const result = await this.kanizsaClient.makeRequest(`/api/tasks?${params}`);
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tasks',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    try {
      return await this.kanizsaClient.getSystemHealth();
    } catch (error) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          kanizsa_platform: {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          mcp_server: {
            status: 'up'
          }
        },
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        }
      };
    }
  }

  /**
   * Get detailed status
   */
  async getDetailedStatus(): Promise<any> {
    try {
      const health = await this.getSystemHealth();
      const metrics = await this.getSystemMetrics();
      const agents = await this.listAvailableAgents();

      return {
        timestamp: new Date().toISOString(),
        version: '11.0.0',
        health,
        metrics,
        agents: agents.data || [],
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };

    } catch (error) {
      throw new Error(`Failed to get detailed status: ${error}`);
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<any> {
    try {
      return await this.kanizsaClient.getSystemMetrics();
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to get metrics from Kanizsa platform',
        mcp_server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };
    }
  }

  /**
   * Get performance stats
   */
  async getPerformanceStats(): Promise<any> {
    try {
      return this.monitoring.getPerformanceStats();
    } catch (error) {
      throw new Error(`Failed to get performance stats: ${error}`);
    }
  }

  /**
   * Get error logs
   */
  async getErrorLogs(limit: number = 100, severity?: string): Promise<any[]> {
    try {
      return this.monitoring.getErrorLogs(limit, severity);
    } catch (error) {
      throw new Error(`Failed to get error logs: ${error}`);
    }
  }

  /**
   * Browse marketplace
   */
  async browseMarketplace(category?: string, search?: string, sort?: string): Promise<ApiResponse<any[]>> {
    try {
      // This would integrate with a marketplace API
      // For now, return available agents
      const agents = await this.listAvailableAgents();
      
      let filteredAgents = agents.data || [];

      if (category) {
        filteredAgents = filteredAgents.filter(agent => 
          agent.capabilities?.includes(category)
        );
      }

      if (search) {
        filteredAgents = filteredAgents.filter(agent =>
          agent.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (sort) {
        filteredAgents.sort((a, b) => {
          switch (sort) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'status':
              return a.status.localeCompare(b.status);
            default:
              return 0;
          }
        });
      }

      return {
        success: true,
        data: filteredAgents,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to browse marketplace',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Install marketplace agent
   */
  async installMarketplaceAgent(agentId: string, version?: string, configuration?: any): Promise<ApiResponse<any>> {
    try {
      // This would integrate with a marketplace API
      // For now, simulate installation
      const agentUrl = `http://${agentId}:3000`;
      this.marketplaceAgents.set(agentId, agentUrl);

      return {
        success: true,
        data: {
          agentId,
          version: version || 'latest',
          status: 'installed',
          url: agentUrl
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to install agent',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Update marketplace agent
   */
  async updateMarketplaceAgent(agentId: string, version: string): Promise<ApiResponse<any>> {
    try {
      // This would integrate with a marketplace API
      // For now, simulate update
      return {
        success: true,
        data: {
          agentId,
          version,
          status: 'updated'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update agent',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Uninstall marketplace agent
   */
  async uninstallMarketplaceAgent(agentId: string): Promise<ApiResponse<any>> {
    try {
      // Remove agent from registry
      this.marketplaceAgents.delete(agentId);

      return {
        success: true,
        data: {
          agentId,
          status: 'uninstalled'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to uninstall agent',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze with marketplace agent
   */
  private async analyzeWithMarketplaceAgent(request: PhotoAnalysisRequest): Promise<any> {
    // Find best available agent
    const availableAgents = Array.from(this.marketplaceAgents.entries());
    
    for (const [agentId, url] of availableAgents) {
      try {
        const response = await fetch(`${url}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoUrl: request.photo.url,
            options: request.options
          })
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error(`Agent ${agentId} failed:`, error);
        continue;
      }
    }

    throw new Error('No available agents for analysis');
  }

  /**
   * Handle API errors
   */
  private handleError(res: express.Response, error: any): void {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    
    res.status(statusCode).json({
      error: message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID')
    });
  }

  /**
   * Get Express app
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Start the API server
   */
  async start(port: number = 8002): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`MCP API Server running on port ${port}`);
        resolve();
      });
    });
  }
}


