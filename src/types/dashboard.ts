import { FilterState } from './finance';

export type WidgetType = 'KPI' | 'BAR' | 'LINE' | 'DONUT' | 'TABLE' | 'PROGRESS' | 'ALERT' | 'SCENARIO';
export type DashboardVisibility = 'PRIVATE' | 'OFFICE' | 'MANAGEMENT' | 'DSWD_WIDE';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  metric: string;
  groupBy: string;
  filters: Partial<FilterState>;
  x: number;
  y: number;
  w: number;
  h: number;
  settings: Record<string, unknown>;
}

export interface DashboardDefinition {
  id: string;
  name: string;
  description: string;
  scope: string;
  widgets: DashboardWidget[];
  filters: Partial<FilterState>;
  visibility: DashboardVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
