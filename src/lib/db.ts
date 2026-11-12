import "server-only";
import { Pool } from "pg";

const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

// Next.js evaluates every route module while building the app. Runtime
// credentials such as DATABASE_URL are supplied to the running container, not
// to the build, so only fail fast once the app is actually serving requests.
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!process.env.DATABASE_URL && !isProductionBuild) {
  throw new Error("DATABASE_URL is not configured");
}

const configuredPoolMax = process.env.PG_POOL_MAX?.trim();
const poolMax = configuredPoolMax
  ? Number(configuredPoolMax)
  : process.env.VERCEL
    ? 1
    : 10;

if (!Number.isInteger(poolMax) || poolMax < 1) {
  throw new Error("PG_POOL_MAX must be a positive integer.");
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: poolMax,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
