/**
 * Applies every SQL migration in database/migrations in filename order.
 *
 *   npm run db:migrate
 *
 * Each file runs inside a transaction and is recorded in schema_migrations so
 * it is never applied twice. Existing databases are safe to migrate: every
 * migration uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 */

import { config as loadDotenv } from "dotenv";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

loadDotenv({ path: [".env.local", ".env"] });

async function main() {
  const connectionString =
    process.env.DATABASE_MIGRATION_URL?.trim() ||
    process.env.DIRECT_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Set DATABASE_MIGRATION_URL, DIRECT_URL, or DATABASE_URL before migrating.");
  }

  const migrationsDir = path.join(process.cwd(), "database", "migrations");
  const pool = new Pool({ connectionString, max: 1 });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migrations found.");
    }

    for (const file of files) {
      const applied = await pool.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [file],
      );
      if (applied.rowCount) {
        console.log(`skip    ${file}`);
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file],
        );
        await client.query("COMMIT");
        console.log(`applied ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    console.log("Migrations complete.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
