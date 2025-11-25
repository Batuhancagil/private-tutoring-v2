/**
 * Simple performance monitoring for API routes
 * Tracks response times and error rates
 * 
 * Note: Railway provides built-in metrics for production monitoring.
 * This utility adds basic custom metrics for development and additional insights.
 */

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
}

// In-memory storage for metrics (for MVP - can be replaced with external service in v2)
const metrics: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 metrics

/**
 * Track API route performance
 */
export function trackPerformance(
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number
): void {
  const metric: PerformanceMetrics = {
    endpoint,
    method,
    responseTime,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  metrics.push(metric);

  // Keep only last MAX_METRICS
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }

  // Log slow requests (> 1 second) or errors
  if (responseTime > 1000 || statusCode >= 400) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[Performance] ${method} ${endpoint} - ${responseTime}ms - Status: ${statusCode}`
      );
    }
  }
}

/**
 * Get error rate for an endpoint
 */
export function getErrorRate(endpoint: string, method?: string): number {
  const relevantMetrics = method
    ? metrics.filter((m) => m.endpoint === endpoint && m.method === method)
    : metrics.filter((m) => m.endpoint === endpoint);

  if (relevantMetrics.length === 0) {
    return 0;
  }

  const errors = relevantMetrics.filter((m) => m.statusCode >= 400).length;
  return errors / relevantMetrics.length;
}

/**
 * Get average response time for an endpoint
 */
export function getAverageResponseTime(endpoint: string, method?: string): number {
  const relevantMetrics = method
    ? metrics.filter((m) => m.endpoint === endpoint && m.method === method)
    : metrics.filter((m) => m.endpoint === endpoint);

  if (relevantMetrics.length === 0) {
    return 0;
  }

  const sum = relevantMetrics.reduce((acc, m) => acc + m.responseTime, 0);
  return sum / relevantMetrics.length;
}

/**
 * Get all metrics (for debugging/development)
 */
export function getAllMetrics(): PerformanceMetrics[] {
  return [...metrics];
}

/**
 * Clear metrics (for testing)
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Performance monitoring middleware wrapper for API routes
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  endpoint: string,
  method: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let statusCode = 500;

    try {
      const response = await handler(...args);
      
      // Extract status code from NextResponse if possible
      if (response && typeof response.status === 'number') {
        statusCode = response.status;
      } else if (response && response.statusCode) {
        statusCode = response.statusCode;
      }

      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      throw error;
    }
  }) as T;
}

