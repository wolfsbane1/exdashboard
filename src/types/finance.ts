export type OfficeType = 'CENTRAL_OFFICE' | 'REGIONAL_OFFICE';
export type AppropriationType = 'CURRENT' | 'CONTINUING' | 'TRUST_FUND' | 'ALL';
export type ViewScope = 'ENTIRE_DSWD' | 'CENTRAL_OFFICE_ONLY' | 'ALL_REGIONAL' | 'SINGLE_REGIONAL';
export type Period = 'FULL_YEAR' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'MONTHLY';

export interface FinanceRecord {
  id: string;
  fiscalYear: number;
  period: Period;
  officeCode: string;
  officeName: string;
  officeType: OfficeType;
  regionCode: string;
  papCode: string;
  papDescription: string;
  appropriationType: AppropriationType;
  fundSource: string;
  fundCluster: string;
  uacsCode: string;
  uacsDescription: string;
  totalAllotment: number;
  totalModification: number;
  totalWithdrawal: number;
  totalNetAllotment: number;
  totalObligations: number;
  totalNetObligation: number;
  actualBalance: number;
  utilizationRate: number;
  earmarks: number;
  balanceLessEarmarks: number;
  disbursement: number;
  unpaidObligations: number;
  disbursementRate: number;
  sourceModule: string;
  lastUpdated: string;
}

export interface OfficeSummary {
  officeCode: string;
  officeName: string;
  officeType: OfficeType;
  regionCode: string;
  totalNetAllotment: number;
  totalNetObligation: number;
  netAllotment: number;
  netObligation: number;
  actualBalance: number;
  balance: number;
  utilizationRate: number;
  earmarks: number;
  balanceLessEarmarks: number;
  disbursement: number;
  unpaidObligations: number;
  totalUnpaidObligations: number;
  disbursementRate: number;
  recordCount: number;
  aging?: Record<string, number>;
}

export interface PAPSummary {
  papCode: string;
  papDescription: string;
  papName: string;
  totalNetAllotment: number;
  totalNetObligation: number;
  netAllotment: number;
  netObligation: number;
  actualBalance: number;
  balance: number;
  utilizationRate: number;
  disbursement: number;
  unpaidObligations: number;
  totalUnpaidObligations: number;
  disbursementRate: number;
}

export interface UACSummary {
  uacsCode: string;
  uacsDescription: string;
  uacsName: string;
  description: string;
  totalNetAllotment: number;
  totalNetObligation: number;
  netAllotment: number;
  netObligation: number;
  actualBalance: number;
  balance: number;
  utilizationRate: number;
  disbursement: number;
  unpaidObligations: number;
  totalUnpaidObligations: number;
  disbursementRate: number;
}

export interface FinanceSummary {
  totalNetAllotment: number;
  totalNetObligation: number;
  netAllotment: number;
  netObligation: number;
  actualBalance: number;
  utilizationRate: number;
  earmarks: number;
  balanceLessEarmarks: number;
  disbursement: number;
  totalDisbursement: number;
  unpaidObligations: number;
  disbursementRate: number;
  totalAllotment: number;
  totalModification: number;
  totalWithdrawal: number;
  totalObligations: number;
}

export interface Office {
  code: string;
  name: string;
  type: OfficeType;
  regionCode: string;
}

export interface PAP {
  code: string;
  description: string;
}

export interface UACS {
  code: string;
  description: string;
}

export interface FilterState {
  scope: ViewScope;
  office: string[];
  fiscalYear: string[];
  appropriationType: string[];
  pap: string[];
  uacs: string;
  period: Period;
}

export type UserRole =
  | 'MANAGEMENT_VIEWER'
  | 'CENTRAL_OFFICE_FINANCE'
  | 'REGIONAL_FINANCE_VIEWER'
  | 'DASHBOARD_DESIGNER'
  | 'SYSTEM_ADMINISTRATOR';

export type ThresholdLevel = 'good' | 'monitoring' | 'low' | 'critical';
