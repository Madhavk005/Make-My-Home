# Deployment

## Required production environment

Configure these values in the hosting provider. Do not commit secrets.

- NEXT_PUBLIC_SITE_URL: public HTTPS origin used for canonical metadata, robots, and sitemap.
- DATABASE_URL: hosted PostgreSQL connection string. For Vercel serverless on Supabase, use the Supavisor transaction pooler URL with SSL. The local database is not suitable for deployment.
- DIRECT_URL: session-pooler URL (port 5432) used by Prisma CLI schema operations.
- DATABASE_MIGRATION_URL: optional override for the custom SQL migration runner; otherwise it uses DIRECT_URL.
- BETTER_AUTH_URL: Better Auth origin; use the same public origin as the storefront.
- BETTER_AUTH_SECRET: unique random secret with at least 32 characters.
- ADMIN_EMAILS: comma-separated list of approved administrator email addresses.
- ALLOW_PUBLIC_SIGNUP: false. Public registration is disabled by default.
- NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET: the project and published dataset used by the catalogue.
- NEXT_PUBLIC_SANITY_API_VERSION: API version used by this app.
- SANITY_API_WRITE_TOKEN: optional server-side Editor token used only by CSV imports and the demo seed. The live website and Studio do not need it. Never prefix it with NEXT_PUBLIC_.
- SANITY_REVALIDATE_SECRET: shared secret for the Sanity webhook. Without it, published changes still appear after the cache window, but not instantly.
- Do not set NEXT_PUBLIC_WHATSAPP_NUMBER. The verified business WhatsApp number is read from Sanity Site settings only.

Run npm run env:check -- --production before release. Preview deployments use VERCEL_URL to generate their own origin when NEXT_PUBLIC_SITE_URL is not set. Do not point preview auth or canonical URLs at the production domain.

## Database

1. Create a hosted PostgreSQL database for the target environment.
2. In Supabase, use Connect to copy the transaction-pooler URL for Vercel and set it as DATABASE_URL. Keep SSL enabled.
3. Set DIRECT_URL to the session-pooler URL (port 5432) for Prisma CLI operations. The custom SQL migration runner also uses DIRECT_URL unless DATABASE_MIGRATION_URL is set.
4. Run npm run db:migrate. The runner applies all files in database/migrations in order and records each applied migration.
5. Confirm `schema_migrations` includes migrations 001 through 004. The files are tracked in Git; deploy the commit that contains them before running the migration.

Do not run only 001_create_enquiries.sql: Better Auth, audit logs, and admin enquiry notes also require their migrations.

## Sanity Studio

1. Set the Sanity project ID and dataset in the hosting environment.
2. Add the exact public storefront origin to Sanity CORS and enable **Allow credentials** for Studio sessions. Add the local origins too. Do not use wildcard origins.
3. Open Studio and publish the singleton Site settings document with verified business name, phone, WhatsApp, address, hours, service area, and bilingual copy.
4. Add only the approved category taxonomy, brands, and real product data. The reference taxonomy in CLIENT_HANDOFF.md is not approved for publication.
5. Configure the `/api/revalidate` webhook and secret so published changes refresh the website immediately.

See [SANITY_CMS.md](./SANITY_CMS.md) for the complete CORS, token and webhook checklist. These are dashboard settings and must be applied manually; application code cannot change them.

## Authentication and contact setup

- Keep public sign-up disabled. Add at least one approved email to ADMIN_EMAILS.
- Create the approved admin account through the secured admin provisioning process; never enable public sign-up for account creation.
- Verify sign-in and sign-out on the production origin.
- Test the WhatsApp link with the business number from a real phone.

## Release checks

- npm run typecheck
- npm run lint
- npm run build
- npm run env:check -- --production
- Check /robots.txt and /sitemap.xml use the public HTTPS origin.
- Submit a real enquiry only after the hosted database and business data are configured.
