# Migration Workflow Documentation

## Prisma Migration System

The project uses Prisma migrations for database schema management.

### Migration Commands

**Development:**
- `npm run db:migrate` - Create and apply a new migration (interactive)
- `npx prisma migrate dev --name <migration-name>` - Create migration with custom name
- `npx prisma migrate reset` - Reset database and apply all migrations

**Production (Railway):**
- Migrations run automatically via `scripts/postbuild.sh` after build
- Uses `npx prisma migrate deploy` to apply pending migrations
- Railway executes postbuild script automatically during deployment
- No manual migration steps required - Railway handles it via postbuild hook

### Migration Files

- Location: `prisma/migrations/`
- Format: `YYYYMMDDHHMMSS_<name>/migration.sql`
- Lock file: `prisma/migrations/migration_lock.toml`

### Workflow

1. **Modify Schema:** Edit `prisma/schema.prisma`
2. **Create Migration:** Run `npm run db:migrate` or `npx prisma migrate dev --name <name>`
3. **Review:** Check generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`
4. **Apply:** Migration is automatically applied in development
5. **Deploy:** Production deployments run `prisma migrate deploy` via `scripts/postbuild.sh`

### Railway Deployment

**How it works:**
1. Railway detects the project (via `railway.json` or auto-detection)
2. Railway builds the application using Nixpacks (configured in `nixpacks.toml`)
3. Build phase runs: `npm run db:generate` (generates Prisma Client) → `npm run build`
4. Railway executes post-build hook: `scripts/postbuild.sh` (configured in `railway.json`)
5. Post-build script checks for `DATABASE_URL` environment variable
6. If `DATABASE_URL` is set, runs `npx prisma migrate deploy`
7. Migrations are applied to Railway's PostgreSQL database
8. Application starts with `npm start` and up-to-date schema

**Railway Configuration:**
- `railway.json`: Defines build command including postbuild script
- `nixpacks.toml`: Defines Nixpacks build phases (db:generate, build)
- `scripts/postbuild.sh`: Railway post-build hook that runs migrations

**Important Notes:**
- Railway automatically provides `DATABASE_URL` when PostgreSQL service is connected
- Post-build script handles migration failures gracefully (warns but doesn't block deployment)
- Migrations run in production mode (no interactive prompts)
- **Always test migrations locally before deploying to Railway**
- Railway uses Nixpacks builder by default (configured in `railway.json`)

### Current Status

- Initial migration: `20251122124808_init` - Contains all core models and indexes
- Migration system: Configured and functional
- Railway deployment: `scripts/postbuild.sh` automatically runs migrations on deploy
- Post-build script: Located at `scripts/postbuild.sh`, handles Railway production migrations

