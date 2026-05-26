export type OfficeType = 'CENTRAL_OFFICE' | 'REGIONAL_OFFICE';
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
  appropriationType: string;
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

export interface ScenarioStore {
  id: string;
  name: string;
  description: string;
  baselineScope: string;
  officeName: string;
  fiscalYear: number;
  assumptions: any[];
  projectedResults: any | null;
  baselineData: any | null;
  status: string;
  createdBy: string;
  createdAt: string;
}

export interface DashboardStore {
  id: string;
  name: string;
  description: string;
  scope: string;
  widgets: any[];
  filters: any;
  visibility: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
