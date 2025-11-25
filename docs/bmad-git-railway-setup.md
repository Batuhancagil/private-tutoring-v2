# BMAD Git & Railway Setup Documentation

This document describes the Git and Railway integration setup for BMAD agents.

## Overview

All BMAD agents now understand the project's Git workflow, Railway deployment, and Railway DB migration system.

## Components Created

### 1. Build Error Agent
**Location**: `.bmad/bmm/agents/build-error.md`
**Cursor Rule**: `.cursor/rules/bmad/bmm/agents/build-error.mdc`

A specialized agent for analyzing build error logs with Railway and Prisma migration awareness.

**Usage**:
- Activate: `@bmad/bmm/agents/build-error`
- Commands:
  - `*analyze-error` - Analyze provided error logs
  - `*check-migrations` - Check if error is migration-related
  - `*suggest-fix` - Provide fix suggestions

### 2. Project Context File
**Location**: `.bmad/bmm/project-context.md`

Contains essential information about:
- Git workflow and commit strategy
- Railway deployment process
- Railway PostgreSQL database
- Migration workflow
- Agent responsibilities

**Always loaded by**:
- Dev agent (explicitly)
- Build Error agent (explicitly)
- All agents (via `.cursor/rules/project-context.mdc` with `alwaysApply: true`)

### 3. Updated Dev Agent
**Location**: `.bmad/bmm/agents/dev.md`

**New Features**:
- Automatically loads project context on activation
- Checks for Prisma schema changes after story completion
- Informs user about Railway DB migrations
- Pushes changes to Git after story completion
- New command: `*push-changes` - Manual git push

**Git Push Workflow**:
1. After completing a story, dev agent checks for schema changes
2. If schema changed, informs user about migration workflow
3. Automatically pushes changes: `git add .`, `git commit`, `git push`

### 4. Updated Story-Done Workflow
**Location**: `.bmad/bmm/workflows/4-implementation/story-done/instructions.md`

**New Step**: Git push is now part of the story-done workflow:
- Step 3: Push changes to Git
- Step 4: Confirm completion (includes git push status)

### 5. Cursor Commands
**Location**: `.cursor/commands/push-story.md`

Command for manually pushing story changes to Git.

### 6. Cursor Rules
**Location**: `.cursor/rules/project-context.mdc`

Always-applied rule that provides Git/Railway/Railway DB context to all agents.

## Workflow

### Story Completion Flow

1. **Developer completes story** (via `*develop-story`)
   - Implements all tasks
   - Runs tests
   - Completes acceptance criteria

2. **Dev agent checks for migrations**
   - If `prisma/schema.prisma` was modified:
     - Informs user: "⚠️ Database schema changes detected. A migration is needed. Railway DB will automatically run migrations on next deployment via postbuild.sh. Please create migration locally first: `npx prisma migrate dev --name <migration-name>`"

3. **Story marked done** (via `*story-done`)
   - Updates story status to "done"
   - Updates sprint status
   - **Automatically pushes to Git**:
     ```bash
     git add .
     git commit -m "feat: [story-key] story-title - Story completed"
     git push
     ```

4. **Railway deployment**
   - Railway detects push to main/master
   - Builds application
   - Runs `scripts/postbuild.sh`
   - Post-build script runs migrations: `npx prisma migrate deploy`
   - Application starts

### Build Error Analysis Flow

1. **User provides error logs** to Build Error agent
2. **Agent analyzes**:
   - Error type (TypeScript, Prisma, Next.js, Railway)
   - Root cause
   - Railway-specific considerations
   - Migration implications
3. **Agent provides**:
   - Structured analysis
   - Fix suggestions
   - Railway deployment guidance

## Migration Workflow

### When Schema Changes Are Made

1. **Developer modifies** `prisma/schema.prisma`
2. **Dev agent detects** change after story completion
3. **Dev agent informs user**:
   ```
   ⚠️ Database schema changes detected. A migration is needed. 
   Railway DB will automatically run migrations on next deployment 
   via postbuild.sh. Please create migration locally first: 
   npx prisma migrate dev --name <migration-name>
   ```
4. **User creates migration locally**:
   ```bash
   npx prisma migrate dev --name migration_name
   ```
5. **User pushes to Git** (automatic via story-done workflow)
6. **Railway automatically**:
   - Detects push
   - Builds application
   - Runs `scripts/postbuild.sh`
   - Executes `npx prisma migrate deploy`
   - Applies migrations to Railway PostgreSQL

## Agent Awareness

### All Agents Understand

- Git is used for version control
- Railway handles deployments automatically
- Railway DB migrations run via `postbuild.sh`
- Changes must be pushed to Git after completion
- Schema changes require migrations

### Dev Agent Specifically

- Pushes to Git after story completion
- Checks for Prisma schema changes
- Informs user about migration workflow
- Tests migrations locally before pushing

### SM (Scrum Master) Agent Specifically

- Loads project context on activation
- Considers Git/Railway workflow when creating stories
- Reminds developers about migration workflow when stories involve database changes
- Ensures stories account for deployment and migration implications

### Build Error Agent Specifically

- Considers Railway deployment context
- Checks Prisma migration status
- Verifies Railway environment variables
- Provides Railway-specific error analysis

## Commands Reference

### Dev Agent Commands

- `*develop-story` - Implement a story (auto-pushes on completion)
- `*story-done` - Mark story done (includes git push)
- `*push-changes` - Manually push changes to Git
- `*code-review` - Review code before marking done

### Build Error Agent Commands

- `*analyze-error` - Analyze build error logs
- `*check-migrations` - Check migration-related errors
- `*suggest-fix` - Get fix suggestions

### Cursor Commands

- `/push-story` - Push current story changes to Git

## Files Modified/Created

### Created
- `.bmad/bmm/agents/build-error.md`
- `.bmad/bmm/project-context.md`
- `.cursor/rules/bmad/bmm/agents/build-error.mdc`
- `.cursor/rules/project-context.mdc`
- `.cursor/commands/push-story.md`
- `docs/bmad-git-railway-setup.md` (this file)

### Modified
- `.bmad/bmm/agents/dev.md` - Added git push, migration checks, project context
- `.bmad/bmm/agents/sm.md` - Added project context loading, Git/Railway awareness
- `.bmad/bmm/workflows/4-implementation/story-done/instructions.md` - Added git push step

## Testing

To test the setup:

1. **Test Git Push**:
   - Complete a story using dev agent
   - Run `*story-done`
   - Verify git push executes automatically

2. **Test Migration Detection**:
   - Modify `prisma/schema.prisma`
   - Complete a story
   - Verify dev agent informs about migration

3. **Test Build Error Agent**:
   - Provide error logs to build-error agent
   - Verify Railway context is considered
   - Check migration-related error detection

## Notes

- Git push happens automatically in `story-done` workflow
- Migrations run automatically on Railway via `postbuild.sh`
- All agents have access to project context via always-applied rule
- Dev and Build Error agents explicitly load project context for deeper awareness

