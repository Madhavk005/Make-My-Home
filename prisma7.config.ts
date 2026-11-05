import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js uses .env.local. Load it before .env so local secrets stay ignored.
dotenv.config({ path: [".env.local", ".env"] });

const databaseUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_MIGRATION_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Prisma generation does not need a live DB. Database commands require one
  // of the connection variables above to be configured.
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
