import { Router, Request, Response } from 'express';
import { fsdsDataSource, sendFsdsError } from '../dataSources/fsdsDataSource';
import { computeScenario, generatePresets } from '../scenarioEngine';
import {
  createScenario,
  getScenario,
  listScenarios,
  listScenariosByIds,
  saveScenario,
} from '../metadataDb';

const router = Router();

function generateId(): string {
  return 'sc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

function baselineFromSummary(summary: Awaited<ReturnType<typeof fsdsDataSource.getFinanceSummary>>) {
  return {
    netAllotment: summary.totalNetAllotment,
    netObligation: summary.totalNetObligation,
    actualBalance: summary.actualBalance,
    utilizationRate: summary.utilizationRate,
    disbursement: summary.disbursement,
    unpaidObligations: summary.unpaidObligations,
    disbursementRate: summary.disbursementRate,
  };
}

function scenarioEngineBaseline(baselineData: ReturnType<typeof baselineFromSummary>) {
  return {
    baselineNetAllotment: baselineData.netAllotment,
    baselineNetObligation: baselineData.netObligation,
    baselineActualBalance: baselineData.actualBalance,
    baselineUtilizationRate: baselineData.utilizationRate,
    baselineDisbursement: baselineData.disbursement,
    baselineUnpaidObligations: baselineData.unpaidObligations,
    baselineDisbursementRate: baselineData.disbursementRate,
  };
}

// POST /scenarios
router.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const { name, description, baselineScope, officeName, fiscalYear } = req.body;
    const fy = fiscalYear || 2025;
    const query: Record<string, string> = { fiscalYear: String(fy) };
    if (officeName && officeName !== 'ALL') query.office = officeName;
    const baselineData = baselineFromSummary(await fsdsDataSource.getFinanceSummary(query));

    const scenario = {
      id: generateId(),
      name: name || 'Untitled Scenario',
      description: description || '',
      baselineScope: baselineScope || 'ENTIRE_DSWD',
      officeName: officeName || 'ALL',
      fiscalYear: fy,
      assumptions: [],
      projectedResults: null,
      baselineData,
      status: 'DRAFT',
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(await createScenario(scenario));
  } catch (error) {
    if (error instanceof Error && error.message.includes('metadata database')) {
      res.status(503).json({ error: 'Metadata database unavailable', message: error.message });
      return;
    }
    sendFsdsError(error, res);
  }
});

// GET /scenarios
router.get('/scenarios', async (_req: Request, res: Response) => {
  try {
    res.json(await listScenarios());
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// GET /scenarios/:id
router.get('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await getScenario(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    res.json(scenario);
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// POST /scenarios/:id/assumptions
router.post('/scenarios/:id/assumptions', async (req: Request, res: Response) => {
  try {
    const scenario = await getScenario(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

    const assumption = {
      id: 'a-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      type: req.body.type || 'OBLIGATION',
      label: req.body.label || '',
      method: req.body.method || 'AMOUNT',
      value: req.body.value || 0,
      targetMetric: req.body.targetMetric || '',
      affectedOffice: req.body.affectedOffice || '',
      affectedPap: req.body.affectedPap || '',
      affectedUacs: req.body.affectedUacs || '',
      notes: req.body.notes || '',
    };

    scenario.assumptions.push(assumption);
    res.json(await saveScenario(scenario));
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// POST /scenarios/:id/compute
router.post('/scenarios/:id/compute', async (req: Request, res: Response) => {
  try {
    const scenario = await getScenario(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    if (!scenario.baselineData) return res.status(400).json({ error: 'No FSDS baseline data' });

    scenario.projectedResults = computeScenario(
      scenarioEngineBaseline(scenario.baselineData),
      scenario.assumptions
    );
    res.json(await saveScenario(scenario));
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// POST /scenarios/compare
router.post('/scenarios/compare', async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Provide ids array' });
  try {
    res.json(await listScenariosByIds(ids));
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// GET /scenarios/presets
router.get('/scenarios/presets', async (req: Request, res: Response) => {
  try {
    const fy = parseInt(req.query.fiscalYear as string) || 2025;
    const office = req.query.office as string || 'REGION_V';
    const query: Record<string, string> = { fiscalYear: String(fy), office };
    const baselineData = baselineFromSummary(await fsdsDataSource.getFinanceSummary(query));
    const presets = generatePresets(scenarioEngineBaseline(baselineData));
    res.json(presets);
  } catch (error) {
    sendFsdsError(error, res);
  }
});

export default router;
