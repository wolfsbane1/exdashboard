import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const { Pool } = pg;

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'require', 'required'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number) {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const pool = new Pool({
  host: process.env.EXDASH_DB_HOST,
  port: parseInteger(process.env.EXDASH_DB_PORT, 5432),
  database: process.env.EXDASH_DB_DATABASE,
  user: process.env.EXDASH_DB_USER,
  password: process.env.EXDASH_DB_PASSWORD,
  ssl: parseBoolean(process.env.EXDASH_DB_SSL, false)
    ? { rejectUnauthorized: parseBoolean(process.env.EXDASH_DB_SSL_REJECT_UNAUTHORIZED, true) }
    : false,
});

await migrate(drizzle(pool), { migrationsFolder: './server/db/migrations' });
await pool.end();

console.log('exDASH metadata database migrations applied.');
