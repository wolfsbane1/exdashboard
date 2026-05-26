import type { FinanceRecord } from './types';

function selectedValues(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : value;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item !== 'ALL');
}

export function filterRecords(
  records: FinanceRecord[],
  query: Record<string, string | string[] | undefined>
): FinanceRecord[] {
  let filtered = [...records];

  const fiscalYears = selectedValues(query.fiscalYear).map((year) => parseInt(year, 10));
  if (fiscalYears.length > 0) {
    filtered = filtered.filter((record) => fiscalYears.includes(record.fiscalYear));
  }

  const offices = selectedValues(query.office);
  if (offices.length > 0) {
    filtered = filtered.filter((record) => offices.includes(record.officeCode));
  }

  const scope = Array.isArray(query.scope) ? query.scope[0] : query.scope;
  if (scope === 'CENTRAL_OFFICE_ONLY') {
    filtered = filtered.filter((record) => record.officeType === 'CENTRAL_OFFICE');
  } else if (scope === 'ALL_REGIONAL') {
    filtered = filtered.filter((record) => record.officeType === 'REGIONAL_OFFICE');
  } else if (scope === 'SINGLE_REGIONAL' && offices.length > 0) {
    filtered = filtered.filter((record) => offices.includes(record.officeCode));
  }

  const appropriationTypes = selectedValues(query.appropriationType);
  if (appropriationTypes.length > 0) {
    filtered = filtered.filter((record) => appropriationTypes.includes(record.appropriationType));
  }

  const paps = selectedValues(query.pap);
  if (paps.length > 0) {
    filtered = filtered.filter((record) => paps.includes(record.papCode));
  }

  const uacsCodes = selectedValues(query.uacs);
  if (uacsCodes.length > 0) {
    filtered = filtered.filter((record) => uacsCodes.includes(record.uacsCode));
  }

  return filtered;
}

export function aggregateRecords(records: FinanceRecord[]) {
  const summary = {
    totalAllotment: 0,
    totalModification: 0,
    totalWithdrawal: 0,
    totalNetAllotment: 0,
    totalObligations: 0,
    totalNetObligation: 0,
    actualBalance: 0,
    earmarks: 0,
    balanceLessEarmarks: 0,
    disbursement: 0,
    unpaidObligations: 0,
    utilizationRate: 0,
    disbursementRate: 0,
  };

  for (const record of records) {
    summary.totalAllotment += record.totalAllotment;
    summary.totalModification += record.totalModification;
    summary.totalWithdrawal += record.totalWithdrawal;
    summary.totalNetAllotment += record.totalNetAllotment;
    summary.totalObligations += record.totalObligations;
    summary.totalNetObligation += record.totalNetObligation;
    summary.actualBalance += record.actualBalance;
    summary.earmarks += record.earmarks;
    summary.balanceLessEarmarks += record.balanceLessEarmarks;
    summary.disbursement += record.disbursement;
    summary.unpaidObligations += record.unpaidObligations;
  }

  summary.utilizationRate = summary.totalNetAllotment !== 0
    ? Math.round((summary.totalNetObligation / summary.totalNetAllotment) * 10000) / 100
    : 0;
  summary.disbursementRate = summary.totalNetObligation !== 0
    ? Math.round((summary.disbursement / summary.totalNetObligation) * 10000) / 100
    : 0;

  return summary;
}

export function groupByField(records: FinanceRecord[], field: 'officeCode' | 'papCode' | 'uacsCode') {
  const groups: Record<string, FinanceRecord[]> = {};
  for (const record of records) {
    const key = record[field];
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  }

  return Object.entries(groups).map(([, groupRecords]) => {
    const aggregate = aggregateRecords(groupRecords);
    const first = groupRecords[0];
    if (field === 'officeCode') {
      return {
        officeCode: first.officeCode,
        officeName: first.officeName,
        officeType: first.officeType,
        regionCode: first.regionCode,
        recordCount: groupRecords.length,
        ...aggregate,
      };
    }
    if (field === 'papCode') {
      return {
        papCode: first.papCode,
        papDescription: first.papDescription,
        recordCount: groupRecords.length,
        ...aggregate,
      };
    }
    return {
      uacsCode: first.uacsCode,
      uacsDescription: first.uacsDescription,
      recordCount: groupRecords.length,
      ...aggregate,
    };
  });
}
