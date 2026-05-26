import { Router, Request, Response } from 'express';
import {
  createDashboard,
  deleteDashboard,
  listDashboardTemplates,
  listDashboards,
  seedDashboardTemplates,
  updateDashboard,
} from '../metadataDb';

const router = Router();

function generateId(): string {
  return 'db-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

// Dashboard templates
const TEMPLATES = [
  {
    id: 'tmpl-executive',
    name: 'Executive Overview',
    description: 'High-level DSWD-wide financial overview with key KPIs and comparison charts.',
    scope: 'ENTIRE_DSWD',
    widgets: [
      { id: 'w1', type: 'KPI', title: 'Total Net Allotment', metric: 'totalNetAllotment', groupBy: '', filters: {}, x: 0, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w2', type: 'KPI', title: 'Total Net Obligation', metric: 'totalNetObligation', groupBy: '', filters: {}, x: 3, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w3', type: 'KPI', title: 'Utilization Rate', metric: 'utilizationRate', groupBy: '', filters: {}, x: 6, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w4', type: 'KPI', title: 'Disbursement Rate', metric: 'disbursementRate', groupBy: '', filters: {}, x: 9, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w5', type: 'BAR', title: 'Utilization by Office', metric: 'utilizationRate', groupBy: 'office', filters: {}, x: 0, y: 2, w: 6, h: 4, settings: {} },
      { id: 'w6', type: 'BAR', title: 'Disbursement by Office', metric: 'disbursement', groupBy: 'office', filters: {}, x: 6, y: 2, w: 6, h: 4, settings: {} },
    ],
    filters: {},
    visibility: 'DSWD_WIDE',
    createdBy: 'System',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tmpl-regional',
    name: 'Regional Deep Dive',
    description: 'Detailed regional finance dashboard with UACS breakdown and PAP analysis.',
    scope: 'SINGLE_REGIONAL',
    widgets: [
      { id: 'w1', type: 'KPI', title: 'Net Allotment', metric: 'totalNetAllotment', groupBy: '', filters: {}, x: 0, y: 0, w: 4, h: 2, settings: {} },
      { id: 'w2', type: 'KPI', title: 'Utilization Rate', metric: 'utilizationRate', groupBy: '', filters: {}, x: 4, y: 0, w: 4, h: 2, settings: {} },
      { id: 'w3', type: 'KPI', title: 'Disbursement', metric: 'disbursement', groupBy: '', filters: {}, x: 8, y: 0, w: 4, h: 2, settings: {} },
      { id: 'w4', type: 'TABLE', title: 'UACS Breakdown', metric: 'totalNetAllotment', groupBy: 'uacs', filters: {}, x: 0, y: 2, w: 12, h: 5, settings: {} },
      { id: 'w5', type: 'BAR', title: 'PAP Utilization', metric: 'utilizationRate', groupBy: 'pap', filters: {}, x: 0, y: 7, w: 6, h: 4, settings: {} },
      { id: 'w6', type: 'DONUT', title: 'Object Code Distribution', metric: 'totalNetAllotment', groupBy: 'uacs', filters: {}, x: 6, y: 7, w: 6, h: 4, settings: {} },
    ],
    filters: {},
    visibility: 'OFFICE',
    createdBy: 'System',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tmpl-health',
    name: 'Financial Health Monitor',
    description: 'Monitor utilization rates, disbursement health, and flag problem areas.',
    scope: 'ENTIRE_DSWD',
    widgets: [
      { id: 'w1', type: 'PROGRESS', title: 'Overall Utilization', metric: 'utilizationRate', groupBy: '', filters: {}, x: 0, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w2', type: 'PROGRESS', title: 'Disbursement Rate', metric: 'disbursementRate', groupBy: '', filters: {}, x: 3, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w3', type: 'PROGRESS', title: 'Budget Consumed', metric: 'totalNetObligation', groupBy: '', filters: {}, x: 6, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w4', type: 'PROGRESS', title: 'Unpaid Ratio', metric: 'unpaidObligations', groupBy: '', filters: {}, x: 9, y: 0, w: 3, h: 2, settings: {} },
      { id: 'w5', type: 'ALERT', title: 'Low Utilization Alert', metric: 'utilizationRate', groupBy: '', filters: {}, x: 0, y: 2, w: 6, h: 2, settings: { threshold: 75 } },
      { id: 'w6', type: 'ALERT', title: 'High Unpaid Alert', metric: 'unpaidObligations', groupBy: '', filters: {}, x: 6, y: 2, w: 6, h: 2, settings: { threshold: 10 } },
      { id: 'w7', type: 'BAR', title: 'Health by Region', metric: 'utilizationRate', groupBy: 'office', filters: {}, x: 0, y: 4, w: 12, h: 4, settings: {} },
    ],
    filters: {},
    visibility: 'MANAGEMENT',
    createdBy: 'System',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

// GET /dashboard-templates
router.get('/dashboard-templates', async (_req: Request, res: Response) => {
  try {
    await seedDashboardTemplates(TEMPLATES);
    res.json(await listDashboardTemplates());
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// POST /dashboards
router.post('/dashboards', async (req: Request, res: Response) => {
  const dashboard = {
    id: generateId(),
    name: req.body.name || 'Untitled Dashboard',
    description: req.body.description || '',
    scope: req.body.scope || 'ENTIRE_DSWD',
    widgets: req.body.widgets || [],
    filters: req.body.filters || {},
    visibility: req.body.visibility || 'PRIVATE',
    createdBy: req.body.createdBy || 'current-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    res.status(201).json(await createDashboard(dashboard));
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// GET /dashboards
router.get('/dashboards', async (_req: Request, res: Response) => {
  try {
    res.json(await listDashboards());
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// PUT /dashboards/:id
router.put('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const dashboard = await updateDashboard(req.params.id, req.body);
    if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
    res.json(dashboard);
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

// DELETE /dashboards/:id
router.delete('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteDashboard(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Dashboard not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(503).json({
      error: 'Metadata database unavailable',
      message: error instanceof Error ? error.message : 'Unknown metadata database error',
    });
  }
});

export default router;
