/**
 * Roll back a category migration from its JSON backup.
 *
 *   npx tsx scripts/rollback-category-migration.ts backups/category-migration-....json
 *   npx tsx scripts/rollback-category-migration.ts backups/...json --apply
 *
 * Dry run by default. Restores every category in the backup and deletes only
 * categories created by the migration (ids beginning with `category-`). User
 * categories created after the migration are listed but left untouched.
 */
import { config as loadDotenv } from "dotenv";
import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

loadDotenv({ path: [".env.local", ".env"] });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";
const apply = process.argv.includes("--apply");
const backupPath = process.argv.find((arg) => arg.endsWith(".json"));

if (!projectId) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set.");
  process.exit(1);
}
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is required for rollback.");
  process.exit(1);
}
if (!backupPath) {
  console.error("Usage: npx tsx scripts/rollback-category-migration.ts <backup.json> [--apply]");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  token,
});

type BackupCategory = {
  _id: string;
  _type?: string;
  name?: string;
  slug?: { current?: string } | null;
  parent?: { _ref?: string } | null;
  level?: string | null;
  isActive?: boolean | null;
  order?: number | null;
  _rev?: string;
  _createdAt?: string;
  _updatedAt?: string;
};

async function main() {
  const backup = JSON.parse(await readFile(backupPath as string, "utf8")) as {
    generatedAt?: string;
    categories?: BackupCategory[];
  };

  if (!Array.isArray(backup.categories)) {
    console.error("The backup file does not contain a categories array.");
    process.exit(1);
  }

  const current = await client.fetch<Array<{ _id: string; name?: string }>>(
    `*[_type == "category"]{_id, name}`,
  );

  const backupIds = new Set(backup.categories.map((category) => category._id));
  const toCreateOrRestore = backup.categories;
  // Migration ids are deterministic (`category-` + 24 hex chars). Admin-created
  // ids use UUIDs, so they are not swept up by a rollback.
  const isMigrationCreated = (id: string) =>
    /^category-[a-f0-9]{24}$/.test(id.replace(/^drafts\./, ""));
  const toDelete = current.filter(
    (category) => !backupIds.has(category._id) && isMigrationCreated(category._id),
  );
  const untouched = current.filter(
    (category) => !backupIds.has(category._id) && !isMigrationCreated(category._id),
  );

  console.log(`Backup: ${backupPath} (${backup.categories.length} categories)`);
  console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`Restore/create: ${toCreateOrRestore.length}`);
  console.log(`Delete migration-created: ${toDelete.length}`);
  console.log(`Left untouched (not in backup, not migration-created): ${untouched.length}`);

  for (const category of toDelete) {
    console.log(`  delete ${category._id} ${category.name ?? ""}`);
  }
  for (const category of untouched) {
    console.log(`  keep   ${category._id} ${category.name ?? ""}`);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to restore the backup.");
    return;
  }

  const transaction = client.transaction();
  for (const category of toCreateOrRestore) {
    const document = { ...category };
    // System metadata is managed by Sanity and rejected on writes.
    delete document._rev;
    delete document._createdAt;
    delete document._updatedAt;
    transaction.createOrReplace({
      ...document,
      _type: category._type ?? "category",
    });
  }
  for (const category of toDelete) {
    transaction.delete(category._id);
  }
  await transaction.commit();

  console.log(`Rollback applied: ${toCreateOrRestore.length} restored, ${toDelete.length} deleted.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
