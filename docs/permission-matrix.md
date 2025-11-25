# Permission Matrix & Role-Based Access Control

**Last Updated:** 2025-11-24  
**Story:** 1-4-role-based-access-control-rbac

## Overview

This document defines the role-based access control (RBAC) system for the Private Tutoring Dashboard Platform. It specifies which routes and features each user role can access.

## User Roles

- **SUPERADMIN**: System administrator with full access to all features and tenants
- **TEACHER**: Tenant owner who manages students, assignments, and resources within their tenant
- **STUDENT**: End user who logs progress and views assignments
- **PARENT**: Parent/guardian who views their child's progress

## Route Access Matrix

### Page Routes

| Route Pattern | SUPERADMIN | TEACHER | STUDENT | PARENT |
|---------------|------------|---------|---------|--------|
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/teacher/*` | ✅ | ✅ | ❌ | ❌ |
| `/student/*` | ✅ | ❌ | ✅ | ❌ |
| `/parent/*` | ✅ | ❌ | ❌ | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/login` | ✅ (redirects if authenticated) | ✅ (redirects if authenticated) | ✅ (redirects if authenticated) | ✅ (redirects if authenticated) |

### API Routes

| Route Pattern | SUPERADMIN | TEACHER | STUDENT | PARENT |
|---------------|------------|---------|---------|--------|
| `/api/auth/login` | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/logout` | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/me` | ✅ | ✅ | ✅ | ✅ |
| `/api/admin/*` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `/api/teacher/*` | ✅ | ✅ | ❌ (403) | ❌ (403) |
| `/api/student/*` | ✅ | ❌ (403) | ✅ | ❌ (403) |
| `/api/parent/*` | ✅ | ❌ (403) | ❌ (403) | ✅ |
| `/api/health` | ✅ | ✅ | ✅ | ✅ |

## Permission Details

### SUPERADMIN Permissions

- **Full System Access**: Can access all routes and features
- **Tenant Bypass**: Can access all tenant data (bypasses tenant isolation)
- **Teacher Management**: Can create, edit, and delete teacher accounts
- **Subscription Management**: Can manage subscriptions and payments
- **System Settings**: Can configure system-wide settings

### TEACHER Permissions

- **Own Tenant Only**: Can only access data within their tenant (`teacherId` matches)
- **Student Management**: Can create, edit, and delete student accounts
- **Assignment Management**: Can create and manage assignments
- **Resource Management**: Can create and manage lessons, topics, and resources
- **Progress Viewing**: Can view all students' progress within their tenant
- **Parent Assignment**: Can assign parents to students

### STUDENT Permissions

- **Own Data Only**: Can only access their own data
- **Progress Logging**: Can log daily question progress
- **Assignment Viewing**: Can view assigned topics and questions
- **Progress Viewing**: Can view their own progress and statistics
- **No Cross-Tenant Access**: Cannot access other students' data

### PARENT Permissions

- **Child Data Only**: Can only access their assigned child(ren)'s data
- **Progress Viewing**: Can view child's progress and statistics
- **Message Access**: Can communicate with child's teacher
- **No Direct Student Management**: Cannot create or edit student accounts

## Tenant Isolation Rules

### General Rules

1. **Teacher = Tenant**: Each teacher account represents a tenant
2. **Data Isolation**: Complete data isolation between tenants
3. **Superadmin Bypass**: SUPERADMIN can access all tenant data
4. **Application-Level Enforcement**: Tenant isolation is enforced at the application level, not database level

### Enforcement Points

1. **Middleware**: Checks role before allowing route access
2. **API Routes**: Must check `teacherId` for tenant-scoped resources
3. **Database Queries**: Must filter by `teacherId` (except SUPERADMIN queries)

### Tenant-Scoped Resources

The following resources are tenant-scoped and must filter by `teacherId`:

- **Students**: `User` records where `role = 'STUDENT'` and `teacherId` matches
- **Parents**: `User` records where `role = 'PARENT'` linked via `ParentStudent` to students
- **Lessons**: `Lesson` records where `teacherId` matches
- **Topics**: `Topic` records via `Lesson.teacherId`
- **Resources**: `Resource` records via `Topic.Lesson.teacherId`
- **Assignments**: `Assignment` records via `Student.teacherId`
- **Progress Logs**: `ProgressLog` records via `Student.teacherId`

### SUPERADMIN Access

SUPERADMIN bypasses tenant isolation:

- Can query all tenants without `teacherId` filter
- Can access any teacher's data
- Can view all students across all tenants
- Can manage subscriptions for all tenants

## Implementation Details

### Middleware Protection

The `middleware.ts` file enforces route-level RBAC:

- Checks authentication token
- Verifies JWT token signature
- Checks user role against route requirements
- Redirects unauthorized users to role-specific dashboard
- Returns 403 for unauthorized API access

### API Route Protection

API routes use wrapper functions from `lib/api-helpers.ts`:

- `withAuth`: Requires authentication only
- `withRole(role)`: Requires specific role
- `withAnyRole(roles[])`: Requires one of multiple roles

Example:
```typescript
export const GET = withRole(UserRole.TEACHER, async (request, user) => {
  // Handler code
});
```

### Component-Level Protection

**Server Components:**
- Use `getCurrentUser()` from `lib/auth-helpers.ts`
- Use `requireRole(role)` to throw error if role doesn't match
- Use `canAccessTenant(user, targetTeacherId)` for tenant checks

**Client Components:**
- Use `useAuth()` hook from `lib/hooks/useAuth.ts`
- Provides `hasRole(role)`, `hasAnyRole(roles[])`, `canAccessTenant(teacherId)`
- Fetches user data from `/api/auth/me` endpoint

### Tenant Isolation Helpers

**Server-Side:**
- `canAccessTenant(user, targetTeacherId)` - Check if user can access tenant
- `requireTenantAccess(user, targetTeacherId)` - Throw error if cannot access

**Client-Side:**
- `canAccessTenant(targetTeacherId)` - Check if current user can access tenant

## Error Handling

### Unauthorized Access (401)
- **Cause**: Missing or invalid authentication token
- **Response**: `{ error: "Authentication required" }`
- **Action**: Redirect to `/login` (pages) or return 401 (API)

### Forbidden Access (403)
- **Cause**: User authenticated but lacks required role
- **Response**: `{ error: "Access denied: insufficient permissions" }`
- **Action**: Redirect to role-specific dashboard (pages) or return 403 (API)

### Tenant Access Denied
- **Cause**: User trying to access another tenant's data
- **Response**: `{ error: "Access denied: insufficient tenant permissions" }`
- **Action**: Return 403 Forbidden

## Testing Checklist

- [ ] Student cannot access `/teacher/dashboard` → redirected to `/student/dashboard`
- [ ] Teacher cannot access `/admin/dashboard` → redirected to `/teacher/dashboard`
- [ ] SUPERADMIN can access all routes (`/admin/*`, `/teacher/*`, `/student/*`, `/parent/*`)
- [ ] API endpoint with `withRole(TEACHER)` blocks Student → returns 403
- [ ] API endpoint with `withAnyRole([TEACHER, SUPERADMIN])` allows both roles
- [ ] Teacher A cannot access Teacher B's student data → returns 403
- [ ] SUPERADMIN can access all tenant data → allowed
- [ ] Component-level role checks render/hide appropriately
- [ ] Error messages are user-friendly and appropriate

## References

- [Architecture Documentation](./architecture.md#Authentication)
- [Tenant Isolation Strategy](./tenant-isolation-strategy.md)
- [Tech Spec Epic 1](./stories/tech-spec-epic-1.md#Workflows-and-Sequencing)

