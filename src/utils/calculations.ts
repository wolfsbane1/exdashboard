import type {
  FinanceRecord,
  FinanceSummary,
  OfficeSummary,
  PAPSummary,
  UACSummary,
} from '../types/finance';

/**
 * Calculate utilization rate as a percentage.
 */
export function calculateUtilization(obligation: number, allotment: number): number {
  if (allotment === 0) return 0;
  return (obligation / allotment) * 100;
}

/**
 * Calculate disbursement rate as a percentage.
 */
export function calculateDisbursementRate(disbursement: number, obligation: number): number {
  if (obligation === 0) return 0;
  return (disbursement / obligation) * 100;
}

/**
 * Aggregate an array of FinanceRecords into a single FinanceSummary.
 */
export function aggregateRecords(records: FinanceRecord[]): FinanceSummary {
  const totalAllotment = records.reduce((sum, r) => sum + r.totalAllotment, 0);
  const totalModification = records.reduce((sum, r) => sum + r.totalModification, 0);
  const totalWithdrawal = records.reduce((sum, r) => sum + r.totalWithdrawal, 0);
  const totalNetAllotment = records.reduce((sum, r) => sum + r.totalNetAllotment, 0);
  const totalObligations = records.reduce((sum, r) => sum + r.totalObligations, 0);
  const totalNetObligation = records.reduce((sum, r) => sum + r.totalNetObligation, 0);
  const actualBalance = totalNetAllotment - totalNetObligation;
  const earmarks = records.reduce((sum, r) => sum + r.earmarks, 0);
  const balanceLessEarmarks = actualBalance - earmarks;
  const disbursement = records.reduce((sum, r) => sum + r.disbursement, 0);
  const unpaidObligations = records.reduce((sum, r) => sum + r.unpaidObligations, 0);
  const utilizationRate = calculateUtilization(totalNetObligation, totalNetAllotment);
  const disbursementRate = calculateDisbursementRate(disbursement, totalNetObligation);

  return {
    totalAllotment,
    totalModification,
    totalWithdrawal,
    totalNetAllotment,
    netAllotment: totalNetAllotment,
    totalObligations,
    totalNetObligation,
    netObligation: totalNetObligation,
    actualBalance,
    utilizationRate,
    earmarks,
    balanceLessEarmarks,
    disbursement,
    totalDisbursement: disbursement,
    unpaidObligations,
    disbursementRate,
  };
}

/**
 * Group finance records by office and aggregate each group.
 */
export function groupByOffice(records: FinanceRecord[]): OfficeSummary[] {
  const groups = new Map<string, FinanceRecord[]>();

  for (const record of records) {
    const key = record.officeCode;
    const existing = groups.get(key);
    if (existing) {
      existing.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  const summaries: OfficeSummary[] = [];

  for (const [officeCode, group] of groups) {
    const first = group[0];
    const totalNetAllotment = group.reduce((sum, r) => sum + r.totalNetAllotment, 0);
    const totalNetObligation = group.reduce((sum, r) => sum + r.totalNetObligation, 0);
    const actualBalance = totalNetAllotment - totalNetObligation;
    const earmarks = group.reduce((sum, r) => sum + r.earmarks, 0);
    const balanceLessEarmarks = actualBalance - earmarks;
    const disbursement = group.reduce((sum, r) => sum + r.disbursement, 0);
    const unpaidObligations = group.reduce((sum, r) => sum + r.unpaidObligations, 0);
    const utilizationRate = calculateUtilization(totalNetObligation, totalNetAllotment);
    const disbursementRate = calculateDisbursementRate(disbursement, totalNetObligation);

    summaries.push({
      officeCode,
      officeName: first.officeName,
      officeType: first.officeType,
      regionCode: first.regionCode,
      totalNetAllotment,
      totalNetObligation,
      netAllotment: totalNetAllotment,
      netObligation: totalNetObligation,
      actualBalance,
      balance: actualBalance,
      utilizationRate,
      earmarks,
      balanceLessEarmarks,
      disbursement,
      unpaidObligations,
      totalUnpaidObligations: unpaidObligations,
      disbursementRate,
      recordCount: group.length,
    });
  }

  return summaries;
}

/**
 * Group finance records by PAP and aggregate each group.
 */
export function groupByPap(records: FinanceRecord[]): PAPSummary[] {
  const groups = new Map<string, FinanceRecord[]>();

  for (const record of records) {
    const key = record.papCode;
    const existing = groups.get(key);
    if (existing) {
      existing.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  const summaries: PAPSummary[] = [];

  for (const [papCode, group] of groups) {
    const first = group[0];
    const totalNetAllotment = group.reduce((sum, r) => sum + r.totalNetAllotment, 0);
    const totalNetObligation = group.reduce((sum, r) => sum + r.totalNetObligation, 0);
    const actualBalance = totalNetAllotment - totalNetObligation;
    const disbursement = group.reduce((sum, r) => sum + r.disbursement, 0);
    const unpaidObligations = group.reduce((sum, r) => sum + r.unpaidObligations, 0);
    const utilizationRate = calculateUtilization(totalNetObligation, totalNetAllotment);
    const disbursementRate = calculateDisbursementRate(disbursement, totalNetObligation);

    summaries.push({
      papCode,
      papDescription: first.papDescription,
      papName: first.papDescription,
      totalNetAllotment,
      totalNetObligation,
      netAllotment: totalNetAllotment,
      netObligation: totalNetObligation,
      actualBalance,
      balance: actualBalance,
      utilizationRate,
      disbursement,
      unpaidObligations,
      totalUnpaidObligations: unpaidObligations,
      disbursementRate,
    });
  }

  return summaries;
}

/**
 * Group finance records by UACS and aggregate each group.
 */
export function groupByUacs(records: FinanceRecord[]): UACSummary[] {
  const groups = new Map<string, FinanceRecord[]>();

  for (const record of records) {
    const key = record.uacsCode;
    const existing = groups.get(key);
    if (existing) {
      existing.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  const summaries: UACSummary[] = [];

  for (const [uacsCode, group] of groups) {
    const first = group[0];
    const totalNetAllotment = group.reduce((sum, r) => sum + r.totalNetAllotment, 0);
    const totalNetObligation = group.reduce((sum, r) => sum + r.totalNetObligation, 0);
    const actualBalance = totalNetAllotment - totalNetObligation;
    const disbursement = group.reduce((sum, r) => sum + r.disbursement, 0);
    const unpaidObligations = group.reduce((sum, r) => sum + r.unpaidObligations, 0);
    const utilizationRate = calculateUtilization(totalNetObligation, totalNetAllotment);
    const disbursementRate = calculateDisbursementRate(disbursement, totalNetObligation);

    summaries.push({
      uacsCode,
      uacsDescription: first.uacsDescription,
      uacsName: first.uacsDescription,
      description: first.uacsDescription,
      totalNetAllotment,
      totalNetObligation,
      netAllotment: totalNetAllotment,
      netObligation: totalNetObligation,
      actualBalance,
      balance: actualBalance,
      utilizationRate,
      disbursement,
      unpaidObligations,
      totalUnpaidObligations: unpaidObligations,
      disbursementRate,
    });
  }

  return summaries;
}

/**
 * Rank offices by utilization rate in descending order.
 */
export function rankOffices(
  summaries: OfficeSummary[]
): (OfficeSummary & { rank: number })[] {
  const sorted = [...summaries].sort((a, b) => b.utilizationRate - a.utilizationRate);
  return sorted.map((summary, index) => ({
    ...summary,
    rank: index + 1,
  }));
}
