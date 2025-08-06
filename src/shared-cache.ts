/**
 * Shared Caching Layer for Kanizsa MCP Architecture
 * 
 * This module provides a unified caching interface that integrates with Redis
 * for performance optimization across all services.
 * 
 * VERSION: 6.0.2 - Strong Typing & Code Quality
 * LAST UPDATED: August 5, 2025, 14:25:00 CDT
 */

import { createClient, RedisClientType } from 'redis';
import type { Photo, AdjectiveResult, AnalysisOptions } from './shared-types.js';

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

/**
 * Cache configuration options
 */
export interface CacheConfig {
  redisUrl: string;
  defaultTTL: number;
  maxRetries: number;
  retryDelay: number;
  enableCompression: boolean;
  enableMetrics: boolean;
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
      redisUrl: process.env.REDIS_URL || process.env.KANIZSA_REDIS_URL || 'redis://:default_redis_password_change_in_production@redis:6379/0',
  defaultTTL: 3600, // 1 hour
  maxRetries: 3,
  retryDelay: 1000,
  enableCompression: true,
  enableMetrics: true
};

/**
 * Cache key patterns for different data types
 */
export const CACHE_KEYS = {
  PHOTO_ANALYSIS: 'photo:analysis:{photoId}',
  PHOTO_METADATA: 'photo:metadata:{photoId}',
  AGENT_RESULT: 'agent:result:{agentId}:{photoId}',
  SYSTEM_HEALTH: 'system:health',
  TASK_STATUS: 'task:status:{taskId}',
  USER_SESSION: 'user:session:{userId}',
  API_RATE_LIMIT: 'rate:limit:{userId}:{endpoint}',
  SYSTEM_METRICS: 'system:metrics:{metricType}'
} as const;

// =============================================================================
// SHARED CACHE CLASS
// =============================================================================

/**
 * Shared caching layer with Redis integration
 */
export class SharedCache {
  private client: RedisClientType;
  private config: CacheConfig;
  private isConnected: boolean = false;
  private metrics: Map<string, number> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.client = createClient({
      url: this.config.redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > this.config.maxRetries) {
            return new Error('Max retries exceeded');
          }
          return this.config.retryDelay;
        }
      }
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('✅ Redis cache connected');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis cache error:', error);
      this.isConnected = false;
    });

    this.client.on('disconnect', () => {
      console.warn('⚠️ Redis cache disconnected');
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  /**
   * Generate cache key with pattern substitution
   */
  private generateKey(pattern: string, params: Record<string, string>): string {
    let key = pattern;
    for (const [param, value] of Object.entries(params)) {
      key = key.replace(`{${param}}`, value);
    }
    return key;
  }

  /**
   * Compress data if enabled
   */
  private async compress(data: any): Promise<string> {
    if (this.config.enableCompression) {
      // Simple compression for now - could use gzip for larger data
      return JSON.stringify(data);
    }
    return JSON.stringify(data);
  }

  /**
   * Decompress data if enabled
   */
  private async decompress<T>(data: string): Promise<T> {
    if (this.config.enableCompression) {
      return JSON.parse(data);
    }
    return JSON.parse(data);
  }

  /**
   * Update metrics
   */
  private updateMetrics(operation: string): void {
    if (this.config.enableMetrics) {
      const current = this.metrics.get(operation) || 0;
      this.metrics.set(operation, current + 1);
    }
  }

  // =============================================================================
  // CORE CACHE OPERATIONS
  // =============================================================================

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.connect();
      const serialized = await this.compress(value);
      const finalTTL = ttl || this.config.defaultTTL;
      
      await this.client.setEx(key, finalTTL, serialized);
      this.updateMetrics('set');
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.connect();
      const data = await this.client.get(key);
      
      if (data) {
        const result = await this.decompress<T>(data);
        this.updateMetrics('get_hit');
        return result;
      }
      
      this.updateMetrics('get_miss');
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.updateMetrics('get_error');
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.connect();
      await this.client.del(key);
      this.updateMetrics('delete');
    } catch (error) {
      console.error('Cache delete error:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set multiple values atomically
   */
  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      await this.connect();
      const pipeline = this.client.multi();
      
      for (const { key, value, ttl } of entries) {
        const serialized = await this.compress(value);
        const finalTTL = ttl || this.config.defaultTTL;
        pipeline.setEx(key, finalTTL, serialized);
      }
      
      await pipeline.exec();
      this.updateMetrics('mset');
    } catch (error) {
      console.error('Cache mset error:', error);
      throw error;
    }
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      await this.connect();
      const data = await this.client.mGet(keys);
      
      const results = await Promise.all(
        data.map(async (item) => {
          if (item) {
            return await this.decompress<T>(item);
          }
          return null;
        })
      );
      
      this.updateMetrics('mget');
      return results;
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  // =============================================================================
  // DOMAIN-SPECIFIC CACHE OPERATIONS
  // =============================================================================

  /**
   * Cache photo analysis result
   */
  async cachePhotoAnalysis(photoId: string, result: AdjectiveResult, ttl?: number): Promise<void> {
    const key = this.generateKey(CACHE_KEYS.PHOTO_ANALYSIS, { photoId });
    await this.set(key, result, ttl);
  }

  /**
   * Get cached photo analysis result
   */
  async getCachedPhotoAnalysis(photoId: string): Promise<AdjectiveResult | null> {
    const key = this.generateKey(CACHE_KEYS.PHOTO_ANALYSIS, { photoId });
    return await this.get<AdjectiveResult>(key);
  }

  /**
   * Cache agent result
   */
  async cacheAgentResult(agentId: string, photoId: string, result: any, ttl?: number): Promise<void> {
    const key = this.generateKey(CACHE_KEYS.AGENT_RESULT, { agentId, photoId });
    await this.set(key, result, ttl);
  }

  /**
   * Get cached agent result
   */
  async getCachedAgentResult(agentId: string, photoId: string): Promise<any | null> {
    const key = this.generateKey(CACHE_KEYS.AGENT_RESULT, { agentId, photoId });
    return await this.get(key);
  }

  /**
   * Cache system health data
   */
  async cacheSystemHealth(healthData: any, ttl: number = 300): Promise<void> {
    await this.set(CACHE_KEYS.SYSTEM_HEALTH, healthData, ttl);
  }

  /**
   * Get cached system health data
   */
  async getCachedSystemHealth(): Promise<any | null> {
    return await this.get(CACHE_KEYS.SYSTEM_HEALTH);
  }

  /**
   * Cache task status
   */
  async cacheTaskStatus(taskId: string, status: any, ttl: number = 3600): Promise<void> {
    const key = this.generateKey(CACHE_KEYS.TASK_STATUS, { taskId });
    await this.set(key, status, ttl);
  }

  /**
   * Get cached task status
   */
  async getCachedTaskStatus(taskId: string): Promise<any | null> {
    const key = this.generateKey(CACHE_KEYS.TASK_STATUS, { taskId });
    return await this.get(key);
  }

  // =============================================================================
  // RATE LIMITING
  // =============================================================================

  /**
   * Check rate limit for user/endpoint
   */
  async checkRateLimit(userId: string, endpoint: string, limit: number, window: number): Promise<boolean> {
    const key = this.generateKey(CACHE_KEYS.API_RATE_LIMIT, { userId, endpoint });
    
    try {
      await this.connect();
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, window);
      }
      
      return current <= limit;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow if rate limiting fails
    }
  }

  /**
   * Get rate limit info
   */
  async getRateLimitInfo(userId: string, endpoint: string): Promise<{ current: number; limit: number; window: number } | null> {
    const key = this.generateKey(CACHE_KEYS.API_RATE_LIMIT, { userId, endpoint });
    
    try {
      await this.connect();
      const current = await this.client.get(key);
      const ttl = await this.client.ttl(key);
      
      if (current && ttl > 0) {
        return {
          current: parseInt(current),
          limit: 100, // Default limit
          window: ttl
        };
      }
      
      return null;
    } catch (error) {
      console.error('Rate limit info error:', error);
      return null;
    }
  }

  // =============================================================================
  // METRICS AND MONITORING
  // =============================================================================

  /**
   * Get cache metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      await this.connect();
      const info = await this.client.info();
      const memory = await this.client.memoryUsage();
      
      return {
        connected: this.isConnected,
        metrics: this.getMetrics(),
        memory,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string>)
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: this.isConnected,
        metrics: this.getMetrics(),
        error: error.message
      };
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    try {
      await this.connect();
      await this.client.flushDb();
      this.updateMetrics('clear');
    } catch (error) {
      console.error('Cache clear error:', error);
      throw error;
    }
  }

  /**
   * Get cache keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      await this.connect();
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    try {
      await this.connect();
      const keys = await this.client.keys('*');
      return keys.length;
    } catch (error) {
      console.error('Cache size error:', error);
      return 0;
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a shared cache instance
 */
export function createSharedCache(config?: Partial<CacheConfig>): SharedCache {
  return new SharedCache(config);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { CacheConfig };
export { DEFAULT_CACHE_CONFIG, CACHE_KEYS, createSharedCache };
