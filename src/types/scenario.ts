export type AssumptionType = 'ALLOTMENT' | 'OBLIGATION' | 'DISBURSEMENT' | 'EARMARK' | 'TARGET';
export type AssumptionMethod = 'AMOUNT' | 'PERCENTAGE' | 'TARGET_RATE';
export type ScenarioStatus = 'DRAFT' | 'FOR_REVIEW' | 'APPROVED' | 'ARCHIVED';
export type RiskLevel = 'CRITICAL' | 'LOW_UTILIZATION' | 'PAYMENT_RISK' | 'HEALTHY' | 'TIGHT_BALANCE';

export interface FinancialAssumption {
  id: string;
  type: AssumptionType;
  label: string;
  method: AssumptionMethod;
  value: number;
  targetMetric: string;
  affectedOffice: string;
  affectedPap: string;
  affectedUacs: string;
  notes: string;
}

export interface ProjectedResults {
  projectedNetAllotment: number;
  projectedNetObligation: number;
  projectedActualBalance: number;
  projectedUtilizationRate: number;
  projectedDisbursement: number;
  projectedUnpaidObligations: number;
  projectedDisbursementRate: number;
  additionalObligationsNeeded: number;
  riskLevel: RiskLevel;
  riskNotes: string[];
}

export interface FinancialScenario {
  id: string;
  name: string;
  description: string;
  baselineScope: string;
  officeName: string;
  fiscalYear: number;
  assumptions: FinancialAssumption[];
  projectedResults: ProjectedResults | null;
  baselineData: {
    netAllotment: number;
    netObligation: number;
    actualBalance: number;
    utilizationRate: number;
    disbursement: number;
    unpaidObligations: number;
    disbursementRate: number;
  } | null;
  status: ScenarioStatus;
  createdBy: string;
  createdAt: string;
}

export interface ScenarioPreset {
  name: string;
  description: string;
  assumptions: Omit<FinancialAssumption, 'id'>[];
}
