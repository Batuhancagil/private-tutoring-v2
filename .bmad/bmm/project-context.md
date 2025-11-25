# Project Context: Git, Railway, and Railway DB

## Critical Project Information

This document provides essential context about the project's infrastructure and deployment setup that ALL agents must understand.

### Version Control: Git

- **Repository**: This project uses Git for version control
- **Branch Strategy**: Work on feature branches, merge to master/main
- **Commit Strategy**: 
  - Commit after completing each story/task
  - Use descriptive commit messages: "feat: [story-id] [description]"
  - Push changes to remote repository after story completion
- **Git Workflow**: 
  - After completing a story: `git add .`, `git commit -m "message"`, `git push`
  - Always check git status before committing
  - Never commit sensitive data (API keys, passwords)

### Deployment Platform: Railway

- **Platform**: Railway.app
- **Build System**: Nixpacks (configured in `nixpacks.toml`)
- **Configuration**: `railway.json` defines build and deploy commands
- **Build Process**:
  1. Railway detects project via `railway.json` or auto-detection
  2. Build phase: `npm run db:generate` → `npm run build`
  3. Post-build hook: `scripts/postbuild.sh` runs automatically
  4. Start command: `npm start`
- **Environment Variables**: Railway provides `DATABASE_URL` automatically when PostgreSQL service is connected
- **Deployment**: Automatic on git push to main/master branch (if configured)

### Database: Railway PostgreSQL

- **Database Provider**: Railway PostgreSQL service
- **ORM**: Prisma
- **Schema Location**: `prisma/schema.prisma`
- **Migrations**: 
  - Location: `prisma/migrations/`
  - Development: `npm run db:migrate` or `npx prisma migrate dev --name <name>`
  - Production: Automatically handled by `scripts/postbuild.sh` via `npx prisma migrate deploy`
- **Migration Workflow**:
  1. Modify `prisma/schema.prisma`
  2. Create migration: `npx prisma migrate dev --name <migration-name>`
  3. Review generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`
  4. Test locally
  5. Push to git - Railway will automatically run migrations on deploy via postbuild.sh
- **CRITICAL**: When schema changes are made, developers MUST:
  - Create migration locally
  - Test migration locally
  - Inform user that Railway DB migration will run automatically on next deployment
  - Document any manual intervention needed

### Post-Build Script

- **Location**: `scripts/postbuild.sh`
- **Purpose**: Runs Prisma migrations on Railway after build completes
- **Process**:
  1. Checks for `DATABASE_URL` environment variable
  2. Runs `npx prisma migrate deploy` if DATABASE_URL is set
  3. Continues deployment even if migration fails (with warning)
- **Note**: This script runs automatically on every Railway deployment

### Agent Responsibilities

**All Agents Must:**
- Understand that changes are tracked in Git
- Know that Railway handles deployments automatically
- Be aware that Railway DB migrations run via postbuild.sh
- Consider Railway environment when suggesting changes

**Dev Agent Specifically:**
- Push changes to git after completing each story
- Check for Prisma schema changes and create migrations
- Inform user when migrations are needed for Railway DB
- Test migrations locally before pushing

**Build Error Agent:**
- Check Railway deployment logs when analyzing errors
- Consider Prisma migration status
- Verify Railway environment variables are set correctly

### Common Commands

```bash
# Git operations
git status
git add .
git commit -m "feat: [story-id] description"
git push

# Prisma migrations
npx prisma migrate dev --name migration_name
npx prisma migrate deploy  # Production (runs automatically on Railway)

# Railway (if CLI installed)
railway status
railway logs
```

### Important Notes

1. **Never commit without testing**: Always test changes locally before committing
2. **Migration awareness**: Schema changes require migrations - Railway handles this automatically
3. **Environment variables**: Railway provides DATABASE_URL automatically
4. **Post-build hook**: Migrations run automatically on Railway deployments
5. **Error handling**: If migration fails on Railway, check postbuild.sh logs

