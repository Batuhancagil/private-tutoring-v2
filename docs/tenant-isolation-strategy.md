# Multi-Tenant Isolation Strategy

## Tenant Model
**Tenant = Teacher Account**

The multi-tenant architecture uses a `teacherId` foreign key pattern where each tenant (teacher) has isolated data.

## Tenant Isolation Patterns

### Direct Tenant Linkage
- **User (Students/Parents):** `teacherId` field directly links to Teacher User
- **Lesson:** `teacherId` field (nullable - null = global/pre-built, non-null = teacher-specific)
- **Subscription:** `teacherId` field (one-to-one with Teacher)

### Inherited Tenant Linkage
- **Assignment:** Inherits tenant via `studentId` → User.teacherId
- **ProgressLog:** Inherits tenant via `studentId` → User.teacherId
- **ParentStudent:** Links parents to students, inheriting tenant from student

### Global Resources
- **Lesson:** `teacherId` null = pre-built (global), non-null = teacher-specific
- **Topic, Resource:** Inherit from Lesson (can be global or tenant-specific)

## Superadmin Access
- Superadmin role bypasses tenant isolation
- Can access all tenants for subscription management
- Application-level checks required (not enforced at database level)

## Database-Level Enforcement
- Foreign key constraints enforce referential integrity
- Indexes on `teacherId` enable efficient tenant-scoped queries
- Unique constraints prevent data conflicts

## Application-Level Enforcement
- Middleware and API helpers enforce tenant isolation in queries
- All tenant-scoped queries must filter by `teacherId` (except Superadmin)
- Pattern: `where: { teacherId: user.teacherId }` for tenant-scoped data

