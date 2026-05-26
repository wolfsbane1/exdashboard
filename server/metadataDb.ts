import pg from 'pg';
import type { Pool as PgPool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { DashboardStore, ScenarioStore } from './types';
import * as schema from './db/schema';
import { dashboardTemplates, financialScenarios, savedDashboards } from './db/schema';

const { Pool } = pg;

type MetadataDbConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  poolMax: number;
};

let pool: PgPool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'require', 'required'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number) {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getConfig(): MetadataDbConfig {
  const sslEnabled = parseBoolean(process.env.EXDASH_DB_SSL, false);
  return {
    host: process.env.EXDASH_DB_HOST || '',
    port: parseInteger(process.env.EXDASH_DB_PORT, 5432),
    database: process.env.EXDASH_DB_DATABASE || '',
    user: process.env.EXDASH_DB_USER || '',
    password: process.env.EXDASH_DB_PASSWORD || '',
    ssl: sslEnabled
      ? { rejectUnauthorized: parseBoolean(process.env.EXDASH_DB_SSL_REJECT_UNAUTHORIZED, true) }
      : false,
    poolMax: parseInteger(process.env.EXDASH_DB_POOL_MAX, 10),
  };
}

function getMissingKeys() {
  const required = ['EXDASH_DB_HOST', 'EXDASH_DB_DATABASE', 'EXDASH_DB_USER', 'EXDASH_DB_PASSWORD'] as const;
  return required.filter((key) => !process.env[key]);
}

function getPool() {
  const missing = getMissingKeys();
  if (missing.length > 0) {
    throw new Error(`exDASH metadata database is not configured. Missing: ${missing.join(', ')}`);
  }

  if (!pool) {
    const config = getConfig();
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.poolMax,
    });
  }
  return pool;
}

function getDb() {
  if (!db) {
    db = drizzle(getPool(), { schema });
  }
  return db;
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDashboard(row: typeof dashboardTemplates.$inferSelect | typeof savedDashboards.$inferSelect): DashboardStore {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    scope: row.scope,
    widgets: row.widgets || [],
    filters: row.filters || {},
    visibility: row.visibility,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function toScenario(row: typeof financialScenarios.$inferSelect): ScenarioStore {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    baselineScope: row.baselineScope,
    officeName: row.officeName,
    fiscalYear: row.fiscalYear,
    assumptions: row.assumptions || [],
    projectedResults: row.projectedResults || null,
    baselineData: row.baselineData || null,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
  };
}

export async function checkMetadataDbConnection() {
  try {
    const config = getConfig();
    const missing = getMissingKeys();
    if (missing.length > 0) {
      return { configured: false, ready: false, missing };
    }
    const result = await getPool().query<{ ok: number; server_time: Date }>('SELECT 1 AS ok, NOW() AS server_time');
    return {
      configured: true,
      ready: result.rows[0]?.ok === 1,
      missing: [],
      database: config.database,
      host: config.host,
      port: config.port,
      serverTime: result.rows[0]?.server_time?.toISOString(),
    };
  } catch (error) {
    return {
      configured: true,
      ready: false,
      missing: [],
      error: error instanceof Error ? error.message : 'Unknown metadata DB error',
    };
  }
}

export async function seedDashboardTemplates(templates: DashboardStore[]) {
  for (const template of templates) {
    await getDb()
      .insert(dashboardTemplates)
      .values({
        id: template.id,
        name: template.name,
        description: template.description,
        scope: template.scope,
        widgets: template.widgets,
        filters: template.filters,
        visibility: template.visibility,
        createdBy: template.createdBy,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt),
      })
      .onConflictDoNothing({ target: dashboardTemplates.id });
  }
}

export async function listDashboardTemplates() {
  const rows = await getDb()
    .select()
    .from(dashboardTemplates)
    .orderBy(asc(dashboardTemplates.createdAt), asc(dashboardTemplates.name));
  return rows.map(toDashboard);
}

export async function createDashboard(dashboard: DashboardStore) {
  const rows = await getDb()
    .insert(savedDashboards)
    .values({
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      scope: dashboard.scope,
      widgets: dashboard.widgets,
      filters: dashboard.filters,
      visibility: dashboard.visibility,
      createdBy: dashboard.createdBy,
      createdAt: new Date(dashboard.createdAt),
      updatedAt: new Date(dashboard.updatedAt),
    })
    .returning();
  return toDashboard(rows[0]);
}

export async function listDashboards() {
  const rows = await getDb().select().from(savedDashboards).orderBy(desc(savedDashboards.updatedAt));
  return rows.map(toDashboard);
}

export async function updateDashboard(id: string, changes: Partial<DashboardStore>) {
  const current = await getDb().select().from(savedDashboards).where(eq(savedDashboards.id, id)).limit(1);
  if (current.length === 0) return null;

  const next = { ...toDashboard(current[0]), ...changes, id, updatedAt: new Date().toISOString() };
  const rows = await getDb()
    .update(savedDashboards)
    .set({
      name: next.name,
      description: next.description,
      scope: next.scope,
      widgets: next.widgets,
      filters: next.filters,
      visibility: next.visibility,
      createdBy: next.createdBy,
      updatedAt: new Date(next.updatedAt),
    })
    .where(eq(savedDashboards.id, id))
    .returning();
  return toDashboard(rows[0]);
}

export async function deleteDashboard(id: string) {
  const rows = await getDb().delete(savedDashboards).where(eq(savedDashboards.id, id)).returning({ id: savedDashboards.id });
  return rows.length > 0;
}

export async function createScenario(scenario: ScenarioStore) {
  const rows = await getDb()
    .insert(financialScenarios)
    .values({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      baselineScope: scenario.baselineScope,
      officeName: scenario.officeName,
      fiscalYear: scenario.fiscalYear,
      assumptions: scenario.assumptions,
      projectedResults: scenario.projectedResults,
      baselineData: scenario.baselineData,
      status: scenario.status,
      createdBy: scenario.createdBy,
      createdAt: new Date(scenario.createdAt),
    })
    .returning();
  return toScenario(rows[0]);
}

export async function listScenarios() {
  const rows = await getDb().select().from(financialScenarios).orderBy(desc(financialScenarios.createdAt));
  return rows.map(toScenario);
}

export async function getScenario(id: string) {
  const rows = await getDb().select().from(financialScenarios).where(eq(financialScenarios.id, id)).limit(1);
  return rows[0] ? toScenario(rows[0]) : null;
}

export async function saveScenario(scenario: ScenarioStore) {
  const rows = await getDb()
    .update(financialScenarios)
    .set({
      name: scenario.name,
      description: scenario.description,
      baselineScope: scenario.baselineScope,
      officeName: scenario.officeName,
      fiscalYear: scenario.fiscalYear,
      assumptions: scenario.assumptions,
      projectedResults: scenario.projectedResults,
      baselineData: scenario.baselineData,
      status: scenario.status,
      createdBy: scenario.createdBy,
    })
    .where(eq(financialScenarios.id, scenario.id))
    .returning();
  return rows[0] ? toScenario(rows[0]) : null;
}

export async function listScenariosByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await getDb().select().from(financialScenarios).where(inArray(financialScenarios.id, ids));
  return rows.map(toScenario);
}
