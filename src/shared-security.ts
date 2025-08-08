/**
 * Shared Security Layer for Kanizsa MCP Architecture
 * 
 * This module provides unified security features including authentication,
 * rate limiting, input validation, and security monitoring.
 * 
 * VERSION: 6.0.2 - Strong Typing & Code Quality
 * LAST UPDATED: August 08, 2025, 11:42:09 CDT
 */

import crypto from 'crypto';
import { z } from 'zod';
import type { SharedCache } from './shared-cache.js';

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

/**
 * Security configuration options
 */
export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiry: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  enableAuditLog: boolean;
  enableInputValidation: boolean;
  allowedOrigins: string[];
  maxRequestSize: number;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
      jwtSecret: process.env.JWT_SECRET || process.env.KANIZSA_JWT_SECRET || 'default_jwt_secret_change_in_production',
  jwtExpiry: 3600, // 1 hour
  rateLimitWindow: 60, // 1 minute
  rateLimitMax: 100, // 100 requests per minute
  enableAuditLog: true,
  enableInputValidation: true,
  allowedOrigins: ['http://localhost:3000', 'http://localhost:8000'],
  maxRequestSize: 10 * 1024 * 1024 // 10MB
};

// =============================================================================
// JWT TOKEN MANAGEMENT
// =============================================================================

/**
 * JWT token payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

/**
 * JWT token manager
 */
export class JWTManager {
  private secret: string;
  private expiry: number;

  constructor(secret: string, expiry: number) {
    this.secret = secret;
    this.expiry = expiry;
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + this.expiry
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload));
    const signature = this.generateSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [header, payload, signature] = parts;
      const expectedSignature = this.generateSignature(`${header}.${payload}`);

      if (signature !== expectedSignature) {
        return null;
      }

      const decodedPayload = JSON.parse(this.base64UrlDecode(payload)) as JWTPayload;
      const now = Math.floor(Date.now() / 1000);

      if (decodedPayload.exp < now) {
        return null;
      }

      return decodedPayload;
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }

  /**
   * Generate signature
   */
  private generateSignature(data: string): string {
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest('base64'));
  }

  /**
   * Base64 URL encoding
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decoding
   */
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Buffer.from(str, 'base64').toString();
  }
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limiting manager
 */
export class RateLimitManager {
  private cache: SharedCache;
  private window: number;
  private max: number;

  constructor(cache: SharedCache, window: number, max: number) {
    this.cache = cache;
    this.window = window;
    this.max = max;
  }

  /**
   * Check rate limit for user/endpoint
   */
  async checkRateLimit(userId: string, endpoint: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const allowed = await this.cache.checkRateLimit(userId, endpoint, this.max, this.window);
    const info = await this.cache.getRateLimitInfo(userId, endpoint);
    
    return {
      allowed,
      remaining: info ? Math.max(0, this.max - info.current) : this.max,
      resetTime: info ? Date.now() + (info.window * 1000) : Date.now() + (this.window * 1000)
    };
  }

  /**
   * Get rate limit headers
   */
  async getRateLimitHeaders(userId: string, endpoint: string): Promise<Record<string, string>> {
    const result = await this.checkRateLimit(userId, endpoint);
    const info = await this.cache.getRateLimitInfo(userId, endpoint);
    
    return {
      'X-RateLimit-Limit': this.max.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(result.resetTime / 1000).toString(),
      'X-RateLimit-Reset-Time': new Date(result.resetTime).toISOString()
    };
  }
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================

/**
 * Input validation schemas
 */
export const ValidationSchemas = {
  // Photo validation
  Photo: z.object({
    id: z.string().min(1).max(255),
    url: z.string().url().max(2048),
    title: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    tags: z.array(z.string().max(100)).max(50).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }),

  // Analysis options validation
  AnalysisOptions: z.object({
    maxAdjectives: z.number().min(1).max(100).optional(),
    includeCategories: z.boolean().optional(),
    enhanceDescription: z.boolean().optional(),
    confidence: z.number().min(0).max(1).optional(),
    timeout: z.number().min(1000).max(300000).optional()
  }),

  // API request validation
  APIRequest: z.object({
    photo: z.object({
      id: z.string().min(1),
      url: z.string().url(),
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      metadata: z.record(z.string(), z.any()).optional()
    }),
    options: z.object({
      maxAdjectives: z.number().min(1).max(100).optional(),
      includeCategories: z.boolean().optional(),
      enhanceDescription: z.boolean().optional()
    }).optional()
  }),

  // User authentication validation
  UserAuth: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    username: z.string().min(3).max(50).optional()
  }),

  // File upload validation
  FileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().regex(/^image\/(jpeg|png|gif|webp)$/),
    size: z.number().max(10 * 1024 * 1024) // 10MB max
  })
};

/**
 * Input validation manager
 */
export class InputValidator {
  /**
   * Validate input against schema
   */
  static validate<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; errors: string[] } {
    try {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: any): { success: boolean; error?: string } {
    const result = ValidationSchemas.FileUpload.safeParse(file);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }
    return { success: true };
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit logger
 */
export class AuditLogger {
  private cache: SharedCache;
  private enabled: boolean;

  constructor(cache: SharedCache, enabled: boolean = true) {
    this.cache = cache;
    this.enabled = enabled;
  }

  /**
   * Log audit entry
   */
  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    if (!this.enabled) return;

    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    try {
      const key = `audit:${fullEntry.timestamp}:${fullEntry.userId}:${fullEntry.action}`;
      await this.cache.set(key, fullEntry, 86400); // Keep for 24 hours
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(userId: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'authentication',
      resource: 'auth',
      details: { success },
      ipAddress,
      userAgent,
      success
    });
  }

  /**
   * Log API access
   */
  async logApiAccess(userId: string, endpoint: string, method: string, success: boolean, ipAddress?: string): Promise<void> {
    await this.log({
      userId,
      action: 'api_access',
      resource: endpoint,
      details: { method, endpoint },
      ipAddress,
      success
    });
  }

  /**
   * Log photo analysis
   */
  async logPhotoAnalysis(userId: string, photoId: string, success: boolean, errorMessage?: string): Promise<void> {
    await this.log({
      userId,
      action: 'photo_analysis',
      resource: `photo:${photoId}`,
      details: { photoId },
      success,
      errorMessage
    });
  }
}

// =============================================================================
// SECURITY MANAGER
// =============================================================================

/**
 * Main security manager that combines all security features
 */
export class SecurityManager {
  private jwtManager: JWTManager;
  private rateLimitManager: RateLimitManager;
  private auditLogger: AuditLogger;
  private config: SecurityConfig;

  constructor(cache: SharedCache, config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    this.jwtManager = new JWTManager(this.config.jwtSecret, this.config.jwtExpiry);
    this.rateLimitManager = new RateLimitManager(cache, this.config.rateLimitWindow, this.config.rateLimitMax);
    this.auditLogger = new AuditLogger(cache, this.config.enableAuditLog);
  }

  /**
   * Authenticate request
   */
  async authenticateRequest(authHeader: string | undefined): Promise<{
    authenticated: boolean;
    user?: JWTPayload;
    error?: string;
  }> {
    if (!authHeader) {
      return { authenticated: false, error: 'No authorization header' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Invalid authorization format' };
    }

    const token = authHeader.substring(7);
    const payload = this.jwtManager.verifyToken(token);

    if (!payload) {
      return { authenticated: false, error: 'Invalid or expired token' };
    }

    return { authenticated: true, user: payload };
  }

  /**
   * Check rate limit for request
   */
  async checkRateLimit(userId: string, endpoint: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    headers: Record<string, string>;
  }> {
    const result = await this.rateLimitManager.checkRateLimit(userId, endpoint);
    const headers = await this.rateLimitManager.getRateLimitHeaders(userId, endpoint);

    return {
      ...result,
      headers
    };
  }

  /**
   * Validate input
   */
  validateInput<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; errors: string[] } {
    return InputValidator.validate(schema, data);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return this.jwtManager.generateToken(payload);
  }

  /**
   * Log audit entry
   */
  async logAudit(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    await this.auditLogger.log(entry);
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a security manager instance
 */
export function createSecurityManager(cache: SharedCache, config?: Partial<SecurityConfig>): SecurityManager {
  return new SecurityManager(cache, config);
}


