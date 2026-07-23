import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const root = resolve(new URL("..", import.meta.url).pathname);
const migrationsDir = resolve(root, "migrations");
const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
const pool = new Pool({ connectionString: databaseUrl, max: 1, application_name: "persistent-self-migrations" });

try {
  for (const file of files) {
    const sql = await readFile(resolve(migrationsDir, file), "utf8");
    const noTransaction = sql.trimStart().startsWith("-- no-transaction");
    const client = await pool.connect();
    try {
      if (!noTransaction) await client.query("BEGIN");
      await client.query(sql);
      if (!noTransaction) await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      if (!noTransaction) await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
