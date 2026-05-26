import pg from 'pg';
import type { Pool as PgPool, PoolConfig, QueryResultRow } from 'pg';
import { readFileSync } from 'node:fs';
import type { FinanceRecord, Office, PAP, UACS } from '../types';
import {
  aggregateRecords,
  filterRecords,
  groupByField,
} from '../financeTransforms';
import {
  getDemoDatasetStatus,
  getDemoFinanceRecords,
} from '../demoDataset';

type QueryParams = Record<string, string | string[] | undefined>;

type FsdsConnectionConfig = {
  driver: string;
  connectionString: string;
  host: string;
  port: number;
  database: string;
  schema: string;
  user: string;
  password: string;
  ssl: boolean | { rejectUnauthorized: boolean; ca?: string };
  poolMax: number;
  connectionTimeoutMillis: number;
  statementTimeoutMillis: number;
  amountScale: number;
};

interface FsdsFinanceRow extends QueryResultRow {
  id: string;
  fiscal_year: number;
  office_code: string;
  office_name: string;
  office_type: 'CENTRAL_OFFICE' | 'REGIONAL_OFFICE';
  region_code: string;
  pap_code: string;
  pap_description: string;
  appropriation_type: string;
  fund_source: string;
  fund_cluster: string;
  uacs_code: string;
  uacs_description: string;
  total_allotment: string | number | null;
  total_modification: string | number | null;
  total_withdrawal: string | number | null;
  total_obligations: string | number | null;
  obligation_balance: string | number | null;
  earmarks: string | number | null;
  disbursement: string | number | null;
  source_module: string;
  last_updated: Date | string | null;
}

interface FsdsOfficeRow extends QueryResultRow {
  code: string;
  name: string;
  type: 'CENTRAL_OFFICE' | 'REGIONAL_OFFICE';
  region_code: string;
}

interface FsdsReferenceRow extends QueryResultRow {
  code: string;
  description: string;
}

class FsdsDatabaseNotConfiguredError extends Error {
  statusCode = 503;
  code = 'FSDS_DATABASE_NOT_CONFIGURED';

  constructor() {
    super(
      'EMPOWERX FSDS database connection is not configured. exDASH does not keep standalone finance data; configure the read-only FSDS database connection before using finance endpoints.'
    );
  }
}

class FsdsDatabaseConfigError extends Error {
  statusCode = 503;
  code = 'FSDS_DATABASE_CONFIG_INVALID';
}

class FsdsDatabaseAdapterMissingError extends Error {
  statusCode = 501;
  code = 'FSDS_DATABASE_ADAPTER_MISSING';

  constructor(driver: string) {
    super(
      `EMPOWERX FSDS database driver "${driver}" is configured, but exDASH currently supports the PostgreSQL FSDS connector. Set FSDS_DB_DRIVER=postgres.`
    );
  }
}

let fsdsPool: PgPool | null = null;
let fsdsPoolKey = '';

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'require', 'required'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number) {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getConnectionConfig(): FsdsConnectionConfig {
  const connectionString = process.env.FSDS_DB_CONNECTION_STRING || '';
  const sslEnabled = parseBoolean(process.env.FSDS_DB_SSL, false);
  const sslCa = process.env.FSDS_DB_SSL_CA
    || (process.env.FSDS_DB_SSL_CA_FILE ? readFileSync(process.env.FSDS_DB_SSL_CA_FILE, 'utf8') : undefined);
  return {
    driver: process.env.FSDS_DB_DRIVER || (connectionString ? 'postgres' : ''),
    connectionString,
    host: process.env.FSDS_DB_HOST || '',
    port: parseInteger(process.env.FSDS_DB_PORT, 5432),
    database: process.env.FSDS_DB_DATABASE || '',
    schema: process.env.FSDS_DB_SCHEMA || 'public',
    user: process.env.FSDS_DB_USER || '',
    password: process.env.FSDS_DB_PASSWORD || '',
    ssl: sslEnabled
      ? {
          rejectUnauthorized: parseBoolean(process.env.FSDS_DB_SSL_REJECT_UNAUTHORIZED, true),
          ...(sslCa ? { ca: sslCa } : {}),
        }
      : false,
    poolMax: parseInteger(process.env.FSDS_DB_POOL_MAX, 10),
    connectionTimeoutMillis: parseInteger(process.env.FSDS_DB_CONNECTION_TIMEOUT_MS, 10000),
    statementTimeoutMillis: parseInteger(process.env.FSDS_DB_STATEMENT_TIMEOUT_MS, 30000),
    amountScale: parseNumber(process.env.FSDS_DB_AMOUNT_SCALE, 100),
  };
}

export async function checkFsdsDatabaseConnection() {
  try {
    const config = getConfiguredFsdsConnection();
    if (!isSupportedDriver(config.driver)) {
      throw new FsdsDatabaseAdapterMissingError(config.driver || 'not_configured');
    }

    const result = await getPool(config).query<{ ok: number; server_time: Date }>(
      'SELECT 1 AS ok, NOW() AS server_time'
    );

    return {
      ready: result.rows[0]?.ok === 1,
      checkedAt: new Date().toISOString(),
      serverTime: normalizeTimestamp(result.rows[0]?.server_time),
      database: config.database || 'connection_string',
      schema: config.schema,
      host: config.host || 'connection_string',
      port: config.port,
    };
  } catch (error) {
    return {
      ready: false,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown FSDS database readiness error',
    };
  }
}

function getMissingConnectionKeys(config: FsdsConnectionConfig) {
  if (config.connectionString) {
    return config.driver ? [] : ['FSDS_DB_DRIVER'];
  }

  const requiredConnectionKeys = [
    'FSDS_DB_DRIVER',
    'FSDS_DB_HOST',
    'FSDS_DB_DATABASE',
    'FSDS_DB_SCHEMA',
    'FSDS_DB_USER',
  ] as const;

  return requiredConnectionKeys.filter((key) => !process.env[key]);
}

function isSupportedDriver(driver: string) {
  return ['postgres', 'postgresql'].includes(driver.toLowerCase());
}

export function getFsdsConnectionStatus() {
  const config = getConnectionConfig();
  const missing = getMissingConnectionKeys(config);
  const demoDataset = getDemoDatasetStatus();
  return {
    mode: demoDataset.loaded ? 'DEMO_SAMPLE_DATA' : 'FSDS_ONLY',
    configured: missing.length === 0,
    missing,
    driver: config.driver || 'not_configured',
    host: config.host || 'not_configured',
    port: config.port,
    database: config.database || (config.connectionString ? 'connection_string' : 'not_configured'),
    schema: config.schema || 'not_configured',
    ssl: Boolean(config.ssl),
    supportedDriver: config.driver ? isSupportedDriver(config.driver) : false,
    financeDataStoredInExdash: false,
    demoDataset,
  };
}

function quoteIdentifier(identifier: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new FsdsDatabaseConfigError(
      `Invalid PostgreSQL schema identifier "${identifier}". Use a simple schema name such as public or finance.`
    );
  }
  return `"${identifier}"`;
}

function getConfiguredFsdsConnection() {
  const config = getConnectionConfig();
  const missing = getMissingConnectionKeys(config);
  if (missing.length > 0) {
    throw new FsdsDatabaseNotConfiguredError();
  }
  return config;
}

function tableName(config: FsdsConnectionConfig, name: string) {
  return `${quoteIdentifier(config.schema)}.${quoteIdentifier(name)}`;
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeTimestamp(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function selectedValues(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : value;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item !== 'ALL');
}

function addArrayFilter(
  conditions: string[],
  params: Array<number | number[] | string[]>,
  expression: string,
  values: string[] | number[],
  type: 'text' | 'int'
) {
  if (values.length === 0) return;
  params.push(values);
  conditions.push(`${expression} = ANY($${params.length}::${type}[])`);
}

function buildFinanceWhereClause(query: QueryParams, params: Array<number | number[] | string[]>) {
  const conditions: string[] = [];

  const fiscalYears = selectedValues(query.fiscalYear)
    .map((year) => parseInt(year, 10))
    .filter((year) => Number.isFinite(year));
  addArrayFilter(conditions, params, 'fiscal_year', fiscalYears, 'int');

  addArrayFilter(conditions, params, 'office_code', selectedValues(query.office), 'text');
  addArrayFilter(conditions, params, 'appropriation_type', selectedValues(query.appropriationType), 'text');
  addArrayFilter(conditions, params, 'pap_code', selectedValues(query.pap), 'text');
  addArrayFilter(conditions, params, 'uacs_code', selectedValues(query.uacs), 'text');

  const scope = Array.isArray(query.scope) ? query.scope[0] : query.scope;
  if (scope === 'CENTRAL_OFFICE_ONLY') {
    conditions.push(`office_type = 'CENTRAL_OFFICE'`);
  } else if (scope === 'ALL_REGIONAL') {
    conditions.push(`office_type = 'REGIONAL_OFFICE'`);
  }

  return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
}

function getPool(config: FsdsConnectionConfig) {
  if (!isSupportedDriver(config.driver)) {
    throw new FsdsDatabaseAdapterMissingError(config.driver || 'not_configured');
  }

  const poolKey = JSON.stringify({
    connectionString: config.connectionString,
    host: config.host,
    port: config.port,
    database: config.database,
    schema: config.schema,
    user: config.user,
    ssl: config.ssl,
    poolMax: config.poolMax,
  });

  if (fsdsPool && fsdsPoolKey === poolKey) {
    return fsdsPool;
  }

  const poolConfig: PoolConfig = config.connectionString
    ? {
        connectionString: config.connectionString,
        ssl: config.ssl,
        max: config.poolMax,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
        statement_timeout: config.statementTimeoutMillis,
      }
    : {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password || undefined,
        ssl: config.ssl,
        max: config.poolMax,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
        statement_timeout: config.statementTimeoutMillis,
      };

  const { Pool } = pg;
  fsdsPool = new Pool(poolConfig);
  fsdsPoolKey = poolKey;
  fsdsPool.on('error', (error) => {
    console.error('[exDASH] Idle FSDS PostgreSQL connection error', error);
  });

  return fsdsPool;
}

async function queryPostgresFinanceRecords(query: QueryParams, config: FsdsConnectionConfig): Promise<FinanceRecord[]> {
  const table = (name: string) => tableName(config, name);
  const params: Array<number | number[] | string[]> = [config.amountScale];
  const whereClause = buildFinanceWhereClause(query, params);

  const sql = `
    WITH allotment_base AS (
      SELECT
        ad.id::text AS id,
        COALESCE(
          NULLIF(substring(a.particulars FROM 'FY[[:space:]]*([0-9]{4})'), '')::integer,
          NULLIF(substring(a.allotment_code FROM 'FY[[:space:]]*([0-9]{4})'), '')::integer,
          EXTRACT(YEAR FROM a.date)::integer
        ) AS fiscal_year,
        CASE fo.office_key
          WHEN 'CENTRAL_OFFICE_NCR' THEN 'CENTRAL_OFFICE'
          WHEN 'FIELD_OFFICE_NCR' THEN 'NCR'
          WHEN 'FIELD_OFFICE_CAR' THEN 'CAR'
          WHEN 'FIELD_OFFICE_1' THEN 'REGION_I'
          WHEN 'FIELD_OFFICE_2' THEN 'REGION_II'
          WHEN 'FIELD_OFFICE_3' THEN 'REGION_III'
          WHEN 'FIELD_OFFICE_4A' THEN 'CALABARZON'
          WHEN 'FIELD_OFFICE_MIMAROPA' THEN 'MIMAROPA'
          WHEN 'FIELD_OFFICE_5' THEN 'REGION_V'
          WHEN 'FIELD_OFFICE_6' THEN 'REGION_VI'
          WHEN 'FIELD_OFFICE_7' THEN 'REGION_VII'
          WHEN 'FIELD_OFFICE_8' THEN 'REGION_VIII'
          WHEN 'FIELD_OFFICE_9' THEN 'REGION_IX'
          WHEN 'FIELD_OFFICE_10' THEN 'REGION_X'
          WHEN 'FIELD_OFFICE_11' THEN 'REGION_XI'
          WHEN 'FIELD_OFFICE_12' THEN 'REGION_XII'
          WHEN 'FIELD_OFFICE_13' THEN 'CARAGA'
          WHEN 'FIELD_OFFICE_NIR' THEN 'NIR'
          ELSE COALESCE(fo.office_key, fo.code)
        END AS office_code,
        fo.office_key,
        fo.name AS office_name,
        p.code AS pap_code,
        p.name AS pap_description,
        CASE
          WHEN a.appropriation_type::text ILIKE 'CURRENT%' THEN 'CURRENT'
          WHEN a.appropriation_type::text ILIKE 'CONTINUING%' THEN 'CONTINUING'
          WHEN a.appropriation_type::text ILIKE 'TRUST%' THEN 'TRUST_FUND'
          ELSE COALESCE(a.appropriation_type::text, 'UNSPECIFIED')
        END AS appropriation_type,
        COALESCE(a.bfars_budget_type::text, 'UNSPECIFIED') AS fund_source,
        COALESCE(a.fund_cluster::text, 'UNSPECIFIED') AS fund_cluster,
        rca.code AS uacs_code,
        rca.name AS uacs_description,
        (ad.amount::numeric / $1) AS total_allotment,
        GREATEST(ad.updated_at, a.updated_at, fo.updated_at, p.updated_at, rca.updated_at) AS last_updated
      FROM ${table('allotment_details')} ad
      JOIN ${table('allotments')} a ON a.id = ad.allotment_id
      JOIN ${table('field_offices')} fo ON fo.id = ad.office_id
      JOIN ${table('paps')} p ON p.id = ad.pap_id
      JOIN ${table('revised_chart_of_accounts')} rca ON rca.id = ad.rca_id
      WHERE a.status::text = 'APPROVED'
    ),
    modification_rollup AS (
      SELECT
        COALESCE(md.allotment_details_id, sad.uacs_id, matched_ad.id)::text AS id,
        (SUM(CASE
          WHEN md.action::text = 'ADD' THEN md.amount::numeric
          WHEN md.action::text = 'SUBTRACT' THEN -md.amount::numeric
          ELSE 0::numeric
        END) / $1) AS total_modification,
        MAX(GREATEST(md.updated_at, m.updated_at)) AS last_updated
      FROM ${table('modification_details')} md
      JOIN ${table('modifications')} m ON m.id = md.modification_id
      LEFT JOIN ${table('sub_aro_details')} sad ON sad.id = md.sub_aro_details_id
      LEFT JOIN LATERAL (
        SELECT ad2.id
        FROM ${table('allotment_details')} ad2
        WHERE md.action::text = 'ADD'
          AND md.office_id IS NOT NULL
          AND ad2.office_id = md.office_id
          AND ad2.pap_id = md.pap_id
          AND ad2.rca_id = md.rca_id
        ORDER BY ad2.updated_at DESC
        LIMIT 1
      ) matched_ad ON true
      WHERE m.status::text = 'APPROVED'
      GROUP BY COALESCE(md.allotment_details_id, sad.uacs_id, matched_ad.id)
    ),
    withdrawal_rollup AS (
      SELECT
        sad.uacs_id::text AS id,
        (SUM(wd.amount::numeric) / $1) AS total_withdrawal,
        MAX(GREATEST(wd.updated_at, w.updated_at)) AS last_updated
      FROM ${table('withdrawal_details')} wd
      JOIN ${table('withdrawals')} w ON w.id = wd.withdrawal_id
      JOIN ${table('sub_aro_details')} sad ON sad.id = wd.sub_aro_details_id
      WHERE w.status::text = 'APPROVED'
        AND sad.uacs_id IS NOT NULL
      GROUP BY sad.uacs_id
    ),
    obligation_rollup AS (
      SELECT
        sad.uacs_id::text AS id,
        (SUM(od.amount::numeric) / $1) AS total_obligations,
        (SUM(od.balance::numeric) / $1) AS obligation_balance,
        MAX(GREATEST(od.updated_at, o.updated_at, sad.updated_at)) AS last_updated
      FROM ${table('obligation_details')} od
      JOIN ${table('obligations')} o ON o.id = od.obligation_id
      JOIN ${table('sub_aro_details')} sad ON sad.id = od.sub_aro_details_id
      WHERE o.status::text = 'APPROVED'
        AND sad.uacs_id IS NOT NULL
      GROUP BY sad.uacs_id
    ),
    disbursement_links AS (
      SELECT DISTINCT
        d.id AS disbursement_id,
        sad.uacs_id::text AS id,
        d.amount::numeric AS amount,
        GREATEST(d.updated_at, dob.updated_at, od.updated_at) AS last_updated
      FROM ${table('disbursement_obligations')} dob
      JOIN ${table('disbursements')} d ON d.id = dob.disbursement_id
      JOIN ${table('obligation_details')} od ON od.id = dob.obligation_detail_id
      JOIN ${table('sub_aro_details')} sad ON sad.id = od.sub_aro_details_id
      WHERE d.status::text = 'DISBURSED'
        AND sad.uacs_id IS NOT NULL
    ),
    disbursement_rollup AS (
      SELECT
        id,
        (SUM(amount) / $1) AS disbursement,
        MAX(last_updated) AS last_updated
      FROM disbursement_links
      GROUP BY id
    ),
    earmark_rollup AS (
      SELECT
        sad.uacs_id::text AS id,
        (SUM(ed.balance::numeric) / $1) AS earmarks,
        MAX(GREATEST(ed.updated_at, e.updated_at, sad.updated_at)) AS last_updated
      FROM ${table('earmark_details')} ed
      JOIN ${table('earmarks')} e ON e.id = ed.earmark_id
      JOIN ${table('sub_aro_details')} sad ON sad.id = ed.sub_aro_details_id
      WHERE e.status::text = 'APPROVED'
        AND sad.uacs_id IS NOT NULL
      GROUP BY sad.uacs_id
    ),
    finance_rows AS (
      SELECT
        b.id,
        b.fiscal_year,
        b.office_code,
        b.office_name,
        CASE
          WHEN b.office_code = 'CENTRAL_OFFICE' OR b.office_key NOT LIKE 'FIELD_OFFICE_%' THEN 'CENTRAL_OFFICE'
          ELSE 'REGIONAL_OFFICE'
        END AS office_type,
        CASE
          WHEN b.office_code = 'CENTRAL_OFFICE' THEN 'NCR'
          ELSE b.office_code
        END AS region_code,
        b.pap_code,
        b.pap_description,
        b.appropriation_type,
        b.fund_source,
        b.fund_cluster,
        b.uacs_code,
        b.uacs_description,
        b.total_allotment,
        COALESCE(m.total_modification, 0) AS total_modification,
        COALESCE(w.total_withdrawal, 0) AS total_withdrawal,
        COALESCE(o.total_obligations, 0) AS total_obligations,
        COALESCE(o.obligation_balance, 0) AS obligation_balance,
        COALESCE(e.earmarks, 0) AS earmarks,
        COALESCE(d.disbursement, 0) AS disbursement,
        'EMPOWERX_FSDS_POSTGRESQL' AS source_module,
        GREATEST(
          b.last_updated,
          COALESCE(m.last_updated, b.last_updated),
          COALESCE(w.last_updated, b.last_updated),
          COALESCE(o.last_updated, b.last_updated),
          COALESCE(d.last_updated, b.last_updated),
          COALESCE(e.last_updated, b.last_updated)
        ) AS last_updated
      FROM allotment_base b
      LEFT JOIN modification_rollup m ON m.id = b.id
      LEFT JOIN withdrawal_rollup w ON w.id = b.id
      LEFT JOIN obligation_rollup o ON o.id = b.id
      LEFT JOIN disbursement_rollup d ON d.id = b.id
      LEFT JOIN earmark_rollup e ON e.id = b.id
    )
    SELECT *
    FROM finance_rows
    ${whereClause}
    ORDER BY fiscal_year DESC, office_name ASC, pap_code ASC, uacs_code ASC;
  `;

  const result = await getPool(config).query<FsdsFinanceRow>(sql, params);

  return result.rows.map((row) => {
    const totalAllotment = roundMoney(toNumber(row.total_allotment));
    const totalModification = roundMoney(toNumber(row.total_modification));
    const totalWithdrawal = roundMoney(toNumber(row.total_withdrawal));
    const totalNetAllotment = roundMoney(totalAllotment + totalModification - totalWithdrawal);
    const totalObligations = roundMoney(toNumber(row.total_obligations));
    const totalNetObligation = totalObligations;
    const actualBalance = roundMoney(totalNetAllotment - totalNetObligation);
    const earmarks = roundMoney(toNumber(row.earmarks));
    const balanceLessEarmarks = roundMoney(actualBalance - earmarks);
    const disbursement = roundMoney(toNumber(row.disbursement));
    const unpaidFromBalance = toNumber(row.obligation_balance);
    const unpaidObligations = roundMoney(
      unpaidFromBalance > 0 ? unpaidFromBalance : Math.max(totalNetObligation - disbursement, 0)
    );

    return {
      id: row.id,
      fiscalYear: Number(row.fiscal_year),
      period: 'FULL_YEAR',
      officeCode: row.office_code,
      officeName: row.office_name,
      officeType: row.office_type,
      regionCode: row.region_code,
      papCode: row.pap_code,
      papDescription: row.pap_description,
      appropriationType: row.appropriation_type,
      fundSource: row.fund_source,
      fundCluster: row.fund_cluster,
      uacsCode: row.uacs_code,
      uacsDescription: row.uacs_description,
      totalAllotment,
      totalModification,
      totalWithdrawal,
      totalNetAllotment,
      totalObligations,
      totalNetObligation,
      actualBalance,
      utilizationRate: totalNetAllotment !== 0
        ? roundRate((totalNetObligation / totalNetAllotment) * 100)
        : 0,
      earmarks,
      balanceLessEarmarks,
      disbursement,
      unpaidObligations,
      disbursementRate: totalNetObligation !== 0
        ? roundRate((disbursement / totalNetObligation) * 100)
        : 0,
      sourceModule: row.source_module,
      lastUpdated: normalizeTimestamp(row.last_updated),
    };
  });
}

async function queryFsdsFinanceRecords(query: QueryParams): Promise<FinanceRecord[]> {
  const demoRecords = getDemoFinanceRecords();
  if (demoRecords) {
    return demoRecords;
  }

  return queryPostgresFinanceRecords(query, getConfiguredFsdsConnection());
}

async function queryFsdsOffices(): Promise<Office[]> {
  const demoRecords = getDemoFinanceRecords();
  if (demoRecords) {
    const offices = new Map<string, Office>();
    demoRecords.forEach((record) => {
      offices.set(record.officeCode, {
        code: record.officeCode,
        name: record.officeName,
        type: record.officeType,
        regionCode: record.regionCode,
      });
    });
    return Array.from(offices.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  const config = getConfiguredFsdsConnection();
  const result = await getPool(config).query<FsdsOfficeRow>(`
    SELECT
      CASE office_key
        WHEN 'CENTRAL_OFFICE_NCR' THEN 'CENTRAL_OFFICE'
        WHEN 'FIELD_OFFICE_NCR' THEN 'NCR'
        WHEN 'FIELD_OFFICE_CAR' THEN 'CAR'
        WHEN 'FIELD_OFFICE_1' THEN 'REGION_I'
        WHEN 'FIELD_OFFICE_2' THEN 'REGION_II'
        WHEN 'FIELD_OFFICE_3' THEN 'REGION_III'
        WHEN 'FIELD_OFFICE_4A' THEN 'CALABARZON'
        WHEN 'FIELD_OFFICE_MIMAROPA' THEN 'MIMAROPA'
        WHEN 'FIELD_OFFICE_5' THEN 'REGION_V'
        WHEN 'FIELD_OFFICE_6' THEN 'REGION_VI'
        WHEN 'FIELD_OFFICE_7' THEN 'REGION_VII'
        WHEN 'FIELD_OFFICE_8' THEN 'REGION_VIII'
        WHEN 'FIELD_OFFICE_9' THEN 'REGION_IX'
        WHEN 'FIELD_OFFICE_10' THEN 'REGION_X'
        WHEN 'FIELD_OFFICE_11' THEN 'REGION_XI'
        WHEN 'FIELD_OFFICE_12' THEN 'REGION_XII'
        WHEN 'FIELD_OFFICE_13' THEN 'CARAGA'
        WHEN 'FIELD_OFFICE_NIR' THEN 'NIR'
        ELSE office_key
      END AS code,
      name,
      CASE
        WHEN office_key = 'CENTRAL_OFFICE_NCR' THEN 'CENTRAL_OFFICE'
        ELSE 'REGIONAL_OFFICE'
      END AS type,
      CASE
        WHEN office_key = 'CENTRAL_OFFICE_NCR' THEN 'NCR'
        WHEN office_key = 'FIELD_OFFICE_NCR' THEN 'NCR'
        WHEN office_key = 'FIELD_OFFICE_CAR' THEN 'CAR'
        WHEN office_key = 'FIELD_OFFICE_1' THEN 'REGION_I'
        WHEN office_key = 'FIELD_OFFICE_2' THEN 'REGION_II'
        WHEN office_key = 'FIELD_OFFICE_3' THEN 'REGION_III'
        WHEN office_key = 'FIELD_OFFICE_4A' THEN 'CALABARZON'
        WHEN office_key = 'FIELD_OFFICE_MIMAROPA' THEN 'MIMAROPA'
        WHEN office_key = 'FIELD_OFFICE_5' THEN 'REGION_V'
        WHEN office_key = 'FIELD_OFFICE_6' THEN 'REGION_VI'
        WHEN office_key = 'FIELD_OFFICE_7' THEN 'REGION_VII'
        WHEN office_key = 'FIELD_OFFICE_8' THEN 'REGION_VIII'
        WHEN office_key = 'FIELD_OFFICE_9' THEN 'REGION_IX'
        WHEN office_key = 'FIELD_OFFICE_10' THEN 'REGION_X'
        WHEN office_key = 'FIELD_OFFICE_11' THEN 'REGION_XI'
        WHEN office_key = 'FIELD_OFFICE_12' THEN 'REGION_XII'
        WHEN office_key = 'FIELD_OFFICE_13' THEN 'CARAGA'
        WHEN office_key = 'FIELD_OFFICE_NIR' THEN 'NIR'
        ELSE office_key
      END AS region_code
    FROM ${tableName(config, 'field_offices')}
    WHERE is_active = true
      AND (office_key = 'CENTRAL_OFFICE_NCR' OR office_key LIKE 'FIELD_OFFICE_%')
    ORDER BY CASE WHEN office_key = 'CENTRAL_OFFICE_NCR' THEN 0 ELSE 1 END, name;
  `);

  return result.rows.map((row) => ({
    code: row.code,
    name: row.name,
    type: row.type,
    regionCode: row.region_code,
  }));
}

async function queryFsdsPaps(): Promise<PAP[]> {
  const demoRecords = getDemoFinanceRecords();
  if (demoRecords) {
    const paps = new Map<string, PAP>();
    demoRecords.forEach((record) => {
      paps.set(record.papCode, {
        code: record.papCode,
        description: record.papDescription,
      });
    });
    return Array.from(paps.values()).sort((a, b) => a.description.localeCompare(b.description));
  }

  const config = getConfiguredFsdsConnection();
  const result = await getPool(config).query<FsdsReferenceRow>(`
    SELECT code, name AS description
    FROM ${tableName(config, 'paps')}
    WHERE is_active = true
      AND type::text = 'pap'
    ORDER BY name;
  `);
  return result.rows.map((row) => ({ code: row.code, description: row.description }));
}

async function queryFsdsUacs(): Promise<UACS[]> {
  const demoRecords = getDemoFinanceRecords();
  if (demoRecords) {
    const uacs = new Map<string, UACS>();
    demoRecords.forEach((record) => {
      uacs.set(record.uacsCode, {
        code: record.uacsCode,
        description: record.uacsDescription,
      });
    });
    return Array.from(uacs.values()).sort((a, b) => a.description.localeCompare(b.description));
  }

  const config = getConfiguredFsdsConnection();
  const result = await getPool(config).query<FsdsReferenceRow>(`
    SELECT code, name AS description
    FROM ${tableName(config, 'revised_chart_of_accounts')}
    WHERE is_active = true
      AND type::text = 'rca'
      AND budget = true
    ORDER BY code;
  `);
  return result.rows.map((row) => ({ code: row.code, description: row.description }));
}

export const fsdsDataSource = {
  async getFinanceRecords(query: QueryParams) {
    return filterRecords(await queryFsdsFinanceRecords(query), query);
  },

  async getFinanceSummary(query: QueryParams) {
    return aggregateRecords(await this.getFinanceRecords(query));
  },

  async getFinanceByOffice(query: QueryParams) {
    return groupByField(await this.getFinanceRecords(query), 'officeCode');
  },

  async getFinanceByPap(query: QueryParams) {
    return groupByField(await this.getFinanceRecords(query), 'papCode');
  },

  async getFinanceByUacs(query: QueryParams) {
    return groupByField(await this.getFinanceRecords(query), 'uacsCode');
  },

  async getDisbursements(query: QueryParams) {
    return this.getFinanceByOffice(query);
  },

  async getUnpaidObligations(query: QueryParams) {
    return this.getFinanceByOffice(query);
  },

  getOffices: queryFsdsOffices,
  getPaps: queryFsdsPaps,
  getUacs: queryFsdsUacs,
};

export function sendFsdsError(error: unknown, res: { status: (status: number) => { json: (body: object) => void } }) {
  if (
    error instanceof FsdsDatabaseNotConfiguredError ||
    error instanceof FsdsDatabaseConfigError ||
    error instanceof FsdsDatabaseAdapterMissingError
  ) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      dataSource: 'EMPOWERX_FSDS_FINANCE_DATABASE',
      financeDataStoredInExdash: false,
      fsdsConnection: getFsdsConnectionStatus(),
      demoDataset: getDemoDatasetStatus(),
    });
    return;
  }

  console.error('[exDASH] FSDS data-source error', error);
  res.status(500).json({
    error: 'FSDS_DATABASE_QUERY_FAILED',
    message: 'exDASH could not fetch finance data from the EMPOWERX FSDS database.',
    dataSource: 'EMPOWERX_FSDS_FINANCE_DATABASE',
    financeDataStoredInExdash: false,
    demoDataset: getDemoDatasetStatus(),
  });
}
