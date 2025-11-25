# Epic Technical Specification: Foundation & Authentication

Date: 2025-11-23
Author: BatuRUN
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the core technical foundation for the Private Tutoring Dashboard Platform. It focuses on setting up the Next.js 14 application structure, implementing the secure multi-tenant architecture, and establishing the authentication system that underpins all subsequent features. This epic directly addresses FR-001 (User Authentication & Authorization), FR-012 (Security Basics), and lays the groundwork for FR-011 (Mobile-Responsive Design) by establishing the basic UI framework. It is the critical first step in delivering the "instant visibility" magic by ensuring a secure, performant, and scalable platform.

## Objectives and Scope

**In Scope:**
*   **Project Initialization:** Setting up the Next.js 14 repository with TypeScript, Tailwind CSS, ESLint, and Prisma.
*   **Database Schema:** Designing and implementing the core database schema with multi-tenant support (`teacherId` isolation) and core user roles (Superadmin, Teacher, Student, Parent).
*   **Authentication System:** Implementing secure JWT-based authentication with httpOnly cookies, password hashing (bcrypt), and session management.
*   **Role-Based Access Control (RBAC):** creating middleware and helper functions to enforce permissions based on user roles.
*   **Basic UI Framework:** Establishing the global layout, navigation, and responsive design foundation using Tailwind CSS components.
*   **Security Foundation:** Configuring HTTPS/TLS, security headers, and data encryption standards.
*   **Observability:** Setting up basic logging, error handling, and a health check endpoint.

**Out of Scope:**
*   **Feature Implementation:** Specific student management, resource creation, or assignment logic (covered in Epics 2-3).
*   **Advanced Monitoring:** Integration with external services like Sentry or LogRocket (deferred to future).
*   **Email Notifications:** Email service integration (deferred to v2).
*   **Complex UI Components:** Dashboard widgets or timeline views (covered in respective epics).

## System Architecture Alignment

This epic implements the core "Foundation & Authentication" components defined in the [Architecture](./architecture.md). Specifically:
*   **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma.
*   **Auth:** Custom JWT implementation as defined in ADR-003, using `lib/auth.ts` and `middleware.ts`.
*   **Multi-tenancy:** Implements the `teacherId` foreign key pattern (ADR-005) in `prisma/schema.prisma`.
*   **API Pattern:** Sets up the standard `app/api/*` route handler structure with Zod validation.
*   **Deployment:** Configures the project for Railway deployment (ADR-006).

## Detailed Design

### Services and Modules

| Module/Service | Responsibility | Inputs | Outputs | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Service** (`lib/auth.ts`) | Handles token generation, verification, and password hashing. | User credentials, Tokens | JWT Tokens, Verified User | Backend |
| **Auth Middleware** (`middleware.ts`) | Protects routes based on authentication status and user roles. | Incoming Request | NextResponse (rewrite/redirect) | Shared |
| **Database Client** (`lib/prisma.ts`) | Singleton Prisma client for database access. | Prisma Queries | Data Models | Backend |
| **User API** (`app/api/auth/*`) | Endpoints for login, logout, and user info (`/me`). | HTTP Requests | JSON Responses | Backend |
| **Layout Components** (`components/layout/*`) | Provides consistent UI structure (nav, sidebar, footer). | Page Content | Rendered HTML | Frontend |
| **Health Check** (`app/api/health/route.ts`) | Returns system status for monitoring. | None | JSON Status | Backend |

### Data Models and Contracts

**Prisma Schema Snippet (`prisma/schema.prisma`):**

```prisma
enum UserRole {
  SUPERADMIN
  TEACHER
  STUDENT
  PARENT
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  role      UserRole
  teacherId String? // For multi-tenancy
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  teacher   User?    @relation("TeacherStudents", fields: [teacherId], references: [id])
  students  User[]   @relation("TeacherStudents")
  
  // ... other relations defined in Architecture
}
```

**JWT Payload Contract:**

```typescript
interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  teacherId: string | null;
  exp: number; // Expiration timestamp
}
```

### APIs and Interfaces

**1. Login Endpoint (`POST /api/auth/login`)**
*   **Request:** `{ "username": "string", "password": "string" }`
*   **Response (200):** `{ "success": true, "user": { "id": "...", "username": "...", "role": "..." } }`
*   **Response (401):** `{ "error": "Invalid credentials" }`
*   **Cookie:** Sets `auth-token` httpOnly cookie.

**2. Get Current User (`GET /api/auth/me`)**
*   **Request:** None (uses cookie).
*   **Response (200):** `{ "user": { "id": "...", "username": "...", "role": "...", "teacherId": "..." } }`
*   **Response (401):** `{ "error": "Unauthorized" }`

**3. Logout Endpoint (`POST /api/auth/logout`)**
*   **Request:** None.
*   **Response (200):** `{ "success": true }`
*   **Effect:** Clears `auth-token` cookie.

**4. Health Check (`GET /api/health`)**
*   **Response (200):** `{ "status": "healthy", "database": "connected", "timestamp": "..." }`

### Workflows and Sequencing

**Login Flow:**
1.  User submits credentials on `/login` page.
2.  Frontend sends POST request to `/api/auth/login`.
3.  API validates input using Zod.
4.  API looks up user in Database via Prisma.
5.  API verifies password hash (bcrypt).
6.  If valid, API generates JWT.
7.  API sets httpOnly `auth-token` cookie.
8.  API returns success response.
9.  Frontend redirects to role-specific dashboard (e.g., `/teacher/dashboard`).

**Protected Route Access:**
1.  User navigates to `/teacher/dashboard`.
2.  Next.js Middleware intercepts request.
3.  Middleware checks for `auth-token` cookie.
4.  Middleware verifies JWT signature.
5.  Middleware checks User Role against route requirements (e.g., must be TEACHER).
6.  If authorized, request proceeds.
7.  If unauthorized, redirect to `/login` or show 403.

## Non-Functional Requirements

### Performance
*   **API Latency:** Auth endpoints should respond in < 200ms.
*   **Dashboard Load:** Initial dashboard shell should load in < 1s (FCP).
*   **Database:** Connection pooling configured for Railway/PostgreSQL.

### Security
*   **Encryption:** TLS 1.3 for all transit; AES-256 for data at rest (db level).
*   **Passwords:** Bcrypt hashing (salt rounds: 10).
*   **Cookies:** `httpOnly`, `secure` (prod), `SameSite=Lax`.
*   **Headers:** Helmet or Next.js config for CSP, X-Frame-Options, etc.

### Reliability/Availability
*   **Stateless Auth:** JWTs allow stateless verification, suitable for horizontal scaling.
*   **Health Checks:** Endpoint provided for Railway health monitoring.
*   **Graceful Degradation:** UI handles network errors gracefully.

### Observability
*   **Logging:** Structured logs (`[Auth] Login success...`) using `console.log`/`console.error`.
*   **Error Handling:** Global error boundary and API try/catch blocks.

## Dependencies and Integrations

*   **Production Dependencies:**
    *   `next`, `react`, `react-dom` (Core)
    *   `prisma`, `@prisma/client` (Database)
    *   `bcryptjs` (Security)
    *   `jose` (JWT handling - preferred over `jsonwebtoken` for Edge support)
    *   `zod` (Validation)
    *   `clsx`, `tailwind-merge` (UI utilities)
    *   `lucide-react` (Icons)

*   **Dev Dependencies:**
    *   `typescript`
    *   `tailwindcss`, `postcss`, `autoprefixer`
    *   `eslint`, `prettier`
    *   `ts-node` (for seeding)

## Acceptance Criteria (Authoritative)

1.  **Project Structure:** The repository is initialized with Next.js 14, TypeScript, Tailwind, and a clean folder structure as defined in Architecture.
2.  **Database Setup:** PostgreSQL database is provisioned, and the Prisma schema is applied with `User` model and `teacherId` relation.
3.  **Secure Login:** Users can log in with valid credentials and receive a secure, httpOnly session cookie. Invalid credentials return appropriate errors.
4.  **Role Enforcement:** Middleware successfully blocks unauthorized access (e.g., Student cannot access `/teacher/*`).
5.  **Tenant Isolation:** Database schema enforces `teacherId` on tenant-scoped records (verified via schema review).
6.  **UI Foundation:** A responsive layout exists with navigation that adapts to the user's role.
7.  **Health Check:** `/api/health` endpoint returns 200 OK and database status.
8.  **Security Headers:** Response headers include standard security protections (verified via browser dev tools).

## Traceability Mapping

| AC Item | Spec Section | Component/API | Test Idea |
| :--- | :--- | :--- | :--- |
| AC 1 (Project) | Overview | Repo Root | Verify `package.json` and folder structure. |
| AC 2 (DB) | Data Models | `prisma/schema.prisma` | Run `prisma db push` and check DB tables. |
| AC 3 (Login) | APIs - Login | `POST /api/auth/login` | Test valid/invalid login via Postman/Curl. |
| AC 4 (RBAC) | Workflows | `middleware.ts` | Attempt to access `/admin` as Student user. |
| AC 5 (Tenant) | Data Models | `prisma/schema.prisma` | Verify `teacherId` field exists and is FK. |
| AC 6 (UI) | Detailed Design | `components/layout/*` | Resize window to mobile/desktop; check nav. |
| AC 7 (Health) | APIs - Health | `GET /api/health` | Hit endpoint and verify JSON response. |
| AC 8 (Sec Headers) | NFR - Security | `next.config.js` | Inspect headers in browser network tab. |

## Risks, Assumptions, Open Questions

*   **Risk:** JWT invalidation is difficult without a blacklist.
    *   *Mitigation:* Short expiration times (24h) and client-side logout (cookie clearing).
*   **Assumption:** Railway provides sufficient database connection limits for MVP.
*   **Question:** Do we need a "Forgot Password" flow for MVP?
    *   *Decision:* No, manual reset by Superadmin for MVP to save time.

## Test Strategy Summary

*   **Unit Tests:** Test utility functions (auth helpers, validation logic) using Jest/Vitest (if added) or manual verification scripts.
*   **Integration Tests:** Test API endpoints (`/api/auth/*`) using Postman or curl scripts.
*   **Manual Testing:** Verify UI responsiveness, login flow, and role redirection in the browser.
*   **Security Testing:** Verify cookie attributes and header security using browser dev tools.







