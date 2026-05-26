import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import financeRoutes from './routes/financeRoutes';
import scenarioRoutes from './routes/scenarioRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import referenceRoutes from './routes/referenceRoutes';
import demoDatasetRoutes from './routes/demoDatasetRoutes';
import { checkFsdsDatabaseConnection, getFsdsConnectionStatus } from './dataSources/fsdsDataSource';
import { getDemoDatasetStatus } from './demoDataset';
import { checkMetadataDbConnection } from './metadataDb';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const shouldServeStatic = process.env.SERVE_STATIC !== 'false';
const corsOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.TRUST_PROXY !== 'false') {
  app.set('trust proxy', 1);
}

app.use(cors(corsOrigins?.length ? { origin: corsOrigins } : undefined));
app.use(express.json());

// Health check
app.get('/api/exdash', (_req, res) => {
  const fsdsConnection = getFsdsConnectionStatus();
  const demoDataset = getDemoDatasetStatus();
  res.json({
    service: 'exDASH',
    description: 'EMPOWERX Dashboard and Analytics Services Hub',
    status: fsdsConnection.configured || demoDataset.loaded ? 'healthy' : 'degraded',
    dataSource: demoDataset.loaded ? 'DEMO_SAMPLE_DATA' : 'EMPOWERX_FSDS_FINANCE_DATABASE',
    financeDataStoredInExdash: demoDataset.loaded,
    endpoints: {
      health: '/api/exdash/health',
      readiness: '/api/exdash/ready',
      financeSummary: '/api/exdash/finance/summary',
      financeRecords: '/api/exdash/finance/records',
      offices: '/api/exdash/reference/offices',
      paps: '/api/exdash/reference/paps',
      uacs: '/api/exdash/reference/uacs',
    },
  });
});

app.get('/api/exdash/health', (_req, res) => {
  const fsdsConnection = getFsdsConnectionStatus();
  const demoDataset = getDemoDatasetStatus();
  checkMetadataDbConnection().then((metadataDb) => res.json({
    status: fsdsConnection.configured || demoDataset.loaded ? 'healthy' : 'degraded',
    service: 'exDASH',
    version: '1.0.0-prototype',
    timestamp: new Date().toISOString(),
    description: 'EMPOWERX Dashboard and Analytics Services Hub',
    dataSource: demoDataset.loaded ? 'DEMO_SAMPLE_DATA' : 'EMPOWERX_FSDS_FINANCE_DATABASE',
    dataAccessPattern: 'exDASH reads and aggregates FSDS finance data for dashboard clients',
    financeDataStoredInExdash: demoDataset.loaded,
    demoMode: demoDataset.loaded,
    demoDataset,
    fsdsConnection,
    metadataDb,
  }));
});

app.get('/api/exdash/ready', async (_req, res) => {
  const fsdsConnection = getFsdsConnectionStatus();
  const demoDataset = getDemoDatasetStatus();

  if (demoDataset.loaded) {
    res.json({
      status: 'ready',
      dataSource: 'DEMO_SAMPLE_DATA',
      demoMode: true,
      demoDataset,
      fsdsConnection,
    });
    return;
  }

  const readiness = await checkFsdsDatabaseConnection();
  const metadataDb = await checkMetadataDbConnection();
  res.status(readiness.ready ? 200 : 503).json({
    status: readiness.ready ? 'ready' : 'not_ready',
    dataSource: 'EMPOWERX_FSDS_FINANCE_DATABASE',
    demoMode: false,
    fsdsConnection,
    readiness,
    metadataDb,
  });
});

// Mount routes
app.use('/api/exdash/finance', financeRoutes);
app.use('/api/exdash', scenarioRoutes);
app.use('/api/exdash', dashboardRoutes);
app.use('/api/exdash', demoDatasetRoutes);
app.use('/api/exdash/reference', referenceRoutes);

const clientDistPath = path.resolve(process.cwd(), 'dist');
if (shouldServeStatic && existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║   exDASH API Server - EMPOWERX Analytics Hub      ║`);
  console.log(`║   Running on http://localhost:${PORT}               ║`);
  console.log(`║   Health: http://localhost:${PORT}/api/exdash/health ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});
