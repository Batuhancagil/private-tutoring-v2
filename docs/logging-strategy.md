# Logging Strategy

This document describes the logging approach for the Private Tutoring Dashboard Platform, including development and production practices.

## Overview

The application uses structured logging with a consistent format to facilitate debugging, monitoring, and error tracking. Logging is environment-aware, with different verbosity levels for development and production.

## Log Format

All logs follow a structured format:

```
[Context] Message
```

**Examples:**
- `[Login] Authentication failed for username: john`
- `[Auth] Authentication required`
- `[ErrorBoundary] React error caught by error boundary`

### Context Components

The context string can include multiple components separated by commas:
- Context name (e.g., `Login`, `Auth`, `ErrorBoundary`)
- Endpoint: API endpoint path
- Method: HTTP method (GET, POST, etc.)
- User: User ID and role (if authenticated)

**Example:**
```
[Login, Endpoint: /api/auth/login, Method: POST] Authentication failed for username: john
```

## Development Logging

**Approach:** Verbose logging for debugging

**Methods:**
- `console.log()` - For informational messages and debugging
- `console.error()` - For errors with full details
- `console.warn()` - For warnings

**Usage:**
```typescript
import { logInfo, logError, logWarning } from '@/lib/error-logger';

// Info logging (development only)
logInfo('Login', 'User logged in successfully', { userId: user.id });

// Error logging
logError('Login', 'Authentication failed', error, requestContext);

// Warning logging
logWarning('Auth', 'Token expiration approaching', { userId: user.id });
```

**What to Log:**
- All API requests and responses (with redacted sensitive data)
- Authentication attempts (success and failure)
- Database queries (in development)
- Component lifecycle events (in development)
- Performance metrics (response times, slow queries)

## Production Logging

**Approach:** Errors only - minimal logging for performance

**Methods:**
- `console.error()` - Only for errors
- No `console.log()` statements in production code
- Structured error logging with context

**Usage:**
```typescript
import { logApiError } from '@/lib/error-logger';

// Error logging (works in both dev and production)
logApiError('Login', 'Authentication failed', error, request, user);
```

**What to Log:**
- Errors and exceptions only
- Authentication failures
- API errors (4xx, 5xx responses)
- Unhandled exceptions
- Performance issues (slow requests > 1 second)

**What NOT to Log:**
- Successful operations (unless critical)
- Debug information
- Sensitive data (passwords, tokens, cookies)
- User personal information (unless necessary for debugging)

## Error Context Requirements

All errors must include sufficient context for debugging:

### Required Context Fields

1. **Endpoint:** API endpoint path (e.g., `/api/auth/login`)
2. **Method:** HTTP method (GET, POST, PUT, DELETE)
3. **User ID:** User ID if authenticated (null if not authenticated)
4. **Role:** User role if authenticated (null if not authenticated)
5. **Timestamp:** ISO 8601 timestamp
6. **Error Message:** Error message from exception
7. **Stack Trace:** Stack trace (in development, optional in production)

### Optional Context Fields

- **Request Body:** Redacted request body (sensitive data removed)
- **Query Parameters:** URL query parameters
- **Headers:** Relevant headers (excluding sensitive ones)

### Example Error Log

```json
{
  "context": "[Login, Endpoint: /api/auth/login, Method: POST, User: user123 (TEACHER)]",
  "message": "Authentication failed for username: john",
  "error": "Invalid password",
  "stack": "Error: Invalid password\n    at verifyPassword...",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "body": {
    "username": "john",
    "password": "[REDACTED]"
  }
}
```

## Sensitive Data Redaction

The following data must be redacted from logs:

- **Passwords:** Always redacted as `[REDACTED]`
- **Tokens:** JWT tokens, API tokens
- **Secrets:** API keys, database credentials
- **Cookies:** Cookie values (especially auth-token)
- **Personal Information:** SSN, credit card numbers (if applicable)

### Redaction Implementation

The `error-logger.ts` utility automatically redacts sensitive data:

```typescript
const sensitiveKeys = ['password', 'token', 'secret', 'auth-token', 'cookie'];
```

## Error Logging Utilities

### `logError(context, message, error, requestContext?)`

Logs an error with structured format and context.

**Parameters:**
- `context`: Context string (e.g., "Login", "Auth")
- `message`: Error message
- `error`: Error object or unknown
- `requestContext`: Optional context object with user, endpoint, method, etc.

### `logApiError(context, message, error, request, user?)`

Logs an API error with request context.

**Parameters:**
- `context`: Context string
- `message`: Error message
- `error`: Error object
- `request`: NextRequest object
- `user`: Optional authenticated user

### `logInfo(context, message, data?)`

Logs informational message (development only).

### `logWarning(context, message, data?)`

Logs warning message.

## Error Boundaries

React error boundaries catch client-side errors and log them with context:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Error boundaries:
- Display user-friendly error messages
- Log errors with structured format
- Include component stack in development

## Performance Monitoring

### Response Time Tracking

All API routes track response times:

```typescript
import { trackPerformance } from '@/lib/performance-monitor';

trackPerformance(endpoint, method, responseTime, statusCode);
```

### Error Rate Tracking

Error rates are tracked per endpoint:

```typescript
import { getErrorRate } from '@/lib/performance-monitor';

const errorRate = getErrorRate('/api/auth/login', 'POST');
```

### Slow Request Logging

Requests taking longer than 1 second are logged as warnings (development) or errors (production).

## Railway Metrics

Railway provides built-in metrics for production monitoring:

- **CPU Usage:** Available in Railway dashboard
- **Memory Usage:** Available in Railway dashboard
- **Request Count:** Available in Railway dashboard
- **Error Rate:** Available in Railway dashboard
- **Response Times:** Available in Railway dashboard

**Note:** Custom performance monitoring (`lib/performance-monitor.ts`) provides additional insights and is useful for development. Railway metrics are the primary source for production monitoring.

## Best Practices

1. **Use Structured Logging:** Always use the logging utilities, never raw `console.log()`
2. **Include Context:** Always include relevant context (endpoint, user, method)
3. **Redact Sensitive Data:** Never log passwords, tokens, or secrets
4. **Environment Awareness:** Use appropriate logging level for environment
5. **Error Boundaries:** Wrap application root with error boundary
6. **Performance Tracking:** Track response times for all API routes
7. **Monitor Error Rates:** Track error rates per endpoint
8. **Document Errors:** Include sufficient context for debugging

## Future Considerations (v2)

- **Sentry Integration:** Error tracking service for production
- **LogRocket:** Session replay and error tracking
- **Structured Logging Service:** External logging service (e.g., Datadog, Logtail)
- **Metrics Dashboard:** Custom metrics dashboard
- **Alerting:** Automated alerts for high error rates or slow requests

## References

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Railway Metrics](https://docs.railway.app/monitoring/metrics)

