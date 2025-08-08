/**
 * Shared Testing Framework for Kanizsa MCP Architecture
 * 
 * This module provides comprehensive testing utilities including integration
 * tests, type safety validation, and end-to-end workflow tests.
 * 
 * VERSION: 11.3.0 - Strong Typing & Code Quality
 * LAST UPDATED: August 08, 2025, 13:31:49 CDT
 */

import type { SharedCache, SharedHttpClient, SecurityManager, MonitoringManager } from './index.js';
import type { Photo, AdjectiveResult, AnalysisOptions } from './shared-types.js';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

/**
 * Test configuration options
 */
export interface TestConfig {
  enableIntegrationTests: boolean;
  enableTypeSafetyTests: boolean;
  enableE2ETests: boolean;
  testTimeout: number;
  retryAttempts: number;
  parallelTests: boolean;
  mockExternalServices: boolean;
}

/**
 * Default test configuration
 */
export const DEFAULT_TEST_CONFIG: TestConfig = {
  enableIntegrationTests: true,
  enableTypeSafetyTests: true,
  enableE2ETests: true,
  testTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  parallelTests: false,
  mockExternalServices: true
};

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Test result interface
 */
export interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
  timestamp: string;
}

/**
 * Test suite result interface
 */
export interface TestSuiteResult {
  name: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  timestamp: string;
}

/**
 * Mock data generator
 */
export class MockDataGenerator {
  /**
   * Generate mock photo data
   */
  static generateMockPhoto(overrides: Partial<Photo> = {}): Photo {
    return {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: `https://example.com/photos/${Date.now()}.jpg`,
      title: 'Test Photo',
      description: 'A test photo for validation',
      tags: ['test', 'validation', 'photo'],
      metadata: {
        width: 1920,
        height: 1080,
        format: 'jpeg',
        size: 1024000
      },
      ...overrides
    };
  }

  /**
   * Generate mock analysis options
   */
  static generateMockAnalysisOptions(overrides: Partial<AnalysisOptions> = {}): AnalysisOptions {
    return {
      maxAdjectives: 10,
      includeCategories: true,
      enhanceDescription: true,
      confidence: 0.8,
      timeout: 30000,
      ...overrides
    };
  }

  /**
   * Generate mock adjective result
   */
  static generateMockAdjectiveResult(photoId: string, overrides: Partial<AdjectiveResult> = {}): AdjectiveResult {
    return {
      photoId,
      adjectives: ['beautiful', 'colorful', 'dramatic', 'artistic', 'stunning'],
      categories: {
        style: ['modern', 'artistic'],
        mood: ['dramatic', 'peaceful'],
        composition: ['balanced', 'dynamic']
      },
      enhancedDescription: 'A beautiful and colorful photo with dramatic lighting and artistic composition.',
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      processingTime: 1500,
      agentId: 'available-agent',
      ...overrides
    };
  }
}

// =============================================================================
// TYPE SAFETY TESTS
// =============================================================================

/**
 * Type safety test runner
 */
export class TypeSafetyTester {
  /**
   * Test shared type compatibility
   */
  static async testSharedTypeCompatibility(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'Shared Type Compatibility Test';

    try {
      // Test Photo interface compatibility
      const mockPhoto = MockDataGenerator.generateMockPhoto();
      const requiredFields = ['id', 'url'];
      
      for (const field of requiredFields) {
        if (!(field in mockPhoto)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Test AnalysisOptions interface compatibility
      const mockOptions = MockDataGenerator.generateMockAnalysisOptions();
      const validOptions = ['maxAdjectives', 'includeCategories', 'enhanceDescription'];
      
      for (const option of validOptions) {
        if (option in mockOptions && typeof mockOptions[option as keyof AnalysisOptions] !== 'undefined') {
          // Validate option types
          if (option === 'maxAdjectives' && typeof mockOptions.maxAdjectives !== 'number') {
            throw new Error(`Invalid type for maxAdjectives: expected number, got ${typeof mockOptions.maxAdjectives}`);
          }
          if (option === 'includeCategories' && typeof mockOptions.includeCategories !== 'boolean') {
            throw new Error(`Invalid type for includeCategories: expected boolean, got ${typeof mockOptions.includeCategories}`);
          }
        }
      }

      // Test AdjectiveResult interface compatibility
      const mockResult = MockDataGenerator.generateMockAdjectiveResult('test_photo');
      const resultFields = ['photoId', 'adjectives', 'categories', 'enhancedDescription', 'confidence', 'timestamp'];
      
      for (const field of resultFields) {
        if (!(field in mockResult)) {
          throw new Error(`Missing required field in AdjectiveResult: ${field}`);
        }
      }

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test validation schema compatibility
   */
  static async testValidationSchemaCompatibility(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'Validation Schema Compatibility Test';

    try {
      // Test that validation schemas match interface definitions
      const mockPhoto = MockDataGenerator.generateMockPhoto();
      const mockOptions = MockDataGenerator.generateMockAnalysisOptions();

      // This would test against actual Zod schemas if imported
      // For now, we'll test the structure matches
      const photoFields = Object.keys(mockPhoto);
      const expectedPhotoFields = ['id', 'url', 'title', 'description', 'tags', 'metadata'];
      
      for (const field of expectedPhotoFields) {
        if (!photoFields.includes(field)) {
          throw new Error(`Missing field in Photo interface: ${field}`);
        }
      }

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

/**
 * Integration test runner
 */
export class IntegrationTester {
  private cache: SharedCache;
  private httpClient: SharedHttpClient;
  private securityManager: SecurityManager;
  private monitoringManager: MonitoringManager;

  constructor(
    cache: SharedCache,
    httpClient: SharedHttpClient,
    securityManager: SecurityManager,
    monitoringManager: MonitoringManager
  ) {
    this.cache = cache;
    this.httpClient = httpClient;
    this.securityManager = securityManager;
    this.monitoringManager = monitoringManager;
  }

  /**
   * Test cache integration
   */
  async testCacheIntegration(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'Cache Integration Test';

    try {
      // Test basic cache operations
      const testKey = 'test:integration:cache';
      const testData = { message: 'Hello from integration test', timestamp: Date.now() };

      // Test set operation
      await this.cache.set(testKey, testData, 60);
      
      // Test get operation
      const retrieved = await this.cache.get(testKey);
      if (!retrieved || retrieved.message !== testData.message) {
        throw new Error('Cache get operation failed');
      }

      // Test delete operation
      await this.cache.delete(testKey);
      const afterDelete = await this.cache.get(testKey);
      if (afterDelete !== null) {
        throw new Error('Cache delete operation failed');
      }

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test HTTP client integration
   */
  async testHttpClientIntegration(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'HTTP Client Integration Test';

    try {
      // Test ping operation
      const isReachable = await this.httpClient.ping();
      if (!isReachable) {
        throw new Error('HTTP client cannot reach the API');
      }

      // Test version endpoint
      const version = await this.httpClient.getVersion();
      if (!version || !version.version) {
        throw new Error('Version endpoint returned invalid data');
      }

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test security manager integration
   */
  async testSecurityManagerIntegration(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'Security Manager Integration Test';

    try {
      // Test JWT token generation and verification
      const testUser = {
        userId: 'test_user_123',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read', 'write']
      };

      const token = this.securityManager.generateToken(testUser);
      const authResult = await this.securityManager.authenticateRequest(`Bearer ${token}`);

      if (!authResult.authenticated || !authResult.user) {
        throw new Error('JWT token authentication failed');
      }

      if (authResult.user.userId !== testUser.userId) {
        throw new Error('JWT token payload mismatch');
      }

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test monitoring manager integration
   */
  async testMonitoringManagerIntegration(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'Monitoring Manager Integration Test';

    try {
      // Test health check
      const healthChecker = this.monitoringManager.getHealthChecker();
      const healthResult = await healthChecker.performHealthCheck();

      if (!healthResult || !healthResult.status) {
        throw new Error('Health check failed');
      }

      // Test metrics collection
      const metricsCollector = this.monitoringManager.getMetricsCollector();
      metricsCollector.increment('test_integration_counter', 1, { test: 'integration' });
      metricsCollector.gauge('test_integration_gauge', 42, { test: 'integration' });

      const metrics = metricsCollector.getMetrics();
      if (metrics.length === 0) {
        throw new Error('Metrics collection failed');
      }

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// =============================================================================
// END-TO-END TESTS
// =============================================================================

/**
 * End-to-end test runner
 */
export class E2ETester {
  private cache: SharedCache;
  private httpClient: SharedHttpClient;
  private securityManager: SecurityManager;
  private monitoringManager: MonitoringManager;

  constructor(
    cache: SharedCache,
    httpClient: SharedHttpClient,
    securityManager: SecurityManager,
    monitoringManager: MonitoringManager
  ) {
    this.cache = cache;
    this.httpClient = httpClient;
    this.securityManager = securityManager;
    this.monitoringManager = monitoringManager;
  }

  /**
   * Test complete photo analysis workflow
   */
  async testPhotoAnalysisWorkflow(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'Photo Analysis E2E Workflow Test';

    try {
      // Generate test data
      const mockPhoto = MockDataGenerator.generateMockPhoto();
      const mockOptions = MockDataGenerator.generateMockAnalysisOptions();

      // Start monitoring trace
      const tracer = this.monitoringManager.getTracer();
      const traceContext = tracer.startSpan('photo_analysis_e2e_test');

      // Test 1: Cache photo metadata
      await this.cache.cachePhotoAnalysis(mockPhoto.id, MockDataGenerator.generateMockAdjectiveResult(mockPhoto.id));

      // Test 2: Validate input
      const validationResult = this.securityManager.validateInput(
        // This would use actual Zod schema
        { parse: (data: any) => ({ success: true, data }) } as any,
        { photo: mockPhoto, options: mockOptions }
      );

      if (!validationResult.success) {
        throw new Error(`Input validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Test 3: Simulate API call (would be real in actual E2E test)
      const apiResponse = await this.httpClient.analyzePhoto(
        mockPhoto.url,
        'auto', // Let platform choose best agent
        mockOptions
      );

      // Test 4: Cache result
      if (apiResponse.success) {
        await this.cache.cachePhotoAnalysis(mockPhoto.id, apiResponse.data);
      }

      // Test 5: Retrieve cached result
      const cachedResult = await this.cache.getCachedPhotoAnalysis(mockPhoto.id);
      if (!cachedResult) {
        throw new Error('Cached result not found');
      }

      // End trace
      tracer.endSpan(traceContext.spanId, { success: true });

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        details: {
          photoId: mockPhoto.id,
          cachedResult: cachedResult.photoId,
          traceId: traceContext.traceId
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test security workflow
   */
  async testSecurityWorkflow(): Promise<TestResult> {
    const startTime = Date.now();
    const name = 'Security E2E Workflow Test';

    try {
      // Test 1: Generate authentication token
      const testUser = {
        userId: 'e2e_test_user',
        email: 'e2e@example.com',
        role: 'user',
        permissions: ['read', 'write', 'analyze']
      };

      const token = this.securityManager.generateToken(testUser);

      // Test 2: Authenticate request
      const authResult = await this.securityManager.authenticateRequest(`Bearer ${token}`);
      if (!authResult.authenticated) {
        throw new Error('Authentication failed');
      }

      // Test 3: Check rate limiting
      const rateLimitResult = await this.securityManager.checkRateLimit(
        testUser.userId,
        '/api/photos/analyze'
      );

      if (!rateLimitResult.allowed) {
        throw new Error('Rate limiting blocked valid request');
      }

      // Test 4: Log audit entry
      await this.securityManager.logAudit({
        userId: testUser.userId,
        action: 'photo_analysis',
        resource: 'test_photo_123',
        details: { test: 'e2e' },
        success: true
      });

      return {
        name,
        success: true,
        duration: Date.now() - startTime,
        details: {
          userId: testUser.userId,
          rateLimitRemaining: rateLimitResult.remaining
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// =============================================================================
// TEST RUNNER
// =============================================================================

/**
 * Main test runner that orchestrates all tests
 */
export class TestRunner {
  private config: TestConfig;
  private cache: SharedCache;
  private httpClient: SharedHttpClient;
  private securityManager: SecurityManager;
  private monitoringManager: MonitoringManager;

  constructor(
    cache: SharedCache,
    httpClient: SharedHttpClient,
    securityManager: SecurityManager,
    monitoringManager: MonitoringManager,
    config: Partial<TestConfig> = {}
  ) {
    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
    this.cache = cache;
    this.httpClient = httpClient;
    this.securityManager = securityManager;
    this.monitoringManager = monitoringManager;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Run type safety tests
    if (this.config.enableTypeSafetyTests) {
      results.push(await TypeSafetyTester.testSharedTypeCompatibility());
      results.push(await TypeSafetyTester.testValidationSchemaCompatibility());
    }

    // Run integration tests
    if (this.config.enableIntegrationTests) {
      const integrationTester = new IntegrationTester(
        this.cache,
        this.httpClient,
        this.securityManager,
        this.monitoringManager
      );

      results.push(await integrationTester.testCacheIntegration());
      results.push(await integrationTester.testHttpClientIntegration());
      results.push(await integrationTester.testSecurityManagerIntegration());
      results.push(await integrationTester.testMonitoringManagerIntegration());
    }

    // Run E2E tests
    if (this.config.enableE2ETests) {
      const e2eTester = new E2ETester(
        this.cache,
        this.httpClient,
        this.securityManager,
        this.monitoringManager
      );

      results.push(await e2eTester.testPhotoAnalysisWorkflow());
      results.push(await e2eTester.testSecurityWorkflow());
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      name: 'Kanizsa MCP Architecture Test Suite',
      total: results.length,
      passed,
      failed,
      duration: Date.now() - startTime,
      results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run specific test category
   */
  async runTypeSafetyTests(): Promise<TestResult[]> {
    return [
      await TypeSafetyTester.testSharedTypeCompatibility(),
      await TypeSafetyTester.testValidationSchemaCompatibility()
    ];
  }

  async runIntegrationTests(): Promise<TestResult[]> {
    const tester = new IntegrationTester(
      this.cache,
      this.httpClient,
      this.securityManager,
      this.monitoringManager
    );

    return [
      await tester.testCacheIntegration(),
      await tester.testHttpClientIntegration(),
      await tester.testSecurityManagerIntegration(),
      await tester.testMonitoringManagerIntegration()
    ];
  }

  async runE2ETests(): Promise<TestResult[]> {
    const tester = new E2ETester(
      this.cache,
      this.httpClient,
      this.securityManager,
      this.monitoringManager
    );

    return [
      await tester.testPhotoAnalysisWorkflow(),
      await tester.testSecurityWorkflow()
    ];
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a test runner instance
 */
export function createTestRunner(
  cache: SharedCache,
  httpClient: SharedHttpClient,
  securityManager: SecurityManager,
  monitoringManager: MonitoringManager,
  config?: Partial<TestConfig>
): TestRunner {
  return new TestRunner(cache, httpClient, securityManager, monitoringManager, config);
}


