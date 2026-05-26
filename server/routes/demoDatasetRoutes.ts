import { Router, Request, Response } from 'express';
import {
  clearDemoDataset,
  getDemoDatasetStatus,
  loadDemoDataset,
} from '../demoDataset';

const router = Router();

router.get('/demo-dataset/status', (_req: Request, res: Response) => {
  res.json(getDemoDatasetStatus());
});

router.post('/demo-dataset/load', (_req: Request, res: Response) => {
  res.json(loadDemoDataset());
});

router.delete('/demo-dataset', (_req: Request, res: Response) => {
  res.json(clearDemoDataset());
});

export default router;
