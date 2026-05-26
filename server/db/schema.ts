import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const dashboardTemplates = pgTable('dashboard_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  scope: text('scope').notNull(),
  widgets: jsonb('widgets').$type<any[]>().notNull().default([]),
  filters: jsonb('filters').$type<Record<string, unknown>>().notNull().default({}),
  visibility: text('visibility').notNull(),
  createdBy: text('created_by').notNull().default('System'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const savedDashboards = pgTable('saved_dashboards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  scope: text('scope').notNull(),
  widgets: jsonb('widgets').$type<any[]>().notNull().default([]),
  filters: jsonb('filters').$type<Record<string, unknown>>().notNull().default({}),
  visibility: text('visibility').notNull(),
  createdBy: text('created_by').notNull().default('current-user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const financialScenarios = pgTable('financial_scenarios', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  baselineScope: text('baseline_scope').notNull(),
  officeName: text('office_name').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  assumptions: jsonb('assumptions').$type<any[]>().notNull().default([]),
  projectedResults: jsonb('projected_results').$type<Record<string, unknown> | null>(),
  baselineData: jsonb('baseline_data').$type<Record<string, unknown> | null>(),
  status: text('status').notNull().default('DRAFT'),
  createdBy: text('created_by').notNull().default('current-user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
