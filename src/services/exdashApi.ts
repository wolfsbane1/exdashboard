import axios from 'axios';
import type { AxiosError } from 'axios';
import type {
  FilterState,
  FinanceSummary,
  FinanceRecord,
  OfficeSummary,
  PAPSummary,
  UACSummary,
  Office,
  PAP,
  UACS,
} from '../types/finance';
import type { DashboardDefinition } from '../types/dashboard';
import type { FinancialScenario, FinancialAssumption } from '../types/scenario';

const API_BASE_URL = import.meta.env.VITE_EXDASH_API_URL || '/api/exdash';

export interface DemoDatasetStatus {
  loaded: boolean;
  recordCount: number;
  loadedAt: string | null;
  sourceModule: string | null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const message = error.response?.data?.message || error.response?.data?.error;
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

type ApiParams = Record<string, string | number | undefined>;

function toApiParams(params: Partial<FilterState>): ApiParams {
  const next: ApiParams = {};

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) next[key] = value.join(',');
      return;
    }
    if (value !== undefined && value !== 'ALL') next[key] = value;
  });

  return next;
}

function withSummaryAliases<T extends Partial<FinanceSummary>>(summary: T): T & FinanceSummary {
  return {
    ...summary,
    netAllotment: summary.totalNetAllotment,
    netObligation: summary.totalNetObligation,
    totalDisbursement: summary.disbursement,
  } as T & FinanceSummary;
}

function withOfficeAliases<T extends Partial<OfficeSummary>>(item: T): T & OfficeSummary {
  return {
    ...item,
    netAllotment: item.totalNetAllotment,
    netObligation: item.totalNetObligation,
    balance: item.actualBalance,
    totalUnpaidObligations: item.unpaidObligations,
  } as T & OfficeSummary;
}

function withPapAliases<T extends Partial<PAPSummary>>(item: T): T & PAPSummary {
  return {
    ...item,
    papName: item.papDescription,
    netAllotment: item.totalNetAllotment,
    netObligation: item.totalNetObligation,
    balance: item.actualBalance,
    totalUnpaidObligations: item.unpaidObligations,
  } as T & PAPSummary;
}

function withUacsAliases<T extends Partial<UACSummary>>(item: T): T & UACSummary {
  return {
    ...item,
    uacsName: item.uacsDescription,
    description: item.uacsDescription,
    netAllotment: item.totalNetAllotment,
    netObligation: item.totalNetObligation,
    balance: item.actualBalance,
    totalUnpaidObligations: item.unpaidObligations,
  } as T & UACSummary;
}

// TODO: Production EMPOWERX deployment
// The browser calls exDASH. The exDASH backend reads and aggregates
// finance data from the EMPOWERX FSDS database; clients should not
// connect to FSDS directly.
// api.interceptors.request.use((config) => {
//   const empowerxToken = getEmpowerxAuthToken();
//   if (empowerxToken) {
//     config.headers.Authorization = `Bearer ${empowerxToken}`;
//   }
//   return config;
// });

// ─── Health ───────────────────────────────────────────────────────────

export async function getHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  const response = await api.get<{ status: string; service: string; timestamp: string }>('/health');
  return response.data;
}

export async function getDemoDatasetStatus(): Promise<DemoDatasetStatus> {
  const response = await api.get<DemoDatasetStatus>('/demo-dataset/status');
  return response.data;
}

export async function loadDemoDataset(): Promise<DemoDatasetStatus> {
  const response = await api.post<DemoDatasetStatus>('/demo-dataset/load');
  return response.data;
}

export async function clearDemoDataset(): Promise<DemoDatasetStatus> {
  const response = await api.delete<DemoDatasetStatus>('/demo-dataset');
  return response.data;
}

// ─── Finance Summary & Records ────────────────────────────────────────

export async function getFinanceSummary(params: Partial<FilterState>): Promise<FinanceSummary> {
  const response = await api.get<FinanceSummary>('/finance/summary', { params: toApiParams(params) });
  return withSummaryAliases(response.data);
}

export async function getFinanceRecords(params: Partial<FilterState>): Promise<FinanceRecord[]> {
  const response = await api.get<FinanceRecord[] | { data: FinanceRecord[] }>('/finance/records', {
    params: toApiParams(params),
  });
  return Array.isArray(response.data) ? response.data : response.data.data;
}

// ─── Grouped Finance Data ─────────────────────────────────────────────

export async function getFinanceByOffice(params: Partial<FilterState>): Promise<OfficeSummary[]> {
  const response = await api.get<OfficeSummary[]>('/finance/by-office', { params: toApiParams(params) });
  return response.data.map(withOfficeAliases);
}

export async function getFinanceByPap(params: Partial<FilterState>): Promise<PAPSummary[]> {
  const response = await api.get<PAPSummary[]>('/finance/by-pap', { params: toApiParams(params) });
  return response.data.map(withPapAliases);
}

export async function getFinanceByUacs(params: Partial<FilterState>): Promise<UACSummary[]> {
  const response = await api.get<UACSummary[]>('/finance/by-uacs', { params: toApiParams(params) });
  return response.data.map(withUacsAliases);
}

// ─── Disbursement & Unpaid ────────────────────────────────────────────

export async function getDisbursements(params: Partial<FilterState>): Promise<OfficeSummary[]> {
  const response = await api.get<OfficeSummary[]>('/finance/disbursements', { params: toApiParams(params) });
  return response.data.map(withOfficeAliases);
}

export async function getUnpaidObligations(params: Partial<FilterState>): Promise<OfficeSummary[]> {
  const response = await api.get<OfficeSummary[]>('/finance/unpaid-obligations', {
    params: toApiParams(params),
  });
  return response.data.map(withOfficeAliases);
}

// ─── Reference Data ───────────────────────────────────────────────────

export async function getOffices(): Promise<Office[]> {
  const response = await api.get<Office[]>('/reference/offices');
  return response.data;
}

export async function getPaps(): Promise<PAP[]> {
  const response = await api.get<PAP[]>('/reference/paps');
  return response.data;
}

export async function getUacsList(): Promise<UACS[]> {
  const response = await api.get<UACS[]>('/reference/uacs');
  return response.data;
}

// ─── Scenario Modeling ────────────────────────────────────────────────

export async function createScenario(data: {
  name: string;
  description?: string;
  baselineScope: string;
  officeName?: string;
  fiscalYear?: number;
}): Promise<FinancialScenario> {
  const response = await api.post<FinancialScenario>('/scenarios', data);
  return response.data;
}

export async function getScenarios(): Promise<FinancialScenario[]> {
  const response = await api.get<FinancialScenario[]>('/scenarios');
  return response.data;
}

export async function getScenario(id: string): Promise<FinancialScenario> {
  const response = await api.get<FinancialScenario>(`/scenarios/${id}`);
  return response.data;
}

export async function addAssumption(
  scenarioId: string,
  assumption: Omit<FinancialAssumption, 'id'>
): Promise<FinancialScenario> {
  const response = await api.post<FinancialScenario>(
    `/scenarios/${scenarioId}/assumptions`,
    assumption
  );
  return response.data;
}

export async function computeScenario(id: string): Promise<FinancialScenario> {
  const response = await api.post<FinancialScenario>(`/scenarios/${id}/compute`);
  return response.data;
}

export async function compareScenarios(ids: string[]): Promise<FinancialScenario[]> {
  const response = await api.post<FinancialScenario[]>('/scenarios/compare', { ids });
  return response.data;
}

// ─── Dashboard Management ─────────────────────────────────────────────

export async function getDashboardTemplates(): Promise<DashboardDefinition[]> {
  const response = await api.get<DashboardDefinition[]>('/dashboard-templates');
  return response.data;
}

export async function saveDashboard(
  dashboard: Omit<DashboardDefinition, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DashboardDefinition> {
  const response = await api.post<DashboardDefinition>('/dashboards', dashboard);
  return response.data;
}

export async function getDashboards(): Promise<DashboardDefinition[]> {
  const response = await api.get<DashboardDefinition[]>('/dashboards');
  return response.data;
}

export async function updateDashboard(
  id: string,
  dashboard: Partial<DashboardDefinition>
): Promise<DashboardDefinition> {
  const response = await api.put<DashboardDefinition>(`/dashboards/${id}`, dashboard);
  return response.data;
}

export async function deleteDashboard(id: string): Promise<void> {
  await api.delete(`/dashboards/${id}`);
}
