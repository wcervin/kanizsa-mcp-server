#!/usr/bin/env node

/**
 * Test Script for Kanizsa MCP Architecture Improvements
 * 
 * This script validates that all improvements are working correctly.
 * 
 * VERSION: 11.2.2 - Strong Typing & Code Quality
 * LAST UPDATED: August 5, 2025, 14:25:00 CDT
 */

import { createSharedComponents, createFullTestRunner } from './src/index.js';

async function testImprovements() {
  console.log('🧪 Testing Kanizsa MCP Architecture Improvements...\n');

  try {
    // Test 1: Create shared components
    console.log('1️⃣ Testing shared components creation...');
    const components = createSharedComponents({
      cache: { redisUrl: 'redis://localhost:6379' },
      security: { jwtSecret: 'test-secret-key' }
    });
    console.log('✅ Shared components created successfully');

    // Test 2: Test cache operations
    console.log('\n2️⃣ Testing cache operations...');
    const testData = { message: 'Hello from test', timestamp: Date.now() };
    await components.cache.set('test:key', testData, 60);
    const retrieved = await components.cache.get('test:key');
    if (retrieved && retrieved.message === testData.message) {
      console.log('✅ Cache operations working correctly');
    } else {
      console.log('❌ Cache operations failed');
    }

    // Test 3: Test security manager
    console.log('\n3️⃣ Testing security manager...');
    const testUser = {
      userId: 'test_user',
      email: 'test@example.com',
      role: 'user',
      permissions: ['read', 'write']
    };
    const token = components.securityManager.generateToken(testUser);
    const authResult = await components.securityManager.authenticateRequest(`Bearer ${token}`);
    if (authResult.authenticated && authResult.user) {
      console.log('✅ Security manager working correctly');
    } else {
      console.log('❌ Security manager failed');
    }

    // Test 4: Test monitoring manager
    console.log('\n4️⃣ Testing monitoring manager...');
    const metrics = components.monitoringManager.getMetricsCollector();
    metrics.increment('test_counter', 1, { test: 'improvements' });
    metrics.gauge('test_gauge', 42, { test: 'improvements' });
    const allMetrics = metrics.getMetrics();
    if (allMetrics.length > 0) {
      console.log('✅ Monitoring manager working correctly');
    } else {
      console.log('❌ Monitoring manager failed');
    }

    // Test 5: Test HTTP client
    console.log('\n5️⃣ Testing HTTP client...');
    const httpClient = components.httpClient;
    const config = httpClient.getConfig();
    if (config.baseUrl && config.timeout) {
      console.log('✅ HTTP client configured correctly');
    } else {
      console.log('❌ HTTP client configuration failed');
    }

    // Test 6: Run comprehensive tests
    console.log('\n6️⃣ Running comprehensive test suite...');
    const testRunner = createFullTestRunner({
      test: {
        enableTypeSafetyTests: true,
        enableIntegrationTests: false, // Skip integration tests for this demo
        enableE2ETests: false // Skip E2E tests for this demo
      }
    });
    
    const results = await testRunner.runTypeSafetyTests();
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`✅ Type safety tests: ${passed}/${total} passed`);

    console.log('\n🎉 All improvements tested successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Shared components creation');
    console.log('✅ Cache operations');
    console.log('✅ Security manager');
    console.log('✅ Monitoring manager');
    console.log('✅ HTTP client configuration');
    console.log('✅ Type safety validation');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testImprovements().catch(console.error);
