import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.EXDASH_DB_HOST || 'localhost',
    port: Number(process.env.EXDASH_DB_PORT || 5432),
    database: process.env.EXDASH_DB_DATABASE || 'exdash_metadata',
    user: process.env.EXDASH_DB_USER || 'exdash',
    password: process.env.EXDASH_DB_PASSWORD || 'exdash_dev',
    ssl: process.env.EXDASH_DB_SSL === 'true',
  },
});
