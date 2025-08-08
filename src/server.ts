#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
// HTTP communication with Adjective Agent via Kong API Gateway
import {
  PhotoSchema,
  AnalysisOptionsSchema,
  PhotoAnalysisRequestSchema,
  BatchPhotoAnalysisRequestSchema,
  validatePhotoAnalysisRequest,
  validateBatchPhotoAnalysisRequest,
  type Photo,
  type AnalysisOptions,
  type AdjectiveResult
} from './shared-types.js';
import { SharedHttpClient } from './shared-http-client.js';
import { MCPApiEndpoints } from './api-endpoints.js';

// Use shared HTTP client for Kanizsa API communication
const kanizsaClient = new SharedHttpClient({
  baseUrl: process.env.KANIZSA_BASE_URL || 'http://kanizsa-app:8000',
  apiKey: process.env.KANIZSA_API_KEY
});

export class MCPPhotoServer {
  private server: Server;
  private apiEndpoints: MCPApiEndpoints;
  // Removed direct agent dependency - using HTTP communication
  // private agent: AdjectiveAgent;

  constructor() {
    // Removed direct agent instantiation - using HTTP communication
    // this.agent = new AdjectiveAgent();
    
    this.server = new Server(
      {
        name: 'kanizsa-mcp-photo-server',
        version: '10.0.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize comprehensive API endpoints
    this.apiEndpoints = new MCPApiEndpoints();

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_photo',
          description: 'Analyze a photo using Kanizsa platform with adjective generation',
          inputSchema: {
            type: 'object',
            properties: {
              photo: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  url: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'url']
              },
              options: {
                type: 'object',
                properties: {
                  maxAdjectives: { type: 'number' },
                  includeCategories: { type: 'boolean' },
                  enhanceDescription: { type: 'boolean' }
                }
              }
            },
            required: ['photo']
          },
        },
        {
          name: 'analyze_photo_batch',
          description: 'Analyze multiple photos in batch using Kanizsa platform',
          inputSchema: {
            type: 'object',
            properties: {
              photos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    url: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['id', 'url']
                }
              },
              options: {
                type: 'object',
                properties: {
                  maxAdjectives: { type: 'number' },
                  includeCategories: { type: 'boolean' },
                  enhanceDescription: { type: 'boolean' }
                }
              }
            },
            required: ['photos']
          },
        },
        {
          name: 'get_system_health',
          description: 'Get Kanizsa platform system health and status',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_task_status',
          description: 'Get status of a background task in Kanizsa platform',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'Task ID to check' }
            },
            required: ['taskId']
          },
        }
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'analyze_photo': {
          const validatedArgs = validatePhotoAnalysisRequest(args);
          
          try {
            // Try to use Kanizsa platform first
            const kanizsaResult = await kanizsaClient.analyzePhoto(
              validatedArgs.photo.url,
              'auto', // Let platform choose best agent
              validatedArgs.options
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(kanizsaResult, null, 2),
                },
              ],
            };
          } catch (error) {
            // Fallback to available agents via service discovery
            console.log('Kanizsa platform unavailable, using available agents via HTTP');
            const agentResponse = await fetch('http://available-agent:3000/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                photoUrl: validatedArgs.photo.url,
                options: validatedArgs.options
              })
            });
            
            if (!agentResponse.ok) {
              throw new Error(`Agent error: ${agentResponse.statusText}`);
            }
            
            const result = await agentResponse.json();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
        }

        case 'analyze_photo_batch': {
          const validatedArgs = validateBatchPhotoAnalysisRequest(args);
          
          try {
            // Use HTTP call to available agents for batch processing
            const agentResponse = await fetch('http://available-agent:3000/analyze/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                photos: validatedArgs.photos,
                options: validatedArgs.options
              })
            });
            
            if (!agentResponse.ok) {
              throw new Error(`Agent error: ${agentResponse.statusText}`);
            }
            
            const results = await agentResponse.json();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new Error(`Batch analysis failed: ${error}`);
          }
        }

        case 'get_system_health': {
          try {
            const health = await kanizsaClient.getSystemHealth();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(health, null, 2),
                },
              ],
            };
          } catch (error) {
            // Return basic health info if Kanizsa is unavailable
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'degraded',
                    mcp_server: 'healthy',
                    kanizsa_platform: 'unavailable',
                    timestamp: new Date().toISOString()
                  }, null, 2),
                },
              ],
            };
          }
        }

        case 'get_task_status': {
          const taskId = args?.taskId;
          if (!taskId) {
            throw new Error('Task ID is required');
          }
          
          try {
            const status = await kanizsaClient.getTaskStatus(taskId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(status, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new Error(`Failed to get task status: ${error}`);
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async run() {
    // Start the comprehensive API endpoints server
    const apiPort = parseInt(process.env.MCP_API_PORT || '8003');
    await this.apiEndpoints.start(apiPort);
    console.error(`Kanizsa MCP API Server running on port ${apiPort}`);

    // Use stdio transport for now (HTTP transport needs different configuration)
    const transport = new StdioServerTransport();
    
    await this.server.connect(transport);
    console.error(`Kanizsa MCP Photo Server running via stdio`);
    console.error(`Comprehensive API coverage: ${apiPort} endpoints + stdio MCP protocol`);
  }
}