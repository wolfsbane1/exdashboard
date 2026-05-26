import { Router, Request, Response } from 'express';
import { fsdsDataSource, sendFsdsError } from '../dataSources/fsdsDataSource';

const router = Router();

router.get('/offices', async (_req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getOffices());
  } catch (error) {
    sendFsdsError(error, res);
  }
});

router.get('/paps', async (_req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getPaps());
  } catch (error) {
    sendFsdsError(error, res);
  }
});

router.get('/uacs', async (_req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getUacs());
  } catch (error) {
    sendFsdsError(error, res);
  }
});

export default router;
