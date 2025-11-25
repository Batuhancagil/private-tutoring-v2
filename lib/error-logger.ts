import { NextRequest } from 'next/server';
import { JWTPayload } from './auth';

/**
 * Redact sensitive data from request body
 */
function redactSensitiveData(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveKeys = ['password', 'token', 'secret', 'auth-token', 'cookie'];
  const redacted = { ...body };

  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = '[REDACTED]';
    }
  }

  return redacted;
}

/**
 * Get safe request body for logging
 */
function getSafeRequestBody(request: NextRequest): any {
  try {
    // Clone request to avoid consuming the body
    const clonedRequest = request.clone();
    // Note: In Next.js, request body is already consumed, so we can't read it here
    // This is a placeholder - in practice, you'd need to pass body separately
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Structured error logger
 */
export interface ErrorContext {
  user?: JWTPayload | null;
  endpoint?: string;
  method?: string;
  requestBody?: any;
  timestamp?: string;
}

/**
 * Log error with structured format: [Context] Message
 */
export function logError(
  context: string,
  message: string,
  error: Error | unknown,
  requestContext?: ErrorContext
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? error.stack : undefined;

  // Build context string
  const contextParts: string[] = [context];

  if (requestContext?.endpoint) {
    contextParts.push(`Endpoint: ${requestContext.endpoint}`);
  }

  if (requestContext?.method) {
    contextParts.push(`Method: ${requestContext.method}`);
  }

  if (requestContext?.user) {
    contextParts.push(`User: ${requestContext.user.userId} (${requestContext.user.role})`);
  }

  const contextString = contextParts.join(', ');

  // Log structured error
  if (process.env.NODE_ENV === 'production') {
    // Production: Only log errors
    console.error(`[${contextString}] ${message}`, {
      error: errorMessage,
      stack: stackTrace,
      timestamp,
      ...(requestContext?.requestBody && { body: redactSensitiveData(requestContext.requestBody) }),
    });
  } else {
    // Development: Verbose logging
    console.error(`[${contextString}] ${message}`);
    console.error('Error details:', {
      error: errorMessage,
      stack: stackTrace,
      timestamp,
      ...(requestContext?.requestBody && { body: redactSensitiveData(requestContext.requestBody) }),
    });
  }
}

/**
 * Log API error with request context
 */
export function logApiError(
  context: string,
  message: string,
  error: Error | unknown,
  request: NextRequest,
  user?: JWTPayload | null
): void {
  logError(context, message, error, {
    user,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log info message (development only)
 */
export function logInfo(context: string, message: string, data?: any): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${context}] ${message}`, data || '');
  }
}

/**
 * Log warning message
 */
export function logWarning(context: string, message: string, data?: any): void {
  console.warn(`[${context}] ${message}`, data || '');
}

