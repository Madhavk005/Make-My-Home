# Deployment

## Production database
1. Back up the local database:
   npm run backup:db
2. Create a PostgreSQL database on an online provider (Neon, Supabase, Railway, or Hostinger Postgres).
3. Set `DATABASE_URL` to the provider connection string.
4. Run the migration:
   psql "$DATABASE_URL" -f database/migrations/001_create_enquiries.sql
5. Run Better Auth migration if needed.

## Hostinger compatibility
- Ensure the plan supports Node.js 20+ and Next.js 16 server-side rendering and API routes.
- Use `npm run build` and `npm run start` (Node server), not static export.
- Set all environment variables in the hosting panel.

## Staging
- Use `.env.staging` as a template.
- Deploy to a separate staging URL and database.