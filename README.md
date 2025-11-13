# Private Tutoring Dashboard Platform

A private tutoring dashboard platform that replaces Excel-based student progress tracking with intelligent daily question logging and visual timeline-based assignment management.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma)
- **Styling:** Tailwind CSS
- **Deployment:** Railway

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL (or use Railway's PostgreSQL service)
- npm or yarn

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your `DATABASE_URL` and `JWT_SECRET`

3. **Set up database:**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Railway Deployment

### Initial Setup

1. **Install Railway CLI** (optional but recommended):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway project:**
   ```bash
   railway init
   ```

4. **Add PostgreSQL service:**
   - Go to Railway dashboard
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable

5. **Set environment variables:**
   ```bash
   railway variables set JWT_SECRET="your-random-secret-key"
   railway variables set NODE_ENV="production"
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

   Or connect your GitHub repo to Railway for automatic deployments.

### Database Migrations on Railway

After deployment, run migrations:

```bash
railway run npm run db:push
```

Or use Railway's web interface to run commands.

## Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions
├── prisma/          # Prisma schema and migrations
├── public/          # Static assets
└── docs/            # Documentation (PRD, epics, etc.)
```

## Database Schema

The database uses Prisma ORM with PostgreSQL. Key models:

- **User** - All users (Superadmin, Teacher, Student, Parent)
- **Lesson/Topic/Resource** - Educational content hierarchy
- **Assignment** - Student assignments with timeline
- **ProgressLog** - Daily question logging (right/wrong/empty)
- **Subscription** - Teacher subscription management
- **Message** - Communication between users

See `prisma/schema.prisma` for full schema.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-set by Railway)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Next Steps

1. ✅ Project structure initialized
2. ✅ Database schema configured
3. ✅ Railway deployment ready
4. 🔄 Implement authentication (Epic 1)
5. 🔄 Build user management (Epic 2)
6. 🔄 Create timeline system (Epic 3)
7. 🔄 Add daily logging (Epic 4)
8. 🔄 Implement progress tracking (Epic 5)
9. 🔄 Build teacher dashboard (Epic 6)
10. 🔄 Create parent portal (Epic 7)

See `docs/epics.md` for detailed implementation plan.

## Documentation

- [Product Requirements Document](./docs/PRD.md)
- [Epic Breakdown](./docs/epics.md)
- [Product Brief](./docs/product-brief-private-tutoring-v2-2025-11-13.md)

## License

Private project - All rights reserved

