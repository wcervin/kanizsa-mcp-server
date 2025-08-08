/**
 * Shared Monitoring Layer for Kanizsa MCP Architecture
 * 
 * This module provides unified monitoring, observability, and distributed
 * tracing capabilities across all services.
 * 
 * VERSION: 11.2.0 - Strong Typing & Code Quality
 * LAST UPDATED: August 08, 2025, 12:42:33 CDT
 */

import { performance } from 'perf_hooks';
import type { SharedCache } from './shared-cache.js';

// =============================================================================
// MONITORING CONFIGURATION
// =============================================================================

/**
 * Monitoring configuration options
 */
export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableHealthChecks: boolean;
  metricsInterval: number;
  healthCheckInterval: number;
  traceSamplingRate: number;
  maxTraceDuration: number;
}

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enableMetrics: true,
  enableTracing: true,
  enableHealthChecks: true,
  metricsInterval: 60000, // 1 minute
  healthCheckInterval: 30000, // 30 seconds
  traceSamplingRate: 0.1, // 10% sampling
  maxTraceDuration: 300000 // 5 minutes
};

// =============================================================================
// METRICS COLLECTION
// =============================================================================

/**
 * Metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Metric interface
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
  description?: string;
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private metrics: Map<string, Metric> = new Map();
  private config: MonitoringConfig;
  private cache: SharedCache;

  constructor(cache: SharedCache, config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.cache = cache;
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    if (!this.config.enableMetrics) return;

    const key = this.generateMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === 'counter') {
      existing.value += value;
      existing.timestamp = Date.now();
    } else {
      this.metrics.set(key, {
        name,
        type: 'counter',
        value,
        labels,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Set a gauge metric
   */
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.config.enableMetrics) return;

    const key = this.generateMetricKey(name, labels);
    this.metrics.set(key, {
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: Date.now()
    });
  }

  /**
   * Record a histogram metric
   */
  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.config.enableMetrics) return;

    const key = this.generateMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === 'histogram') {
      // For simplicity, we'll just track the latest value
      // In a real implementation, you'd track buckets
      existing.value = value;
      existing.timestamp = Date.now();
    } else {
      this.metrics.set(key, {
        name,
        type: 'histogram',
        value,
        labels,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Generate metric key
   */
  private generateMetricKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    
    for (const metric of this.metrics.values()) {
      const labelStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      
      const metricName = `kanizsa_${metric.name}`;
      const value = metric.value;
      const timestamp = metric.timestamp;
      
      if (labelStr) {
        lines.push(`${metricName}{${labelStr}} ${value} ${timestamp}`);
      } else {
        lines.push(`${metricName} ${value} ${timestamp}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Save metrics to cache
   */
  async saveMetrics(): Promise<void> {
    if (!this.config.enableMetrics) return;

    try {
      const metrics = this.getMetrics();
      await this.cache.set('metrics:current', metrics, 300); // 5 minutes TTL
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// =============================================================================
// DISTRIBUTED TRACING
// =============================================================================

/**
 * Trace span interface
 */
export interface TraceSpan {
  id: string;
  parentId?: string;
  traceId: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; message: string; data?: any }>;
}

/**
 * Trace context interface
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentId?: string;
  sampled: boolean;
}

/**
 * Distributed tracer
 */
export class DistributedTracer {
  private spans: Map<string, TraceSpan> = new Map();
  private config: MonitoringConfig;
  private cache: SharedCache;

  constructor(cache: SharedCache, config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.cache = cache;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return crypto.randomUUID();
  }

  /**
   * Start a new trace span
   */
  startSpan(name: string, parentContext?: TraceContext): TraceContext {
    if (!this.config.enableTracing) {
      return { traceId: '', spanId: '', sampled: false };
    }

    const traceId = parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const sampled = Math.random() < this.config.traceSamplingRate;

    const span: TraceSpan = {
      id: spanId,
      parentId: parentContext?.spanId,
      traceId,
      name,
      startTime: performance.now(),
      tags: {},
      logs: []
    };

    this.spans.set(spanId, span);

    return {
      traceId,
      spanId,
      parentId: parentContext?.spanId,
      sampled
    };
  }

  /**
   * End a trace span
   */
  endSpan(spanId: string, tags?: Record<string, any>): void {
    if (!this.config.enableTracing) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;

    if (tags) {
      Object.assign(span.tags, tags);
    }

    // Save span to cache if it's within max duration
    if (span.duration <= this.config.maxTraceDuration) {
      this.saveSpan(span);
    }
  }

  /**
   * Add tag to span
   */
  addTag(spanId: string, key: string, value: any): void {
    if (!this.config.enableTracing) return;

    const span = this.spans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  /**
   * Add log to span
   */
  addLog(spanId: string, message: string, data?: any): void {
    if (!this.config.enableTracing) return;

    const span = this.spans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        data
      });
    }
  }

  /**
   * Save span to cache
   */
  private async saveSpan(span: TraceSpan): Promise<void> {
    try {
      const key = `trace:${span.traceId}:${span.id}`;
      await this.cache.set(key, span, 3600); // 1 hour TTL
    } catch (error) {
      console.error('Failed to save trace span:', error);
    }
  }

  /**
   * Get trace by ID
   */
  async getTrace(traceId: string): Promise<TraceSpan[]> {
    try {
      const pattern = `trace:${traceId}:*`;
      const keys = await this.cache.keys(pattern);
      const spans = await this.cache.mget<TraceSpan>(keys);
      return spans.filter(span => span !== null) as TraceSpan[];
    } catch (error) {
      console.error('Failed to get trace:', error);
      return [];
    }
  }

  /**
   * Get all spans
   */
  getSpans(): TraceSpan[] {
    return Array.from(this.spans.values());
  }

  /**
   * Clear spans
   */
  clear(): void {
    this.spans.clear();
  }
}

// =============================================================================
// HEALTH CHECKS
// =============================================================================

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: Record<string, {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    error?: string;
    details?: any;
  }>;
  version: string;
  uptime: number;
}

/**
 * Health checker
 */
export class HealthChecker {
  private config: MonitoringConfig;
  private cache: SharedCache;
  private startTime: number;

  constructor(cache: SharedCache, config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.cache = cache;
    this.startTime = Date.now();
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: Record<string, any> = {};
    const startTime = Date.now();

    // Check Redis connection
    try {
      const redisStart = performance.now();
      await this.cache.ping();
      const redisTime = performance.now() - redisStart;
      
      checks.redis = {
        status: 'up',
        responseTime: redisTime,
        details: { connected: true }
      };
    } catch (error) {
      checks.redis = {
        status: 'down',
        error: error.message,
        details: { connected: false }
      };
    }

    // Check system resources
    try {
      const memory = process.memoryUsage();
      const cpu = process.cpuUsage();
      
      checks.system = {
        status: 'up',
        details: {
          memory: {
            rss: memory.rss,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
            external: memory.external
          },
          cpu: {
            user: cpu.user,
            system: cpu.system
          },
          uptime: process.uptime()
        }
      };
    } catch (error) {
      checks.system = {
        status: 'degraded',
        error: error.message
      };
    }

    // Determine overall status
    const statuses = Object.values(checks).map(check => check.status);
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (statuses.includes('down')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      version: '11.2.0',
      uptime: Date.now() - this.startTime
    };

    // Cache health check result
    await this.cache.set('health:current', result, 60); // 1 minute TTL

    return result;
  }

  /**
   * Get cached health check
   */
  async getCachedHealthCheck(): Promise<HealthCheckResult | null> {
    return await this.cache.get<HealthCheckResult>('health:current');
  }
}

// =============================================================================
// MONITORING MANAGER
// =============================================================================

/**
 * Main monitoring manager that combines all monitoring features
 */
export class MonitoringManager {
  private metricsCollector: MetricsCollector;
  private tracer: DistributedTracer;
  private healthChecker: HealthChecker;
  private config: MonitoringConfig;
  private intervals: NodeJS.Timeout[] = [];

  constructor(cache: SharedCache, config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.metricsCollector = new MetricsCollector(cache, config);
    this.tracer = new DistributedTracer(cache, config);
    this.healthChecker = new HealthChecker(cache, config);
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.config.enableMetrics) {
      const metricsInterval = setInterval(async () => {
        await this.metricsCollector.saveMetrics();
      }, this.config.metricsInterval);
      this.intervals.push(metricsInterval);
    }

    if (this.config.enableHealthChecks) {
      const healthInterval = setInterval(async () => {
        await this.healthChecker.performHealthCheck();
      }, this.config.healthCheckInterval);
      this.intervals.push(healthInterval);
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get tracer
   */
  getTracer(): DistributedTracer {
    return this.tracer;
  }

  /**
   * Get health checker
   */
  getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a monitoring manager instance
 */
export function createMonitoringManager(cache: SharedCache, config?: Partial<MonitoringConfig>): MonitoringManager {
  return new MonitoringManager(cache, config);
}


