// ============================================================
// exDASH Scenario Computation Engine
// Financial scenario simulation and projection calculator
// ============================================================

interface ScenarioInput {
  baselineNetAllotment: number;
  baselineNetObligation: number;
  baselineActualBalance: number;
  baselineUtilizationRate: number;
  baselineDisbursement: number;
  baselineUnpaidObligations: number;
  baselineDisbursementRate: number;
}

interface Assumption {
  id: string;
  type: 'ALLOTMENT' | 'OBLIGATION' | 'DISBURSEMENT' | 'EARMARK' | 'TARGET';
  label: string;
  method: 'AMOUNT' | 'PERCENTAGE' | 'TARGET_RATE';
  value: number;
  targetMetric: string;
  affectedOffice: string;
  affectedPap: string;
  affectedUacs: string;
  notes: string;
}

interface ProjectedResults {
  projectedNetAllotment: number;
  projectedNetObligation: number;
  projectedActualBalance: number;
  projectedUtilizationRate: number;
  projectedDisbursement: number;
  projectedUnpaidObligations: number;
  projectedDisbursementRate: number;
  additionalObligationsNeeded: number;
  riskLevel: string;
  riskNotes: string[];
}

export function computeScenario(baseline: ScenarioInput, assumptions: Assumption[]): ProjectedResults {
  let netAllotment = baseline.baselineNetAllotment;
  let netObligation = baseline.baselineNetObligation;
  let disbursement = baseline.baselineDisbursement;
  let additionalObligationsNeeded = 0;

  for (const a of assumptions) {
    switch (a.type) {
      case 'ALLOTMENT':
        if (a.method === 'AMOUNT') {
          netAllotment += a.value;
        } else if (a.method === 'PERCENTAGE') {
          netAllotment *= (1 + a.value / 100);
        }
        break;

      case 'OBLIGATION':
        if (a.method === 'AMOUNT') {
          netObligation += a.value;
        } else if (a.method === 'PERCENTAGE') {
          netObligation *= (1 + a.value / 100);
        }
        break;

      case 'DISBURSEMENT':
        if (a.method === 'AMOUNT') {
          disbursement += a.value;
        } else if (a.method === 'PERCENTAGE') {
          disbursement *= (1 + a.value / 100);
        }
        break;

      case 'TARGET':
        if (a.method === 'TARGET_RATE') {
          if (a.targetMetric === 'UTILIZATION' || a.targetMetric === 'UTILIZATION_RATE') {
            const targetObligation = netAllotment * (a.value / 100);
            additionalObligationsNeeded = targetObligation - netObligation;
            if (additionalObligationsNeeded > 0) {
              netObligation = targetObligation;
            }
          } else if (a.targetMetric === 'DISBURSEMENT_RATE') {
            const targetDisbursement = netObligation * (a.value / 100);
            const additionalDisbursement = targetDisbursement - disbursement;
            if (additionalDisbursement > 0) {
              disbursement = targetDisbursement;
            }
          }
        }
        break;

      case 'EARMARK':
        // Earmarks don't change obligations directly in this model
        break;
    }
  }

  const projectedActualBalance = netAllotment - netObligation;
  const projectedUtilizationRate = netAllotment !== 0 ? (netObligation / netAllotment) * 100 : 0;
  const projectedUnpaidObligations = netObligation - disbursement;
  const projectedDisbursementRate = netObligation !== 0 ? (disbursement / netObligation) * 100 : 0;

  const results: ProjectedResults = {
    projectedNetAllotment: Math.round(netAllotment * 100) / 100,
    projectedNetObligation: Math.round(netObligation * 100) / 100,
    projectedActualBalance: Math.round(projectedActualBalance * 100) / 100,
    projectedUtilizationRate: Math.round(projectedUtilizationRate * 100) / 100,
    projectedDisbursement: Math.round(disbursement * 100) / 100,
    projectedUnpaidObligations: Math.round(projectedUnpaidObligations * 100) / 100,
    projectedDisbursementRate: Math.round(projectedDisbursementRate * 100) / 100,
    additionalObligationsNeeded: Math.round(additionalObligationsNeeded * 100) / 100,
    riskLevel: '',
    riskNotes: [],
  };

  const risk = assessRisk(results);
  results.riskLevel = risk.riskLevel;
  results.riskNotes = risk.riskNotes;

  return results;
}

export function assessRisk(results: ProjectedResults): { riskLevel: string; riskNotes: string[] } {
  const notes: string[] = [];
  let riskLevel = 'HEALTHY';

  if (results.projectedActualBalance < 0) {
    riskLevel = 'CRITICAL';
    notes.push('Projected balance is negative — obligations exceed allotment.');
  }

  if (results.projectedUtilizationRate < 75) {
    riskLevel = riskLevel === 'CRITICAL' ? 'CRITICAL' : 'LOW_UTILIZATION';
    notes.push(`Projected utilization rate is ${results.projectedUtilizationRate.toFixed(2)}%, below the 75% threshold.`);
  }

  const unpaidRatio = results.projectedNetObligation !== 0
    ? (results.projectedUnpaidObligations / results.projectedNetObligation) * 100 : 0;
  if (unpaidRatio > 10) {
    if (riskLevel === 'HEALTHY') riskLevel = 'PAYMENT_RISK';
    notes.push(`Projected unpaid obligations are ${unpaidRatio.toFixed(2)}% of net obligation, exceeding the 10% threshold.`);
  }

  if (results.projectedUtilizationRate > 99 && results.projectedActualBalance >= 0) {
    riskLevel = 'TIGHT_BALANCE';
    notes.push('Projected utilization is above 99% — very tight remaining balance.');
  } else if (results.projectedUtilizationRate >= 90 && results.projectedUtilizationRate <= 98 && results.projectedActualBalance > 0 && riskLevel === 'HEALTHY') {
    notes.push('Projected metrics are within healthy range.');
  }

  if (notes.length === 0) {
    notes.push('No significant risk factors identified.');
  }

  return { riskLevel, riskNotes: notes };
}

export function generatePresets(baseline: ScenarioInput): Record<string, Assumption[]> {
  return {
    'Baseline': [],
    'Conservative': [
      { id: 'p-c1', type: 'ALLOTMENT', label: 'Add 2% allotment', method: 'PERCENTAGE', value: 2, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Conservative allotment increase' },
      { id: 'p-c2', type: 'OBLIGATION', label: 'Increase obligations by 5%', method: 'PERCENTAGE', value: 5, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Conservative obligation growth' },
    ],
    'Realistic': [
      { id: 'p-r1', type: 'ALLOTMENT', label: 'Add 5% allotment', method: 'PERCENTAGE', value: 5, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Realistic allotment increase' },
      { id: 'p-r2', type: 'OBLIGATION', label: 'Increase obligations by 10%', method: 'PERCENTAGE', value: 10, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Realistic obligation growth' },
      { id: 'p-r3', type: 'DISBURSEMENT', label: 'Increase disbursements by 8%', method: 'PERCENTAGE', value: 8, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Realistic disbursement increase' },
    ],
    'Aggressive': [
      { id: 'p-a1', type: 'OBLIGATION', label: 'Increase obligations by 10%', method: 'PERCENTAGE', value: 10, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Aggressive obligation push' },
      { id: 'p-a2', type: 'DISBURSEMENT', label: 'Increase disbursements by 15%', method: 'PERCENTAGE', value: 15, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Aggressive disbursement acceleration' },
      { id: 'p-a3', type: 'TARGET', label: 'Target 95% utilization', method: 'TARGET_RATE', value: 95, targetMetric: 'UTILIZATION', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Push toward 95% utilization target' },
    ],
    'Management Target': [
      { id: 'p-m1', type: 'TARGET', label: 'Target 95% utilization', method: 'TARGET_RATE', value: 95, targetMetric: 'UTILIZATION', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Management utilization target' },
      { id: 'p-m2', type: 'TARGET', label: 'Target 95% disbursement rate', method: 'TARGET_RATE', value: 95, targetMetric: 'DISBURSEMENT_RATE', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Management disbursement target' },
    ],
    'Worst Case': [
      { id: 'p-w1', type: 'ALLOTMENT', label: 'Reduce allotment by 10%', method: 'PERCENTAGE', value: -10, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Budget cut scenario' },
      { id: 'p-w2', type: 'OBLIGATION', label: 'Increase obligations by 5%', method: 'PERCENTAGE', value: 5, targetMetric: '', affectedOffice: '', affectedPap: '', affectedUacs: '', notes: 'Obligation growth despite cuts' },
    ],
  };
}
