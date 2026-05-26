import { Router, Request, Response } from 'express';
import { fsdsDataSource, sendFsdsError } from '../dataSources/fsdsDataSource';

const router = Router();

function queryParams(req: Request) {
  return req.query as Record<string, string | string[] | undefined>;
}

// GET /finance/summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getFinanceSummary(queryParams(req)));
  } catch (error) {
    sendFsdsError(error, res);
  }
});

// GET /finance/records
router.get('/records', async (req: Request, res: Response) => {
  try {
    const records = await fsdsDataSource.getFinanceRecords(queryParams(req));
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const start = (page - 1) * limit;
    const paginated = records.slice(start, start + limit);
    res.json({
      data: paginated,
      total: records.length,
      page,
      limit,
      totalPages: Math.ceil(records.length / limit),
    });
  } catch (error) {
    sendFsdsError(error, res);
  }
});

// GET /finance/by-office
router.get('/by-office', async (req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getFinanceByOffice(queryParams(req)));
  } catch (error) {
    sendFsdsError(error, res);
  }
});

// GET /finance/by-pap
router.get('/by-pap', async (req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getFinanceByPap(queryParams(req)));
  } catch (error) {
    sendFsdsError(error, res);
  }
});

// GET /finance/by-uacs
router.get('/by-uacs', async (req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getFinanceByUacs(queryParams(req)));
  } catch (error) {
    sendFsdsError(error, res);
  }
});

// GET /finance/disbursements
router.get('/disbursements', async (req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getDisbursements(queryParams(req)));
  } catch (error) {
    sendFsdsError(error, res);
  }
});

// GET /finance/unpaid-obligations
router.get('/unpaid-obligations', async (req: Request, res: Response) => {
  try {
    res.json(await fsdsDataSource.getUnpaidObligations(queryParams(req)));
  } catch (error) {
    sendFsdsError(error, res);
  }
});

export default router;
