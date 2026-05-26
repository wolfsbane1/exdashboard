import React from 'react';
import { motion } from 'framer-motion';
import { useRole } from '../contexts/RoleContext';
import { useSettings } from '../contexts/SettingsContext';
import * as api from '../services/exdashApi';
import {
  CheckCircle,
  Circle,
  Database as DatabaseIcon,
  Info,
  Pencil,
  Plus,
  Save,
  Settings as SettingsIcon,
  Shield,
  UploadCloud,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import type { UserRole } from '../types/finance';
import type { FilterOption, FilterOptionGroup } from '../data/filterOptions';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'MANAGEMENT_VIEWER', label: 'Management Viewer', description: 'Access to all DSWD-wide dashboards and reports' },
  { value: 'CENTRAL_OFFICE_FINANCE', label: 'Central Office Finance', description: 'Central Office and consolidated views' },
  { value: 'REGIONAL_FINANCE_VIEWER', label: 'Regional Finance Viewer', description: 'Regional dashboard, defaults to Region V' },
  { value: 'DASHBOARD_DESIGNER', label: 'Dashboard Designer', description: 'Can create and customize dashboards' },
  { value: 'SYSTEM_ADMINISTRATOR', label: 'System Administrator', description: 'Full access including API Console and Settings' },
];

const CAPABILITIES: { feature: string; access: Record<UserRole, boolean> }[] = [
  { feature: 'Executive Dashboard', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: false, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Regional Dashboard', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: false, REGIONAL_FINANCE_VIEWER: true, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Consolidated View', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: false, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Regional Comparison', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: false, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'UACS Analysis', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: true, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'PAP Analysis', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: true, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Disbursement Monitoring', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: true, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Unpaid Obligations', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: true, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Financial Assumptions', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: false, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Dashboard Builder', access: { MANAGEMENT_VIEWER: false, CENTRAL_OFFICE_FINANCE: false, REGIONAL_FINANCE_VIEWER: false, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'API Console', access: { MANAGEMENT_VIEWER: false, CENTRAL_OFFICE_FINANCE: false, REGIONAL_FINANCE_VIEWER: false, DASHBOARD_DESIGNER: false, SYSTEM_ADMINISTRATOR: true } },
  { feature: 'Settings', access: { MANAGEMENT_VIEWER: true, CENTRAL_OFFICE_FINANCE: true, REGIONAL_FINANCE_VIEWER: true, DASHBOARD_DESIGNER: true, SYSTEM_ADMINISTRATOR: true } },
];

const OPTION_GROUPS: { key: FilterOptionGroup; title: string; valueLabel: string }[] = [
  { key: 'office', title: 'Office/Region', valueLabel: 'Code' },
  { key: 'fiscalYear', title: 'Fiscal Year', valueLabel: 'Year' },
  { key: 'appropriationType', title: 'Appropriation Type', valueLabel: 'Code' },
  { key: 'pap', title: 'PAP', valueLabel: 'Code' },
];

function OptionCrudCard({
  group,
  title,
  valueLabel,
  options,
}: {
  group: FilterOptionGroup;
  title: string;
  valueLabel: string;
  options: FilterOption[];
}) {
  const { addFilterOption, updateFilterOption, deleteFilterOption } = useSettings();
  const [newLabel, setNewLabel] = React.useState('');
  const [newValue, setNewValue] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState('');
  const [editValue, setEditValue] = React.useState('');

  const startEdit = (option: FilterOption) => {
    setEditingId(option.id);
    setEditLabel(option.label);
    setEditValue(option.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
    setEditValue('');
  };

  const handleAdd = () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    addFilterOption(group, { label: newLabel, value: newValue });
    setNewLabel('');
    setNewValue('');
  };

  const handleSave = (id: string) => {
    if (!editLabel.trim() || !editValue.trim()) return;
    updateFilterOption(group, id, { label: editLabel, value: editValue });
    cancelEdit();
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          <p className="text-xs text-gray-400">{options.length} configured choices</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-5 gap-2">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder="Label"
          className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <input
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          placeholder={valueLabel}
          className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      <div className="max-h-72 space-y-2 overflow-auto pr-1">
        {options.map((option) => {
          const isEditing = editingId === option.id;
          return (
            <div
              key={option.id}
              className="grid grid-cols-12 items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
            >
              {isEditing ? (
                <>
                  <input
                    value={editLabel}
                    onChange={(event) => setEditLabel(event.target.value)}
                    className="col-span-5 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-red-400"
                  />
                  <input
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                    className="col-span-5 rounded-md border border-gray-200 px-2 py-1.5 text-sm font-mono outline-none focus:border-red-400"
                  />
                  <button
                    onClick={() => handleSave(option.id)}
                    className="flex h-8 items-center justify-center rounded-md bg-green-600 text-white"
                    aria-label="Save option"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex h-8 items-center justify-center rounded-md border border-gray-200 text-gray-500"
                    aria-label="Cancel edit"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div className="col-span-5 truncate text-sm font-medium text-gray-700">{option.label}</div>
                  <code className="col-span-5 truncate rounded bg-white px-2 py-1 text-xs text-gray-500">
                    {option.value}
                  </code>
                  <button
                    onClick={() => startEdit(option)}
                    className="flex h-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-white hover:text-red-600"
                    aria-label="Edit option"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteFilterOption(group, option.id)}
                    className="flex h-8 items-center justify-center rounded-md border border-red-100 text-red-500 transition-colors hover:bg-red-50"
                    aria-label="Delete option"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Settings() {
  const { role, setRole } = useRole();
  const { filterOptions, resetFilterOptions } = useSettings();
  const [health, setHealth] = React.useState<any>(null);
  const [demoDataset, setDemoDataset] = React.useState<api.DemoDatasetStatus | null>(null);
  const [demoAction, setDemoAction] = React.useState<'load' | 'clear' | null>(null);
  const [demoError, setDemoError] = React.useState<string | null>(null);

  const refreshSystemStatus = React.useCallback(async () => {
    const [healthResult, demoResult] = await Promise.all([
      api.getHealth().catch(() => ({ status: 'disconnected' })),
      api.getDemoDatasetStatus().catch(() => null),
    ]);
    setHealth(healthResult);
    setDemoDataset(demoResult);
  }, []);

  React.useEffect(() => {
    refreshSystemStatus();
  }, [refreshSystemStatus]);

  const handleLoadDemoDataset = async () => {
    setDemoAction('load');
    setDemoError(null);
    try {
      setDemoDataset(await api.loadDemoDataset());
      await refreshSystemStatus();
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : 'Unable to load demo dataset');
    } finally {
      setDemoAction(null);
    }
  };

  const handleClearDemoDataset = async () => {
    setDemoAction('clear');
    setDemoError(null);
    try {
      setDemoDataset(await api.clearDemoDataset());
      await refreshSystemStatus();
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : 'Unable to clear demo dataset');
    } finally {
      setDemoAction(null);
    }
  };

  const isHealthy = health?.status === 'healthy';
  const isDemoLoaded = Boolean(demoDataset?.loaded);

  return (
    <div className="p-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><SettingsIcon size={24} className="text-red-500" /> Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your exDASH experience</p>
        </motion.div>

        {/* Demo Dataset Controls */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <DatabaseIcon /> Demo Sample Dataset
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Load the previous sample finance dataset for demos, or clear it to return to FSDS-only mode.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isDemoLoaded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isDemoLoaded ? 'Demo data loaded' : 'FSDS-only mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Source</p>
                  <p className="font-medium text-gray-700">{demoDataset?.sourceModule || 'EMPOWERX FSDS'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Records</p>
                  <p className="font-medium text-gray-700">{demoDataset?.recordCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Loaded</p>
                  <p className="font-medium text-gray-700">
                    {demoDataset?.loadedAt ? new Date(demoDataset.loadedAt).toLocaleString() : 'Not loaded'}
                  </p>
                </div>
              </div>
              {demoError && <p className="mt-3 text-xs text-red-600">{demoError}</p>}
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                onClick={handleLoadDemoDataset}
                disabled={demoAction !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UploadCloud size={16} />
                {demoAction === 'load' ? 'Loading...' : 'Load sample data'}
              </button>
              <button
                onClick={handleClearDemoDataset}
                disabled={demoAction !== null || !isDemoLoaded}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />
                {demoAction === 'clear' ? 'Clearing...' : 'Clear sample data'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Role Selector */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><User size={18} /> User Role</h3>
          <div className="grid grid-cols-1 gap-3">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${role === r.value ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === r.value ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <Shield size={20} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${role === r.value ? 'text-red-700' : 'text-gray-700'}`}>{r.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </div>
                {role === r.value && <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"><CheckCircle size={14} className="text-white" /></div>}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Capabilities Matrix */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Shield size={18} /> Role Capabilities Matrix</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Feature</th>
                {ROLES.map(r => (
                  <th key={r.value} className={`text-center py-3 px-2 font-semibold text-xs ${role === r.value ? 'text-red-600' : 'text-gray-500'}`}>
                    {r.label.split(' ').slice(0, 2).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map(cap => (
                <tr key={cap.feature} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-700">{cap.feature}</td>
                  {ROLES.map(r => (
                    <td key={r.value} className="text-center py-2.5 px-2">
                      {cap.access[r.value] ? (
                        <CheckCircle size={16} className="text-green-500 mx-auto" />
                      ) : (
                        <XCircle size={16} className="text-gray-200 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Filter Option CRUD */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <SettingsIcon size={18} /> Dashboard Filter Options
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                These global lists power every dashboard filter dropdown.
              </p>
            </div>
            <button
              onClick={resetFilterOptions}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Restore defaults
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {OPTION_GROUPS.map((item) => (
              <OptionCrudCard
                key={item.key}
                group={item.key}
                title={item.title}
                valueLabel={item.valueLabel}
                options={filterOptions[item.key]}
              />
            ))}
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Info size={18} /> Application Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Application:</span> <span className="font-medium">exDASH v1.0.0-prototype</span></div>
            <div><span className="text-gray-500">Build:</span> <span className="font-medium">Development</span></div>
            <div><span className="text-gray-500">API URL:</span> <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{import.meta.env.VITE_EXDASH_API_URL || '/api/exdash'}</code></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Status:</span>
              <span className="flex items-center gap-1.5">
                <Circle size={8} className={isHealthy ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'} />
                <span className={`font-medium ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>{isHealthy ? 'Connected' : 'Disconnected'}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* About */}
        <motion.div variants={itemVariants} className="bg-red-50 rounded-2xl border border-red-200 p-6 text-sm text-red-800">
          <h3 className="font-semibold mb-2">About exDASH</h3>
          <p>exDASH is a dashboard and analytics service within the EMPOWERX ecosystem. It does not store standalone finance data; its backend gets finance data from the EMPOWERX FSDS database and plots it in the dashboards.</p>
          <p className="mt-2 text-red-600 text-xs">Finance endpoints require the read-only FSDS database connection. Dashboards saved to localStorage persist in the browser.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
