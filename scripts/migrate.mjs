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

function splitStatements(sql) {
  const withoutDirective = sql.replace(/^\s*--\s*no-transaction\s*(?:\r?\n|$)/i, "");

  return withoutDirective
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

try {
  for (const file of files) {
    const sql = await readFile(resolve(migrationsDir, file), "utf8");
    const noTransaction = sql.trimStart().startsWith("-- no-transaction");
    const client = await pool.connect();
    try {
      if (noTransaction) {
        for (const statement of splitStatements(sql)) {
          await client.query(statement);
        }
      } else {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
      }
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
