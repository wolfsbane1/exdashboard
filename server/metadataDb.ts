import pg from 'pg';
import type { Pool as PgPool } from 'pg';
import type { DashboardStore, ScenarioStore } from './types';

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
let initialized = false;

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

function getMissingKeys(config: MetadataDbConfig) {
  const required = ['EXDASH_DB_HOST', 'EXDASH_DB_DATABASE', 'EXDASH_DB_USER', 'EXDASH_DB_PASSWORD'] as const;
  return required.filter((key) => !process.env[key]);
}

function getPool() {
  const config = getConfig();
  const missing = getMissingKeys(config);
  if (missing.length > 0) {
    throw new Error(`exDASH metadata database is not configured. Missing: ${missing.join(', ')}`);
  }

  if (!pool) {
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

async function ensureMetadataSchema() {
  if (initialized) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS dashboard_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL,
      widgets JSONB NOT NULL DEFAULT '[]',
      filters JSONB NOT NULL DEFAULT '{}',
      visibility TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'System',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS saved_dashboards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL,
      widgets JSONB NOT NULL DEFAULT '[]',
      filters JSONB NOT NULL DEFAULT '{}',
      visibility TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'current-user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS financial_scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      baseline_scope TEXT NOT NULL,
      office_name TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      assumptions JSONB NOT NULL DEFAULT '[]',
      projected_results JSONB,
      baseline_data JSONB,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      created_by TEXT NOT NULL DEFAULT 'current-user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  initialized = true;
}

function toDashboard(row: any): DashboardStore {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    scope: row.scope,
    widgets: row.widgets || [],
    filters: row.filters || {},
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function toScenario(row: any): ScenarioStore {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    baselineScope: row.baseline_scope,
    officeName: row.office_name,
    fiscalYear: row.fiscal_year,
    assumptions: row.assumptions || [],
    projectedResults: row.projected_results || null,
    baselineData: row.baseline_data || null,
    status: row.status,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function checkMetadataDbConnection() {
  try {
    const config = getConfig();
    const missing = getMissingKeys(config);
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
  await ensureMetadataSchema();
  const db = getPool();
  for (const template of templates) {
    await db.query(
      `INSERT INTO dashboard_templates (
        id, name, description, scope, widgets, filters, visibility, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING`,
      [
        template.id,
        template.name,
        template.description,
        template.scope,
        JSON.stringify(template.widgets),
        JSON.stringify(template.filters),
        template.visibility,
        template.createdBy,
        template.createdAt,
        template.updatedAt,
      ]
    );
  }
}

export async function listDashboardTemplates() {
  await ensureMetadataSchema();
  const result = await getPool().query('SELECT * FROM dashboard_templates ORDER BY created_at, name');
  return result.rows.map(toDashboard);
}

export async function createDashboard(dashboard: DashboardStore) {
  await ensureMetadataSchema();
  const result = await getPool().query(
    `INSERT INTO saved_dashboards (
      id, name, description, scope, widgets, filters, visibility, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10)
    RETURNING *`,
    [
      dashboard.id,
      dashboard.name,
      dashboard.description,
      dashboard.scope,
      JSON.stringify(dashboard.widgets),
      JSON.stringify(dashboard.filters),
      dashboard.visibility,
      dashboard.createdBy,
      dashboard.createdAt,
      dashboard.updatedAt,
    ]
  );
  return toDashboard(result.rows[0]);
}

export async function listDashboards() {
  await ensureMetadataSchema();
  const result = await getPool().query('SELECT * FROM saved_dashboards ORDER BY updated_at DESC');
  return result.rows.map(toDashboard);
}

export async function updateDashboard(id: string, changes: Partial<DashboardStore>) {
  await ensureMetadataSchema();
  const current = await getPool().query('SELECT * FROM saved_dashboards WHERE id = $1', [id]);
  if (current.rowCount === 0) return null;

  const next = { ...toDashboard(current.rows[0]), ...changes, id, updatedAt: new Date().toISOString() };
  const result = await getPool().query(
    `UPDATE saved_dashboards SET
      name = $2,
      description = $3,
      scope = $4,
      widgets = $5::jsonb,
      filters = $6::jsonb,
      visibility = $7,
      created_by = $8,
      updated_at = $9
    WHERE id = $1
    RETURNING *`,
    [
      id,
      next.name,
      next.description,
      next.scope,
      JSON.stringify(next.widgets),
      JSON.stringify(next.filters),
      next.visibility,
      next.createdBy,
      next.updatedAt,
    ]
  );
  return toDashboard(result.rows[0]);
}

export async function deleteDashboard(id: string) {
  await ensureMetadataSchema();
  const result = await getPool().query('DELETE FROM saved_dashboards WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function createScenario(scenario: ScenarioStore) {
  await ensureMetadataSchema();
  const result = await getPool().query(
    `INSERT INTO financial_scenarios (
      id, name, description, baseline_scope, office_name, fiscal_year, assumptions,
      projected_results, baseline_data, status, created_by, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12)
    RETURNING *`,
    [
      scenario.id,
      scenario.name,
      scenario.description,
      scenario.baselineScope,
      scenario.officeName,
      scenario.fiscalYear,
      JSON.stringify(scenario.assumptions),
      JSON.stringify(scenario.projectedResults),
      JSON.stringify(scenario.baselineData),
      scenario.status,
      scenario.createdBy,
      scenario.createdAt,
    ]
  );
  return toScenario(result.rows[0]);
}

export async function listScenarios() {
  await ensureMetadataSchema();
  const result = await getPool().query('SELECT * FROM financial_scenarios ORDER BY created_at DESC');
  return result.rows.map(toScenario);
}

export async function getScenario(id: string) {
  await ensureMetadataSchema();
  const result = await getPool().query('SELECT * FROM financial_scenarios WHERE id = $1', [id]);
  return result.rows[0] ? toScenario(result.rows[0]) : null;
}

export async function saveScenario(scenario: ScenarioStore) {
  await ensureMetadataSchema();
  const result = await getPool().query(
    `UPDATE financial_scenarios SET
      name = $2,
      description = $3,
      baseline_scope = $4,
      office_name = $5,
      fiscal_year = $6,
      assumptions = $7::jsonb,
      projected_results = $8::jsonb,
      baseline_data = $9::jsonb,
      status = $10,
      created_by = $11
    WHERE id = $1
    RETURNING *`,
    [
      scenario.id,
      scenario.name,
      scenario.description,
      scenario.baselineScope,
      scenario.officeName,
      scenario.fiscalYear,
      JSON.stringify(scenario.assumptions),
      JSON.stringify(scenario.projectedResults),
      JSON.stringify(scenario.baselineData),
      scenario.status,
      scenario.createdBy,
    ]
  );
  return result.rows[0] ? toScenario(result.rows[0]) : null;
}

export async function listScenariosByIds(ids: string[]) {
  await ensureMetadataSchema();
  if (ids.length === 0) return [];
  const result = await getPool().query('SELECT * FROM financial_scenarios WHERE id = ANY($1::text[])', [ids]);
  return result.rows.map(toScenario);
}
