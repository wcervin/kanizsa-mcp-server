/**
 * Shared Type Definitions for Kanizsa MCP Architecture
 * 
 * This file contains shared type definitions that are used across
 * the MCP server and agents to ensure consistency and eliminate duplication.
 * 
 * VERSION: 11.2.4 - Strong Typing & Code Quality
 * LAST UPDATED: August 08, 2025, 13:30:43 CDT
 */

import { z } from 'zod';

// =============================================================================
// CORE PHOTO TYPES
// =============================================================================

/**
 * Photo interface - shared across all services
 */
export interface Photo {
  id: string;
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Zod schema for Photo validation
 */
export const PhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// =============================================================================
// ANALYSIS TYPES
// =============================================================================

/**
 * Analysis options interface
 */
export interface AnalysisOptions {
  maxAdjectives?: number;
  includeCategories?: boolean;
  enhanceDescription?: boolean;
  confidence?: number;
  timeout?: number;
}

/**
 * Zod schema for analysis options
 */
export const AnalysisOptionsSchema = z.object({
  maxAdjectives: z.number().optional(),
  includeCategories: z.boolean().optional(),
  enhanceDescription: z.boolean().optional(),
  confidence: z.number().optional(),
  timeout: z.number().optional()
});

/**
 * Adjective result interface
 */
export interface AdjectiveResult {
  photoId: string;
  adjectives: string[];
  categories: Record<string, string[]>;
  enhancedDescription: string;
  confidence: number;
  timestamp: string;
  processingTime?: number;
  agentId?: string;
}

/**
 * Zod schema for adjective result
 */
export const AdjectiveResultSchema = z.object({
  photoId: z.string(),
  adjectives: z.array(z.string()),
  categories: z.record(z.string(), z.array(z.string())),
  enhancedDescription: z.string(),
  confidence: z.number(),
  timestamp: z.string(),
  processingTime: z.number().optional(),
  agentId: z.string().optional()
});

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Photo analysis request
 */
export interface PhotoAnalysisRequest {
  photo: Photo;
  options?: AnalysisOptions;
}

/**
 * Zod schema for photo analysis request
 */
export const PhotoAnalysisRequestSchema = z.object({
  photo: PhotoSchema,
  options: AnalysisOptionsSchema.optional()
});

/**
 * Batch photo analysis request
 */
export interface BatchPhotoAnalysisRequest {
  photos: Photo[];
  options?: AnalysisOptions;
}

/**
 * Zod schema for batch photo analysis request
 */
export const BatchPhotoAnalysisRequestSchema = z.object({
  photos: z.array(PhotoSchema),
  options: AnalysisOptionsSchema.optional()
});

/**
 * System health response
 */
export interface SystemHealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: Record<string, {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    error?: string;
  }>;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

/**
 * Task status response
 */
export interface TaskStatusResponse {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Standard error response
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

/**
 * Zod schema for error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string(),
  requestId: z.string().optional()
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate a photo object
 */
export function validatePhoto(photo: any): Photo {
  return PhotoSchema.parse(photo);
}

/**
 * Validate analysis options
 */
export function validateAnalysisOptions(options: any): AnalysisOptions {
  return AnalysisOptionsSchema.parse(options);
}

/**
 * Validate photo analysis request
 */
export function validatePhotoAnalysisRequest(request: any): PhotoAnalysisRequest {
  return PhotoAnalysisRequestSchema.parse(request);
}

/**
 * Validate batch photo analysis request
 */
export function validateBatchPhotoAnalysisRequest(request: any): BatchPhotoAnalysisRequest {
  return BatchPhotoAnalysisRequestSchema.parse(request);
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard for Photo interface
 */
export function isPhoto(obj: any): obj is Photo {
  return PhotoSchema.safeParse(obj).success;
}

/**
 * Type guard for AnalysisOptions interface
 */
export function isAnalysisOptions(obj: any): obj is AnalysisOptions {
  return AnalysisOptionsSchema.safeParse(obj).success;
}

/**
 * Type guard for AdjectiveResult interface
 */
export function isAdjectiveResult(obj: any): obj is AdjectiveResult {
  return AdjectiveResultSchema.safeParse(obj).success;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * API response wrapper
 */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}


