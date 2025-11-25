# Security Configuration

This document describes the security measures implemented in the Private Tutoring Dashboard Platform.

## HTTPS/TLS Configuration

### Production HTTPS Enforcement

**Railway Platform:**
- Railway automatically provides HTTPS/TLS 1.3 certificates for all deployments
- SSL/TLS certificates are managed by Railway - no manual certificate configuration needed
- All production deployments use HTTPS by default

**Application-Level HTTPS Enforcement:**
- Middleware enforces HTTPS redirects in production environment
- HTTP requests are automatically redirected to HTTPS (301 redirect)
- Implementation: `middleware.ts` checks protocol and redirects if HTTP in production

**Verification:**
- Access application via HTTP URL in production - should redirect to HTTPS
- Check browser dev tools Network tab to verify TLS 1.3 is used
- Use SSL Labs SSL Test (https://www.ssllabs.com/ssltest/) to verify TLS configuration

## Security Headers

Security headers are configured in `next.config.js` using Next.js `headers()` API. Headers are applied to all routes globally.

### Configured Headers

**Strict-Transport-Security (HSTS):**
- Only set in production environment
- Value: `max-age=31536000; includeSubDomains; preload`
- Forces browsers to use HTTPS for 1 year

**X-Frame-Options:**
- Value: `DENY`
- Prevents clickjacking attacks by blocking iframe embedding

**X-Content-Type-Options:**
- Value: `nosniff`
- Prevents MIME type sniffing attacks

**X-XSS-Protection:**
- Value: `1; mode=block`
- Enables browser XSS protection

**Referrer-Policy:**
- Value: `strict-origin-when-cross-origin`
- Controls referrer information sent with requests

**Permissions-Policy:**
- Value: `camera=(), microphone=(), geolocation=()`
- Restricts access to browser features

**Content-Security-Policy (CSP):**
- Configured to allow Next.js scripts, styles, and API routes
- Allows `unsafe-eval` and `unsafe-inline` for Next.js development (required for Next.js)
- Allows images from `self`, `data:`, and `https:` sources
- Blocks frame ancestors to prevent clickjacking

**X-DNS-Prefetch-Control:**
- Value: `on`
- Enables DNS prefetching for performance

### Testing Security Headers

1. Open browser dev tools (Network tab)
2. Load any page or API route
3. Inspect response headers
4. Verify all security headers are present

## Cookie Security

### Authentication Cookies

**Cookie Name:** `auth-token`

**Security Attributes:**
- `httpOnly: true` - Prevents JavaScript access (XSS prevention)
- `secure: true` (production only) - Only sent over HTTPS
- `sameSite: 'lax'` - Prevents CSRF attacks while allowing normal navigation
- `maxAge: 86400` (24 hours) - Automatic expiration
- `path: '/'` - Available site-wide

**Implementation:**
- Login route: `app/api/auth/login/route.ts`
- Logout route: `app/api/auth/logout/route.ts`

### Testing Cookie Security

1. Login to application in production
2. Open browser dev tools (Application tab)
3. Inspect `auth-token` cookie
4. Verify attributes:
   - Secure flag is set ✓
   - HttpOnly flag is set ✓
   - SameSite is set to Lax ✓
   - Path is set to / ✓

## Database Encryption

### Railway PostgreSQL Encryption

**Encryption at Rest:**
- Railway PostgreSQL provides AES-256 encryption at rest automatically
- No application-level configuration needed
- Encryption is transparent to the application

**SSL/TLS Connection:**
- Railway PostgreSQL connection strings include SSL parameters
- DATABASE_URL uses SSL by default
- Prisma automatically uses SSL when connecting to Railway PostgreSQL

**Verification:**
- Railway PostgreSQL service provides encryption automatically
- DATABASE_URL connection string includes SSL parameters
- No additional configuration required

## Environment Variable Security

### Required Environment Variables

**DATABASE_URL:**
- PostgreSQL connection string
- Automatically set by Railway when PostgreSQL service is added
- Contains database credentials - never commit to repository

**JWT_SECRET:**
- Secret key for JWT token signing
- Must be a strong random string (minimum 32 bytes)
- Generate using: `openssl rand -base64 32`
- Set in Railway environment variables for production

**NODE_ENV:**
- Set to `production` in production environment
- Used to enable production-only security features (secure cookies, HSTS)

### Security Practices

**Git Ignore:**
- `.env` file is in `.gitignore` - never committed
- `.env*.local` files are also ignored
- Only `.env.example` (with placeholder values) is committed

**Environment Variable Management:**
- Local development: Use `.env` file (not committed)
- Production: Set in Railway dashboard → Variables
- Never hardcode secrets in source code
- Use environment variables for all secrets

**Fallback Values:**
- `lib/auth.ts` has a fallback JWT_SECRET for development only
- Fallback should never be used in production
- Always set JWT_SECRET in production environment

### Creating .env.example

Create `.env.example` file with placeholder values (no real secrets):

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# JWT Secret Key
# Generate a secure random string for production:
# openssl rand -base64 32
JWT_SECRET=your-secret-key-change-in-production

# Node Environment
NODE_ENV=development

# Port (optional, defaults to 3000)
PORT=3000
```

## Security Testing Checklist

### Production Testing

- [ ] Test HTTPS redirect: Access via HTTP, verify redirect to HTTPS
- [ ] Test security headers: Verify all headers present in browser dev tools
- [ ] Test cookie security: Verify secure, httpOnly, sameSite attributes
- [ ] Test TLS version: Use SSL Labs to verify TLS 1.3
- [ ] Verify no secrets in source code: Search for hardcoded secrets
- [ ] Verify .env is gitignored: Check .gitignore includes .env
- [ ] Verify Railway environment variables are set: Check Railway dashboard

### Build Verification

- [ ] Run `npm run build` - verify no TypeScript errors
- [ ] Run `npm run lint` - verify no linting errors
- [ ] Verify no secrets exposed in build output
- [ ] Test application functionality with security headers enabled

## Security Best Practices

1. **Never commit secrets:** Always use environment variables
2. **Use strong secrets:** Generate JWT_SECRET with sufficient entropy (32+ bytes)
3. **Keep dependencies updated:** Regularly update npm packages for security patches
4. **Monitor security headers:** Use browser dev tools to verify headers in production
5. **Test in production:** Security features must be tested in production environment
6. **Review code regularly:** Look for hardcoded secrets or insecure patterns

## References

- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [Railway HTTPS/TLS](https://docs.railway.app/deploy/https)

