/**
 * Kanizsa MCP Architecture - Main Index
 * 
 * This module provides a unified interface for all shared components
 * in the Kanizsa MCP architecture.
 * 
 * VERSION: 6.0.2 - Strong Typing & Code Quality
 * LAST UPDATED: August 08, 2025, 11:42:09 CDT
 */

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

// Core types and validation
export * from './shared-types.js';

// HTTP client for API communication
export * from './shared-http-client.js';

// Caching layer with Redis integration
export * from './shared-cache.js';

// Security layer with authentication and rate limiting
export * from './shared-security.js';

// Monitoring and observability
export * from './shared-monitoring.js';

// Testing framework
export * from './shared-testing.js';

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

import { createSharedCache } from './shared-cache.js';
import { createHttpClient } from './shared-http-client.js';
import { createSecurityManager } from './shared-security.js';
import { createMonitoringManager } from './shared-monitoring.js';
import { createTestRunner } from './shared-testing.js';

/**
 * Create all shared components with default configuration
 */
export function createSharedComponents(config?: {
  cache?: Partial<import('./shared-cache.js').CacheConfig>;
  http?: Partial<import('./shared-http-client.js').HttpClientConfig>;
  security?: Partial<import('./shared-security.js').SecurityConfig>;
  monitoring?: Partial<import('./shared-monitoring.js').MonitoringConfig>;
}) {
  const cache = createSharedCache(config?.cache);
  const httpClient = createHttpClient(config?.http);
  const securityManager = createSecurityManager(cache, config?.security);
  const monitoringManager = createMonitoringManager(cache, config?.monitoring);

  return {
    cache,
    httpClient,
    securityManager,
    monitoringManager
  };
}

/**
 * Create test runner with all components
 */
export function createFullTestRunner(config?: {
  test?: Partial<import('./shared-testing.js').TestConfig>;
  cache?: Partial<import('./shared-cache.js').CacheConfig>;
  http?: Partial<import('./shared-http-client.js').HttpClientConfig>;
  security?: Partial<import('./shared-security.js').SecurityConfig>;
  monitoring?: Partial<import('./shared-monitoring.js').MonitoringConfig>;
}) {
  const components = createSharedComponents({
    cache: config?.cache,
    http: config?.http,
    security: config?.security,
    monitoring: config?.monitoring
  });

  return createTestRunner(
    components.cache,
    components.httpClient,
    components.securityManager,
    components.monitoringManager,
    config?.test
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Initialize all shared components
 */
export async function initializeSharedComponents(config?: Parameters<typeof createSharedComponents>[0]) {
  const components = createSharedComponents(config);
  
  // Initialize cache connection
  await components.cache.connect();
  
  // Start monitoring
  components.monitoringManager.start();
  
  return components;
}

/**
 * Shutdown all shared components
 */
export async function shutdownSharedComponents(components: ReturnType<typeof createSharedComponents>) {
  // Stop monitoring
  components.monitoringManager.stop();
  
  // Disconnect cache
  await components.cache.disconnect();
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Re-export commonly used types
export type {
  // Core types
  Photo,
  AdjectiveResult,
  AnalysisOptions,
  PhotoAnalysisRequest,
  BatchPhotoAnalysisRequest,
  ApiResponse
} from './shared-types.js';

export type {
  // HTTP client types
  HttpClientConfig
} from './shared-http-client.js';

export type {
  // Cache types
  CacheConfig
} from './shared-cache.js';

export type {
  // Security types
  SecurityConfig,
  JWTPayload,
  AuditLogEntry
} from './shared-security.js';

export type {
  // Monitoring types
  MonitoringConfig,
  Metric,
  TraceSpan,
  TraceContext,
  HealthCheckResult
} from './shared-monitoring.js';

export type {
  // Testing types
  TestConfig,
  TestResult,
  TestSuiteResult
} from './shared-testing.js';

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default {
  createSharedComponents,
  createFullTestRunner,
  initializeSharedComponents,
  shutdownSharedComponents
};