# Architecture

## Executive Summary

This architecture document defines the technical decisions and implementation patterns for the Private Tutoring Dashboard Platform. The system is built as a multi-tenant SaaS B2B web application using Next.js 14 with TypeScript, PostgreSQL, and Prisma ORM. The architecture prioritizes consistency for AI agent implementation, real-time progress tracking, and scalable multi-tenant data isolation.

**Key Architectural Principles:**
- **Multi-tenant isolation:** Teacher = Tenant, complete data separation
- **Real-time updates:** Progress calculations update within 500ms
- **Mobile-first:** Optimized for students/parents, desktop for teachers
- **Type safety:** TypeScript + Prisma for end-to-end type safety
- **Consistency:** Standardized patterns for AI agent implementation

## Project Initialization

**Note:** This project has already been initialized. The original setup command was:

```bash
npx create-next-app@latest private-tutoring-v2 --typescript --tailwind --eslint --app --src-dir
```

**Current Project Structure:**
- Next.js 14 with App Router
- TypeScript configured
- Tailwind CSS for styling
- ESLint for code quality
- Prisma ORM with PostgreSQL

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Framework** | Next.js | 14.2.0 | All | Full-stack framework with SSR, API routes, and excellent TypeScript support |
| **Language** | TypeScript | 5.5.0 | All | Type safety and better developer experience |
| **Styling** | Tailwind CSS | 3.4.0 | All UI epics | Utility-first CSS, fast development, consistent design |
| **Database** | PostgreSQL | Latest | All | Relational database perfect for structured educational data |
| **ORM** | Prisma | 5.19.0 | All | Type-safe database access, migrations, excellent DX |
| **Authentication** | Custom JWT | - | Epic 1 | JWT tokens in httpOnly cookies, 24h expiration |
| **Password Hashing** | bcryptjs | 2.4.3 | Epic 1 | Industry-standard password security |
| **Validation** | Zod | 3.23.8 | All API epics | Runtime type validation for API inputs |
| **Real-time Updates** | Next.js Revalidation | - | Epic 5, 6 | Server Actions with revalidation for MVP (no extra infrastructure) |
| **Email Service** | Deferred to v2 | - | Future | MVP uses in-app notifications only |
| **File Storage** | Deferred to v2 | - | Future | MVP uses text-based resources |
| **Background Jobs** | In-memory processing | - | Epic 5 | Progress calculations are lightweight, no queue needed |
| **Deployment** | Railway | - | All | Managed PostgreSQL, easy deployment, Nixpacks builder |
| **API Pattern** | REST | - | All | Next.js Route Handlers (app/api/*/route.ts) |

## Project Structure

```
private-tutoring-v2/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   └── health/route.ts
│   ├── admin/                    # Superadmin routes
│   │   └── dashboard/
│   ├── teacher/                   # Teacher routes
│   │   └── dashboard/
│   ├── student/                   # Student routes
│   │   └── dashboard/
│   ├── parent/                    # Parent routes
│   │   └── dashboard/
│   ├── login/                     # Public routes
│   ├── dashboard/                 # General dashboard
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── globals.css                # Global styles
├── components/                    # React components
│   ├── layout/                    # Layout components
│   │   ├── DashboardLayout.tsx
│   │   └── Navigation.tsx
│   ├── ui/                        # Reusable UI components
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── LogoutButton.tsx
├── lib/                           # Utility libraries
│   ├── prisma.ts                  # Prisma client singleton
│   ├── auth.ts                    # Authentication utilities
│   ├── auth-helpers.ts            # Auth helper functions
│   ├── api-helpers.ts              # API route helpers
│   └── utils.ts                   # General utilities
├── prisma/                        # Database schema and migrations
│   ├── schema.prisma              # Prisma schema
│   └── migrations/               # Database migrations
├── scripts/                       # Utility scripts
│   ├── seed.ts                    # Database seeding
│   ├── setup-db.sh                # Database setup
│   └── postbuild.sh               # Post-build script
├── docs/                          # Documentation
│   ├── PRD.md                     # Product Requirements
│   ├── epics.md                   # Epic breakdown
│   └── architecture.md            # This file
├── middleware.ts                   # Next.js middleware (auth)
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                    # Dependencies
└── railway.json                   # Railway deployment config
```

## Epic to Architecture Mapping

| Epic | Architecture Components | Key Technologies |
| ---- | ----------------------- | ---------------- |
| **Epic 1: Foundation & Authentication** | `app/api/auth/*`, `lib/auth.ts`, `middleware.ts`, `prisma/schema.prisma` (User model) | Next.js API Routes, JWT, bcryptjs, Prisma |
| **Epic 2: User & Resource Management** | `app/api/*/users`, `app/api/*/resources`, Prisma models (User, Lesson, Topic, Resource) | Prisma ORM, Next.js API Routes, Zod validation |
| **Epic 3: Timeline & Assignment System** | `app/api/assignments`, Prisma models (Assignment), Timeline components | Prisma, Date handling, Calendar/Timeline UI |
| **Epic 4: Daily Question Logging** | `app/api/progress`, Prisma model (ProgressLog), Mobile-optimized forms | Prisma, Mobile-first UI, Form validation |
| **Epic 5: Progress Calculation & Visualization** | Progress calculation utilities, Real-time revalidation, Prisma aggregations | Prisma aggregations, Next.js revalidation |
| **Epic 6: Teacher Dashboard & Visibility** | `app/teacher/dashboard`, Dashboard components, Progress visualization | React components, Tailwind CSS, Data visualization |
| **Epic 7: Parent Portal** | `app/parent/dashboard`, Progress graphs, Historical data queries | Chart libraries, Prisma queries, Mobile optimization |
| **Epic 8: Subscription Management** | `app/api/subscriptions`, Prisma model (Subscription), Access control | Prisma, RBAC middleware, Date calculations |
| **Epic 9: Communication Features** | `app/api/messages`, Prisma model (Message), Chat UI components | Prisma, Real-time updates, UI components |
| **Epic 10: Mobile Optimization & Polish** | Responsive components, Performance optimization, Accessibility | Tailwind responsive, Performance monitoring, WCAG compliance |

## Technology Stack Details

### Core Technologies

**Frontend Framework:**
- **Next.js 14** with App Router
  - Server Components for performance
  - Client Components for interactivity
  - API Routes for backend logic
  - Built-in optimizations (image, font, script)

**Language:**
- **TypeScript 5.5.0**
  - Strict mode enabled
  - Path aliases: `@/*` → `./*`
  - Type safety end-to-end

**Styling:**
- **Tailwind CSS 3.4.0**
  - Utility-first approach
  - Dark mode support via CSS variables
  - Responsive design utilities

**Database:**
- **PostgreSQL**
  - Multi-tenant architecture (teacherId isolation)
  - Indexes for performance
  - Foreign key constraints for data integrity

**ORM:**
- **Prisma 5.19.0**
  - Type-safe database access
  - Migration system
  - Prisma Client generation

**Authentication:**
- **Custom JWT Implementation**
  - JWT tokens in httpOnly cookies
  - 24-hour expiration
  - Role-based access control (RBAC)
  - Password hashing with bcryptjs (10 salt rounds)

**Validation:**
- **Zod 3.23.8**
  - Runtime type validation
  - API input validation
  - Type inference

### Integration Points

**Real-time Updates:**
- Next.js Server Actions with `revalidatePath()` and `revalidateTag()`
- No WebSocket infrastructure needed for MVP
- Progress calculations trigger revalidation on log submission

**Multi-tenant Data Isolation:**
- Database-level: `teacherId` foreign key on all tenant-scoped tables
- Application-level: Middleware enforces tenant isolation
- Superadmin can access all tenants via special checks

**API Communication:**
- REST API using Next.js Route Handlers
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Patterns

**API Routes:**
- Route files: `app/api/{resource}/route.ts`
- Endpoints: RESTful naming (e.g., `/api/users`, `/api/assignments`)
- Route handlers: Named exports (`GET`, `POST`, `PUT`, `DELETE`)

**Database:**
- Table names: `PascalCase` singular (e.g., `User`, `Assignment`, `ProgressLog`)
- Column names: `camelCase` (e.g., `teacherId`, `startDate`, `questionCount`)
- Foreign keys: `{table}Id` format (e.g., `studentId`, `topicId`)

**Components:**
- Component files: `PascalCase.tsx` (e.g., `DashboardLayout.tsx`, `Button.tsx`)
- Component names: Match filename
- Props interfaces: `{Component}Props` (e.g., `ButtonProps`)

**Utilities:**
- File names: `kebab-case.ts` (e.g., `api-helpers.ts`, `auth-helpers.ts`)
- Function names: `camelCase` (e.g., `getAuthUser`, `requireRole`)

### Structure Patterns

**API Routes:**
- Location: `app/api/{resource}/route.ts`
- Export: Named exports for HTTP methods
- Error handling: Try/catch with NextResponse.json
- Validation: Zod schemas at route level

**Components:**
- Location: `components/{category}/{Component}.tsx`
- Categories: `layout/`, `ui/`, feature-specific folders
- Client components: Mark with `'use client'` directive
- Server components: Default (no directive)

**Database Access:**
- Prisma client: Singleton in `lib/prisma.ts`
- Import: `import { prisma } from '@/lib/prisma'`
- Queries: Use Prisma Client methods
- Transactions: Use `prisma.$transaction()`

**Utilities:**
- Location: `lib/{utility-name}.ts`
- Auth utilities: `lib/auth.ts`, `lib/auth-helpers.ts`
- API helpers: `lib/api-helpers.ts`
- General utilities: `lib/utils.ts`

### Format Patterns

**API Request Format:**
```typescript
// Request body (JSON)
{
  "field1": "value1",
  "field2": "value2"
}
```

**API Response Format:**
```typescript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "error": "Error message",
  "details": { ... } // Optional, for validation errors
}
```

**Error Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (authorization failed)
- `404`: Not Found
- `500`: Internal Server Error

**Date Format:**
- Database: ISO 8601 strings (`DateTime` type in Prisma)
- API: ISO 8601 strings
- Display: Format in UI components (use `Intl.DateTimeFormat`)

### Communication Patterns

**API Route Handler Pattern:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { z } from 'zod';

const schema = z.object({ /* ... */ });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    // ... business logic
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Authentication Pattern:**
```typescript
import { withAuth, withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';

// Require authentication
export const POST = withAuth(async (request, user) => {
  // user is guaranteed to be authenticated
  // ... handler logic
});

// Require specific role
export const GET = withRole(UserRole.TEACHER, async (request, user) => {
  // user is guaranteed to be TEACHER
  // ... handler logic
});
```

**Database Query Pattern:**
```typescript
import { prisma } from '@/lib/prisma';

// Single query
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// Multi-tenant query (teacher isolation)
const students = await prisma.user.findMany({
  where: {
    role: UserRole.STUDENT,
    teacherId: user.teacherId, // Enforce tenant isolation
  },
});
```

### Lifecycle Patterns

**Loading States:**
- Use React `useState` for loading state
- Pattern: `const [loading, setLoading] = useState(false)`
- Show loading indicator during async operations

**Error Handling:**
- API routes: Try/catch with appropriate status codes
- Components: Error boundaries for React errors
- User-facing errors: Clear, actionable messages

**Data Fetching:**
- Server Components: Direct Prisma queries
- Client Components: `fetch()` to API routes
- Real-time updates: `revalidatePath()` after mutations

**Form Submission:**
```typescript
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'An error occurred');
      return;
    }
    
    // Success handling
    router.push('/success');
  } catch (err) {
    setError('An error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Location Patterns

**API Routes:**
- Structure: `app/api/{resource}/route.ts`
- Nested resources: `app/api/{resource}/{id}/route.ts`
- Actions: `app/api/{resource}/{action}/route.ts` (e.g., `/api/auth/login`)

**Static Assets:**
- Images: `public/images/`
- Icons: `public/icons/`
- Other assets: `public/{category}/`

**Configuration Files:**
- Next.js: `next.config.js`
- TypeScript: `tsconfig.json`
- Tailwind: `tailwind.config.ts`
- Prisma: `prisma/schema.prisma`
- Environment: `.env` (not committed)

### Consistency Patterns

**Date Formatting:**
- Use `Intl.DateTimeFormat` for user-facing dates
- Store dates as ISO strings in database
- Display format: Locale-aware (e.g., "Jan 15, 2024")

**Logging:**
- Use `console.error()` for errors
- Use `console.log()` for debugging (remove in production)
- Log format: `[Context] Message` (e.g., `[Login] Authentication failed`)

**User-Facing Errors:**
- Clear, actionable messages
- No technical jargon
- Example: "Invalid username or password" (not "401 Unauthorized")

**Color Coding:**
- Green: Success, on track, positive
- Yellow: Warning, attention needed
- Red: Error, struggling, critical
- Blue: Information, neutral

## Consistency Rules

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `DashboardLayout.tsx`)
- Utilities: `kebab-case.ts` (e.g., `api-helpers.ts`)
- API routes: `route.ts` (in `app/api/{resource}/`)

**Variables:**
- `camelCase` for variables and functions
- `PascalCase` for components and types
- `UPPER_SNAKE_CASE` for constants

**Database:**
- Models: `PascalCase` singular (e.g., `User`, `Assignment`)
- Fields: `camelCase` (e.g., `teacherId`, `startDate`)
- Enums: `PascalCase` (e.g., `UserRole`)

### Code Organization

**Component Structure:**
```typescript
'use client'; // Only if needed

import { ... } from '...';

interface ComponentProps {
  // Props definition
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
  return ( ... );
}
```

**API Route Structure:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ... } from '@/lib/...';

// Validation schema
const schema = z.object({ ... });

// Handler
export async function METHOD(request: NextRequest) {
  try {
    // Validation
    // Business logic
    // Response
  } catch (error) {
    // Error handling
  }
}
```

### Error Handling

**API Routes:**
- Always use try/catch
- Return appropriate HTTP status codes
- Return JSON error responses: `{ error: "message" }`
- Log errors with `console.error()`

**Components:**
- Handle async errors in event handlers
- Display user-friendly error messages
- Use error boundaries for React errors

**Validation:**
- Use Zod schemas for all API inputs
- Return 400 status for validation errors
- Include error details: `{ error: "Validation error", details: [...] }`

### Logging Strategy

**Development:**
- Use `console.log()` for debugging
- Use `console.error()` for errors
- Include context in log messages

**Production:**
- Remove debug `console.log()` statements
- Keep `console.error()` for error tracking
- Consider adding structured logging (future)

**Log Format:**
```
[Context] Message
Example: [Login] User authentication failed for username: john
```

## Data Architecture

### Database Schema

**Core Models:**

1. **User** (Multi-tenant user management)
   - Roles: SUPERADMIN, TEACHER, STUDENT, PARENT
   - Multi-tenant: `teacherId` links students/parents to teachers
   - Authentication: username + hashed password

2. **ParentStudent** (Many-to-many relationship)
   - Links parents to students
   - One student can have multiple parents

3. **Lesson** (Educational content hierarchy)
   - Top-level organization
   - `teacherId` null = pre-built (global), non-null = teacher-specific

4. **Topic** (Second level)
   - Belongs to Lesson
   - Contains Resources and Assignments

5. **Resource** (Third level)
   - Belongs to Topic
   - Educational materials

6. **Assignment** (Student assignments)
   - Links Student + Topic + Resource
   - Timeline: `startDate`, `endDate`
   - Question tracking: `questionCount`, `dailyTarget`
   - Exam mode: `examMode` flag

7. **ProgressLog** (Daily question logging)
   - Links Student + Assignment + Date
   - Metrics: `rightCount`, `wrongCount`, `emptyCount`, `bonusCount`
   - Unique constraint: `(studentId, assignmentId, date)`

8. **Subscription** (Teacher subscriptions)
   - One-to-one with Teacher
   - Duration: `startDate`, `endDate`
   - Access control based on expiration

9. **Message** (Communication)
   - Links Sender + Receiver
   - Content, read status, timestamps

### Multi-Tenant Architecture

**Tenant Model:**
- **Tenant = Teacher Account**
- All tenant-scoped tables include `teacherId` foreign key
- Data isolation enforced at database and application level

**Tenant Isolation:**
- Students: `teacherId` links to teacher
- Parents: Linked via `ParentStudent` to students (inherits tenant)
- Resources: `teacherId` null = global, non-null = tenant-specific
- Assignments: Inherit tenant from student
- ProgressLog: Inherit tenant from student

**Superadmin Access:**
- Can view all tenants
- Special checks bypass tenant isolation
- Used for subscription management

### Data Relationships

```
User (Teacher)
  ├── User[] (Students) - via teacherId
  ├── Subscription (one-to-one)
  └── Lesson[] (teacher-specific)

User (Student)
  ├── Assignment[]
  ├── ProgressLog[]
  └── ParentStudent[] (links to parents)

Lesson
  └── Topic[]
      ├── Resource[]
      └── Assignment[]

Assignment
  ├── ProgressLog[]
  └── Links: Student + Topic + Resource
```

## API Contracts

### Authentication Endpoints

**POST `/api/auth/login`**
- Request: `{ username: string, password: string }`
- Response: `{ success: true, user: { id, username, role, teacherId } }`
- Sets httpOnly cookie: `auth-token`
- Status: 200 (success), 401 (invalid credentials), 400 (validation error)

**POST `/api/auth/logout`**
- Request: None (uses cookie)
- Response: `{ success: true }`
- Clears `auth-token` cookie
- Status: 200

**GET `/api/auth/me`**
- Request: None (uses cookie)
- Response: `{ user: { id, username, role, teacherId } }`
- Status: 200 (authenticated), 401 (not authenticated)

### Standard API Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Error message",
  "details": { ... } // Optional, for validation errors
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (authorization failed)
- `404`: Not Found
- `500`: Internal Server Error

## Security Architecture

### Authentication

**Method:** Custom JWT-based authentication
- JWT tokens stored in httpOnly cookies
- Token expiration: 24 hours
- Token payload: `{ userId, username, role, teacherId }`

**Password Security:**
- Hashing: bcryptjs with 10 salt rounds
- Validation: Minimum 8 characters, uppercase, lowercase, number
- Storage: Never store plaintext passwords

### Authorization

**Role-Based Access Control (RBAC):**
- Roles: SUPERADMIN, TEACHER, STUDENT, PARENT
- Middleware enforces role checks
- API helpers: `withRole()`, `withAnyRole()`

**Multi-Tenant Isolation:**
- Database-level: Foreign key constraints
- Application-level: Middleware checks `teacherId`
- Superadmin bypasses tenant isolation

### Data Protection

**In Transit:**
- HTTPS/TLS enforced in production
- Secure cookies: `secure: true` in production

**At Rest:**
- Database encryption (managed by Railway/PostgreSQL)
- Environment variables for secrets

**Session Management:**
- httpOnly cookies prevent XSS attacks
- SameSite: 'lax' prevents CSRF
- 24-hour expiration balances security and UX

## Performance Considerations

### Database Optimization

**Indexes:**
- User: `teacherId`, `role`
- Assignment: `studentId`, `topicId`, `startDate`, `endDate`
- ProgressLog: `studentId`, `assignmentId`, `date`
- Subscription: `endDate`

**Query Optimization:**
- Use Prisma `select` to limit fields
- Use `include` for relations (avoid N+1)
- Aggregate queries for progress calculations

### Frontend Performance

**Next.js Optimizations:**
- Server Components (default)
- Client Components only when needed
- Image optimization (Next.js Image component)
- Font optimization

**Real-time Updates:**
- Server Actions with `revalidatePath()`
- No polling needed
- Updates trigger on mutation

### Caching Strategy

**Progress Calculations:**
- Calculate on-demand (lightweight)
- Cache in React state
- Revalidate on log submission

**Future Enhancements:**
- Redis for caching (v2)
- CDN for static assets (v2)

## Deployment Architecture

### Platform: Railway

**Configuration:**
- Builder: Nixpacks
- Build command: `npm run build && bash scripts/postbuild.sh`
- Start command: `npm start` (runs migrations then starts server)

**Database:**
- Railway PostgreSQL service
- Connection via `DATABASE_URL` environment variable
- Migrations run automatically on deploy

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `NODE_ENV`: `production` in production

### Deployment Process

1. **Build:**
   - Install dependencies
   - Generate Prisma Client
   - Build Next.js application
   - Run post-build script

2. **Deploy:**
   - Start Next.js server
   - Run database migrations (`prisma migrate deploy`)
   - Application ready

3. **Health Check:**
   - Endpoint: `/api/health`
   - Used by Railway for health monitoring

## Development Environment

### Prerequisites

- **Node.js:** 18+ (LTS recommended)
- **PostgreSQL:** 14+ (or use Railway PostgreSQL)
- **npm:** 9+ (or yarn/pnpm)

### Setup Commands

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add DATABASE_URL and JWT_SECRET

# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production-like)
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Development Scripts

- `npm run dev`: Start development server (port 3000)
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run db:generate`: Generate Prisma Client
- `npm run db:push`: Push schema changes (dev)
- `npm run db:migrate`: Run migrations (prod)
- `npm run db:studio`: Open Prisma Studio
- `npm run db:seed`: Seed database

## Architecture Decision Records (ADRs)

### ADR-001: Next.js 14 with App Router

**Decision:** Use Next.js 14 with App Router instead of Pages Router.

**Rationale:**
- Modern React Server Components
- Better performance with Server Components
- Improved developer experience
- Future-proof (App Router is the future of Next.js)

**Alternatives Considered:**
- Pages Router (older, less performant)
- Remix (good but less ecosystem support)

**Status:** Implemented

---

### ADR-002: Prisma ORM

**Decision:** Use Prisma ORM instead of raw SQL or TypeORM.

**Rationale:**
- Type-safe database access
- Excellent TypeScript support
- Migration system
- Great developer experience
- Auto-generated types

**Alternatives Considered:**
- TypeORM (more complex, less type-safe)
- Raw SQL (no type safety, more boilerplate)
- Drizzle (newer, less mature)

**Status:** Implemented

---

### ADR-003: Custom JWT Authentication

**Decision:** Use custom JWT authentication instead of NextAuth.js or Clerk.

**Rationale:**
- Full control over authentication flow
- Simpler for MVP (no external dependencies)
- JWT tokens in httpOnly cookies (secure)
- Easy to extend later

**Alternatives Considered:**
- NextAuth.js (more features but more complex)
- Clerk (external service, costs money)
- Session-based (less scalable)

**Status:** Implemented

**Future Consideration:** May migrate to NextAuth.js in v2 for OAuth support.

---

### ADR-004: Real-time Updates via Revalidation

**Decision:** Use Next.js Server Actions with revalidation instead of WebSockets or SSE.

**Rationale:**
- No additional infrastructure needed
- Simpler for MVP
- Sufficient for < 500ms requirement (with proper caching)
- Can upgrade to WebSockets in v2 if needed

**Alternatives Considered:**
- WebSockets (more complex, requires infrastructure)
- Server-Sent Events (one-way only)
- Polling (inefficient)

**Status:** Implemented

**Future Consideration:** Add WebSocket support in v2 for true real-time collaboration.

---

### ADR-005: Multi-Tenant via teacherId Foreign Key

**Decision:** Use `teacherId` foreign key pattern instead of separate databases or schemas.

**Rationale:**
- Simpler to manage (single database)
- Easier migrations
- Cost-effective (single database instance)
- Sufficient for 1000+ teachers scale

**Alternatives Considered:**
- Separate databases per tenant (complex, expensive)
- Schema-based isolation (PostgreSQL feature, more complex)
- Row-level security (good but adds complexity)

**Status:** Implemented

**Future Consideration:** May implement Row-Level Security (RLS) in PostgreSQL for additional security layer.

---

### ADR-006: Railway Deployment

**Decision:** Deploy to Railway instead of Vercel or AWS.

**Rationale:**
- Managed PostgreSQL included
- Easy deployment process
- Good for MVP and growth stage
- Cost-effective for small to medium scale

**Alternatives Considered:**
- Vercel (excellent for Next.js but requires separate database)
- AWS (more complex, overkill for MVP)
- Fly.io (good alternative, similar to Railway)

**Status:** Implemented

**Future Consideration:** May migrate to AWS for enterprise scale (1000+ teachers).

---

### ADR-007: Defer Email Service to v2

**Decision:** Defer email service integration to v2, use in-app notifications for MVP.

**Rationale:**
- MVP focuses on core features (time savings + visibility)
- In-app notifications sufficient for MVP
- Reduces complexity and dependencies
- Can add email in v2 when needed

**Alternatives Considered:**
- Resend (good but adds dependency)
- SendGrid (mature but costs money)
- Postmark (good for transactional)

**Status:** Deferred to v2

---

### ADR-008: In-Memory Progress Calculations

**Decision:** Calculate progress in-memory instead of background jobs or queues.

**Rationale:**
- Progress calculations are lightweight
- No need for queue infrastructure
- Simpler for MVP
- Can optimize with caching if needed

**Alternatives Considered:**
- Background jobs (BullMQ, overkill for MVP)
- Scheduled tasks (not needed, calculations are on-demand)
- Cached calculations (may add in v2 if performance issues)

**Status:** Implemented

**Future Consideration:** Add Redis caching in v2 if calculations become bottleneck.

---

_Generated by BMAD Decision Architecture Workflow v1.3.2_  
_Date: 2025-01-27_  
_For: BatuRUN_  
_Project: private-tutoring-v2_

