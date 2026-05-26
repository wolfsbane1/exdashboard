import type { FinanceRecord, Office, PAP, UACS } from './types';

export const DEMO_OFFICES: Office[] = [
  { code: 'CENTRAL_OFFICE', name: 'Central Office', type: 'CENTRAL_OFFICE', regionCode: 'CO' },
  { code: 'NCR', name: 'NCR', type: 'REGIONAL_OFFICE', regionCode: 'NCR' },
  { code: 'CAR', name: 'CAR', type: 'REGIONAL_OFFICE', regionCode: 'CAR' },
  { code: 'REGION_I', name: 'Region I - Ilocos', type: 'REGIONAL_OFFICE', regionCode: 'R01' },
  { code: 'REGION_II', name: 'Region II - Cagayan Valley', type: 'REGIONAL_OFFICE', regionCode: 'R02' },
  { code: 'REGION_III', name: 'Region III - Central Luzon', type: 'REGIONAL_OFFICE', regionCode: 'R03' },
  { code: 'CALABARZON', name: 'CALABARZON', type: 'REGIONAL_OFFICE', regionCode: 'R04A' },
  { code: 'MIMAROPA', name: 'MIMAROPA', type: 'REGIONAL_OFFICE', regionCode: 'R04B' },
  { code: 'REGION_V', name: 'Region V - Bicol', type: 'REGIONAL_OFFICE', regionCode: 'R05' },
  { code: 'REGION_VI', name: 'Region VI - Western Visayas', type: 'REGIONAL_OFFICE', regionCode: 'R06' },
  { code: 'REGION_VII', name: 'Region VII - Central Visayas', type: 'REGIONAL_OFFICE', regionCode: 'R07' },
  { code: 'REGION_VIII', name: 'Region VIII - Eastern Visayas', type: 'REGIONAL_OFFICE', regionCode: 'R08' },
  { code: 'REGION_IX', name: 'Region IX - Zamboanga Peninsula', type: 'REGIONAL_OFFICE', regionCode: 'R09' },
  { code: 'REGION_X', name: 'Region X - Northern Mindanao', type: 'REGIONAL_OFFICE', regionCode: 'R10' },
  { code: 'REGION_XI', name: 'Region XI - Davao', type: 'REGIONAL_OFFICE', regionCode: 'R11' },
  { code: 'REGION_XII', name: 'Region XII - SOCCSKSARGEN', type: 'REGIONAL_OFFICE', regionCode: 'R12' },
  { code: 'CARAGA', name: 'Caraga', type: 'REGIONAL_OFFICE', regionCode: 'R13' },
  { code: 'BARMM', name: 'BARMM', type: 'REGIONAL_OFFICE', regionCode: 'BARMM' },
];

export const DEMO_PAPS: PAP[] = [
  { code: '100000100001000', description: 'General Management and Supervision' },
  { code: '100000100002000', description: 'Protective Services for Individuals and Families in Difficult Circumstances' },
  { code: '100000100003000', description: 'Disaster Response and Rehabilitation Program' },
  { code: '100000100004000', description: 'Pantawid Pamilyang Pilipino Program (4Ps)' },
  { code: '100000100005000', description: 'Sustainable Livelihood Program (SLP)' },
  { code: '100000100006000', description: 'Administrative Support Services' },
  { code: '100000100007000', description: 'Social Pension for Indigent Senior Citizens' },
];

export const DEMO_UACS_CODES: UACS[] = [
  { code: '5020101000', description: 'Traveling Expenses-Local' },
  { code: '5020201000', description: 'Training Expenses' },
  { code: '5020301000', description: 'Office Supplies Expenses' },
  { code: '5020302000', description: 'Accountable Forms Expenses' },
  { code: '5020309000', description: 'Fuel, Oil and Lubricants Expenses' },
  { code: '5020322001', description: 'Semi-Expendable Furniture, Fixtures and Books Expenses' },
  { code: '5029901000', description: 'Other Maintenance and Operating Expenses' },
  { code: '5010101000', description: 'Salaries and Wages' },
  { code: '5010201000', description: 'PERA' },
  { code: '5021101000', description: 'Utility Expenses' },
];

const OFFICE_MULTIPLIERS: Record<string, number> = {
  CENTRAL_OFFICE: 3.5,
  NCR: 2.5,
  CAR: 0.7,
  REGION_I: 0.9,
  REGION_II: 0.8,
  REGION_III: 1.5,
  CALABARZON: 2.0,
  MIMAROPA: 0.6,
  REGION_V: 1.0,
  REGION_VI: 1.1,
  REGION_VII: 1.3,
  REGION_VIII: 0.85,
  REGION_IX: 0.75,
  REGION_X: 0.95,
  REGION_XI: 1.2,
  REGION_XII: 0.7,
  CARAGA: 0.65,
  BARMM: 0.8,
};

const PAP_MULTIPLIERS: Record<string, number> = {
  '100000100001000': 1.0,
  '100000100002000': 0.8,
  '100000100003000': 1.2,
  '100000100004000': 3.5,
  '100000100005000': 0.6,
  '100000100006000': 0.4,
  '100000100007000': 2.0,
};

const UACS_DISTRIBUTION: Record<string, number> = {
  '5010101000': 0.55,
  '5010201000': 0.08,
  '5020101000': 0.07,
  '5020201000': 0.06,
  '5020301000': 0.05,
  '5021101000': 0.05,
  '5020309000': 0.04,
  '5029901000': 0.04,
  '5020302000': 0.03,
  '5020322001': 0.03,
};

const REGION_V_GMS_BASELINE = {
  totalAllotment: 827942769.39,
  totalModification: -157646420.67,
  totalWithdrawal: -872615.07,
  totalNetAllotment: 669423733.65,
  totalObligations: 583325267.05,
  totalNetObligation: 583325267.05,
  actualBalance: 86098466.6,
  utilizationRate: 82.59,
  earmarks: 0,
  balanceLessEarmarks: 86098466.6,
  disbursement: 518601273.08,
  unpaidObligations: 64723993.97,
  disbursementRate: 88.91,
};

const FISCAL_YEAR_MULTIPLIERS: Record<number, number> = {
  2024: 0.92,
  2025: 1.0,
  2026: 1.08,
};

let demoRecords: FinanceRecord[] | null = null;
let loadedAt: string | null = null;

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 13), 0x45d9f3b);
    hash = (hash ^ (hash >>> 16)) >>> 0;
    return hash / 4294967296;
  };
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function generateDemoFinanceRecords(): FinanceRecord[] {
  const records: FinanceRecord[] = [];

  DEMO_OFFICES.forEach((office) => {
    DEMO_PAPS.forEach((pap) => {
      [2024, 2025, 2026].forEach((fiscalYear) => {
        const rng = seededRandom(`${office.code}-${pap.code}-${fiscalYear}`);
        const officeMultiplier = OFFICE_MULTIPLIERS[office.code] || 1;
        const papMultiplier = PAP_MULTIPLIERS[pap.code] || 1;
        const fiscalYearMultiplier = FISCAL_YEAR_MULTIPLIERS[fiscalYear] || 1;
        const isBaseline =
          office.code === 'REGION_V' &&
          pap.code === '100000100001000' &&
          fiscalYear === 2025;

        const utilizationVariance = isBaseline ? 0 : rng() * 0.25 - 0.1;
        const disbursementVariance = isBaseline ? 0 : rng() * 0.15 - 0.03;
        const targetUtilization = isBaseline
          ? REGION_V_GMS_BASELINE.utilizationRate / 100
          : Math.min(0.95, Math.max(0.7, 0.8259 + utilizationVariance));
        const targetDisbursementRate = isBaseline
          ? REGION_V_GMS_BASELINE.disbursementRate / 100
          : Math.min(0.97, Math.max(0.8, 0.938 + disbursementVariance));

        DEMO_UACS_CODES.forEach((uacs) => {
          const uacsPercent = UACS_DISTRIBUTION[uacs.code] || 0.05;
          const combinedMultiplier = officeMultiplier * papMultiplier * fiscalYearMultiplier;
          const uacsVariance = isBaseline ? 1 : 0.85 + rng() * 0.3;

          let totalAllotment: number;
          let totalModification: number;
          let totalWithdrawal: number;
          let totalNetAllotment: number;
          let totalObligations: number;
          let disbursement: number;

          if (isBaseline) {
            totalAllotment = REGION_V_GMS_BASELINE.totalAllotment * uacsPercent;
            totalModification = REGION_V_GMS_BASELINE.totalModification * uacsPercent;
            totalWithdrawal = REGION_V_GMS_BASELINE.totalWithdrawal * uacsPercent;
            totalNetAllotment = REGION_V_GMS_BASELINE.totalNetAllotment * uacsPercent;
            totalObligations = REGION_V_GMS_BASELINE.totalObligations * uacsPercent;
            disbursement = REGION_V_GMS_BASELINE.disbursement * uacsPercent;
          } else {
            totalAllotment =
              REGION_V_GMS_BASELINE.totalAllotment *
              uacsPercent *
              combinedMultiplier *
              uacsVariance;
            totalModification = totalAllotment * (-0.15 - rng() * 0.1);
            totalWithdrawal = -(totalAllotment * (0.0005 + rng() * 0.002));
            totalNetAllotment = totalAllotment + totalModification - Math.abs(totalWithdrawal);
            totalObligations = totalNetAllotment * targetUtilization * (0.98 + rng() * 0.04);
            disbursement = totalObligations * targetDisbursementRate * (0.98 + rng() * 0.04);
          }

          const totalNetObligation = totalObligations;
          const actualBalance = totalNetAllotment - totalNetObligation;
          const utilizationRate = totalNetAllotment !== 0 ? (totalNetObligation / totalNetAllotment) * 100 : 0;
          const earmarks = 0;
          const balanceLessEarmarks = actualBalance - earmarks;
          const unpaidObligations = totalNetObligation - disbursement;
          const disbursementRate = totalNetObligation !== 0 ? (disbursement / totalNetObligation) * 100 : 0;

          records.push({
            id: `${office.code}-${pap.code}-${uacs.code}-${fiscalYear}`,
            fiscalYear,
            period: 'FULL_YEAR',
            officeCode: office.code,
            officeName: office.name,
            officeType: office.type,
            regionCode: office.regionCode,
            papCode: pap.code,
            papDescription: pap.description,
            appropriationType: 'CURRENT',
            fundSource: 'General Appropriations Act',
            fundCluster: '01',
            uacsCode: uacs.code,
            uacsDescription: uacs.description,
            totalAllotment: money(totalAllotment),
            totalModification: money(totalModification),
            totalWithdrawal: money(totalWithdrawal),
            totalNetAllotment: money(totalNetAllotment),
            totalObligations: money(totalObligations),
            totalNetObligation: money(totalNetObligation),
            actualBalance: money(actualBalance),
            utilizationRate: money(utilizationRate),
            earmarks,
            balanceLessEarmarks: money(balanceLessEarmarks),
            disbursement: money(disbursement),
            unpaidObligations: money(unpaidObligations),
            disbursementRate: money(disbursementRate),
            sourceModule: 'DEMO_SAMPLE_DATA',
            lastUpdated: '2025-05-21T09:00:00.000Z',
          });
        });
      });
    });
  });

  return records;
}

export function loadDemoDataset() {
  demoRecords = generateDemoFinanceRecords();
  loadedAt = new Date().toISOString();
  return getDemoDatasetStatus();
}

export function clearDemoDataset() {
  demoRecords = null;
  loadedAt = null;
  return getDemoDatasetStatus();
}

export function getDemoFinanceRecords() {
  return demoRecords;
}

export function getDemoDatasetStatus() {
  return {
    loaded: Boolean(demoRecords),
    recordCount: demoRecords?.length || 0,
    loadedAt,
    sourceModule: demoRecords ? 'DEMO_SAMPLE_DATA' : null,
  };
}
