
// Production utilities for treehub.app

import { config } from '@/lib/config';

/**
 * Get the full URL for a given path
 */
export function getFullUrl(path: string): string {
  const baseUrl = config.appUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get the canonical URL for SEO
 */
export function getCanonicalUrl(path: string = ''): string {
  return getFullUrl(path);
}

/**
 * Generate structured data for SEO
 */
export function generateStructuredData(type: 'website' | 'organization' | 'article', data: any) {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type,
    url: config.appUrl,
    name: config.seo.siteName,
    description: config.seo.description,
  };

  return {
    ...baseStructure,
    ...data,
  };
}

/**
 * Log production errors
 */
export function logError(error: Error, context?: string) {
  if (isProduction()) {
    console.error(`[PROD ERROR] ${context || 'Unknown'}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      domain: config.domain,
    });
  } else {
    console.error(error);
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Performance timer '${label}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    if (isProduction()) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }
}

/**
 * Validate environment variables for production
 */
export function validateProductionEnv(): { valid: boolean; missing: string[] } {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_DOMAIN',
  ];

  const missing = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Rate limiting utility
 */
export class RateLimit {
  private static requests = new Map<string, number[]>();

  static check(
    identifier: string,
    limit: number = 100,
    windowMs: number = 15 * 60 * 1000
  ): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= limit) {
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return { allowed: true, remaining: limit - recentRequests.length };
  }

  static reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}
