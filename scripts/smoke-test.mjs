const baseUrl = (process.env.EXDASH_BASE_URL || 'http://127.0.0.1:4000/api/exdash').replace(/\/$/, '');

async function getJson(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${url} did not return JSON: ${text.slice(0, 200)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const health = await getJson('/health');
assert(health.dataSource === 'EMPOWERX_FSDS_FINANCE_DATABASE', 'Health endpoint is not using FSDS data');
assert(health.demoMode === false, 'Demo mode must be disabled for deployment smoke test');
assert(health.fsdsConnection?.configured === true, 'FSDS database connection is not configured');

const readiness = await getJson('/ready');
assert(readiness.status === 'ready', `Readiness endpoint is not ready: ${JSON.stringify(readiness.readiness)}`);

const summary = await getJson('/finance/summary');
assert(Number(summary.totalNetAllotment) > 0, 'Finance summary returned no net allotment');
assert(Number(summary.totalNetObligation) >= 0, 'Finance summary returned invalid net obligation');

const records = await getJson('/finance/records?limit=1');
assert(Number(records.total) > 0, 'Finance records endpoint returned no FSDS records');

const offices = await getJson('/reference/offices');
assert(Array.isArray(offices) && offices.length > 0, 'Office reference endpoint returned no offices');

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  dataSource: health.dataSource,
  database: health.fsdsConnection.database,
  host: health.fsdsConnection.host,
  totalRecords: records.total,
  totalNetAllotment: summary.totalNetAllotment,
  officeCount: offices.length,
}, null, 2));
