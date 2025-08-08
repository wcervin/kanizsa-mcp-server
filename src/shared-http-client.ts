/**
 * Shared HTTP Client for Kanizsa MCP Architecture
 * 
 * This file contains a shared HTTP client implementation that can be used
 * across the MCP server and agents to ensure consistent API communication.
 * 
 * VERSION: 11.2.4 - Strong Typing & Code Quality
 * LAST UPDATED: August 08, 2025, 13:30:43 CDT
 */

import fetch from 'node-fetch';
import type {
  PhotoAnalysisRequest,
  BatchPhotoAnalysisRequest,
  SystemHealthResponse,
  TaskStatusResponse,
  ErrorResponse,
  ApiResponse
} from './shared-types.js';

// =============================================================================
// HTTP CLIENT CONFIGURATION
// =============================================================================

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  userAgent?: string;
}

/**
 * Default HTTP client configuration
 */
export const DEFAULT_HTTP_CONFIG: HttpClientConfig = {
  baseUrl: 'http://kanizsa-app:8000',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  userAgent: 'Kanizsa-MCP-Client/11.2.4'
};

// =============================================================================
// HTTP CLIENT CLASS
// =============================================================================

/**
 * Shared HTTP client for Kanizsa API communication
 */
export class SharedHttpClient {
  private config: HttpClientConfig;
  private requestId: number = 0;

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...DEFAULT_HTTP_CONFIG, ...config };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  /**
   * Create headers for API requests
   */
  private createHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.config.userAgent!,
      'X-Request-ID': this.generateRequestId()
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders);
    }

    return headers;
  }

  /**
   * Make an HTTP request with retry logic
   */
  private async makeRequest<T>(
    url: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.config.timeout
    } = options;

    const requestUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    const requestHeaders = this.createHeaders(headers);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(requestUrl, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json() as T;
        } else {
          return await response.text() as T;
        }

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < this.config.retries!) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay!));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Parse error response from API
   */
  private async parseErrorResponse(response: any): Promise<ErrorResponse> {
    try {
      const errorText = await response.text();
      const errorData = JSON.parse(errorText);
      return {
        error: errorData.error || 'Unknown error',
        code: errorData.code || 'UNKNOWN',
        details: errorData.details,
        timestamp: new Date().toISOString(),
        requestId: errorData.requestId
      };
    } catch {
      return {
        error: response.statusText || 'Unknown error',
        code: `HTTP_${response.status}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =============================================================================
  // API METHODS
  // =============================================================================

  /**
   * Analyze a single photo
   */
  async analyzePhoto(
    photoPath: string,
    agentId: string,
    options?: any
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>('/api/photos/analyze', {
      method: 'POST',
      body: {
        photo_path: photoPath,
        agent_id: agentId,
        options: options
      }
    });
  }

  /**
   * Analyze multiple photos in batch
   */
  async analyzePhotoBatch(
    photoPaths: string[],
    agentId: string,
    options?: any
  ): Promise<ApiResponse<any[]>> {
    return this.makeRequest<ApiResponse<any[]>>('/api/photos/analyze/batch', {
      method: 'POST',
      body: {
        photo_paths: photoPaths,
        agent_id: agentId,
        options: options
      }
    });
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    return this.makeRequest<TaskStatusResponse>(`/api/tasks/${taskId}`);
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    return this.makeRequest<SystemHealthResponse>('/api/monitoring/system');
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<any> {
    return this.makeRequest<any>('/api/monitoring/metrics');
  }

  /**
   * Get user billing information
   */
  async getBillingInfo(): Promise<any> {
    return this.makeRequest<any>('/api/billing/billing-info');
  }

  /**
   * Get usage summary
   */
  async getUsageSummary(): Promise<any> {
    return this.makeRequest<any>('/api/billing/usage');
  }

  /**
   * Create a backup
   */
  async createBackup(backupName?: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>('/api/backup/create', {
      method: 'POST',
      body: {
        backup_name: backupName
      }
    });
  }

  /**
   * Scan photo library
   */
  async scanLibrary(libraryPath?: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>('/api/photos/scan', {
      method: 'POST',
      body: {
        library_path: libraryPath
      }
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if the API is reachable
   */
  async ping(): Promise<boolean> {
    try {
      await this.makeRequest('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API version information
   */
  async getVersion(): Promise<any> {
    return this.makeRequest<any>('/version');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): HttpClientConfig {
    return { ...this.config };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a shared HTTP client instance
 */
export function createHttpClient(config?: Partial<HttpClientConfig>): SharedHttpClient {
  return new SharedHttpClient(config);
}


