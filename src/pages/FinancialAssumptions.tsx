import React from 'react';
import { motion } from 'framer-motion';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import { KpiCard } from '../components/data/KpiCard';
import { FinanceMetricCard } from '../components/data/FinanceMetricCard';
import { AssumptionForm } from '../components/builder/AssumptionForm';
import { ScenarioComparisonTable } from '../components/builder/ScenarioComparisonTable';
import { useFilters } from '../contexts/FilterContext';
import { formatPeso, formatPercent } from '../utils/formatters';
import { getUtilizationLevel, getDisbursementLevel, getBalanceLevel } from '../utils/thresholds';
import * as api from '../services/exdashApi';
import { Calculator, DollarSign, TrendingUp, Scale, Banknote, AlertTriangle, Activity, ShieldCheck, Save, Play, Sparkles, X } from 'lucide-react';
import type { FinancialScenario, FinancialAssumption } from '../types/scenario';
import type { FinanceSummary } from '../types/finance';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  LOW_UTILIZATION: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  PAYMENT_RISK: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  HEALTHY: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  TIGHT_BALANCE: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

const PRESETS = ['Baseline', 'Conservative', 'Realistic', 'Aggressive', 'Management Target', 'Worst Case'];

export default function FinancialAssumptions() {
  const { filters } = useFilters();
  const [scenarios, setScenarios] = React.useState<FinancialScenario[]>([]);
  const [currentScenario, setCurrentScenario] = React.useState<FinancialScenario | null>(null);
  const [baseline, setBaseline] = React.useState<FinanceSummary | null>(null);
  const [scenarioName, setScenarioName] = React.useState('');
  const [scenarioDesc, setScenarioDesc] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [computing, setComputing] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([api.getScenarios(), api.getFinanceSummary(filters)])
      .then(([sc, bl]) => {
        setScenarios(sc);
        setBaseline(bl);
        if (sc.length > 0) setCurrentScenario(sc[0]);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const handleCreateScenario = async () => {
    const name = scenarioName || 'New Scenario';
    const office = filters.office[0] || 'REGION_V';
    const fiscalYear = Number(filters.fiscalYear[0] || 2026);
    const sc = await api.createScenario({ name, description: scenarioDesc, baselineScope: filters.scope, officeName: office, fiscalYear });
    setCurrentScenario(sc);
    setScenarios(prev => [...prev, sc]);
  };

  const handleAddAssumption = async (a: Omit<FinancialAssumption, 'id'>) => {
    if (!currentScenario) {
      await handleCreateScenario();
      return;
    }
    const updated = await api.addAssumption(currentScenario.id, a);
    setCurrentScenario(updated);
    setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleCompute = async () => {
    if (!currentScenario) return;
    setComputing(true);
    try {
      const updated = await api.computeScenario(currentScenario.id);
      setCurrentScenario(updated);
      setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s));
    } finally {
      setComputing(false);
    }
  };

  const handleRemoveAssumption = (idx: number) => {
    if (!currentScenario) return;
    const updated = { ...currentScenario, assumptions: currentScenario.assumptions.filter((_, i) => i !== idx) };
    setCurrentScenario(updated);
  };

  const handleSelectScenario = (id: string) => {
    const sc = scenarios.find(s => s.id === id);
    if (sc) setCurrentScenario(sc);
  };

  if (loading) return <div className="p-6"><FilterBar /><LoadingSkeleton type="kpi" count={4} /></div>;

  const bl = currentScenario?.baselineData || (baseline ? {
    netAllotment: baseline.totalNetAllotment, netObligation: baseline.totalNetObligation,
    actualBalance: baseline.actualBalance, utilizationRate: baseline.utilizationRate,
    disbursement: baseline.disbursement, unpaidObligations: baseline.unpaidObligations,
    disbursementRate: baseline.disbursementRate,
  } : null);

  const pr = currentScenario?.projectedResults;

  const delta = (projected: number, base: number) => {
    const d = projected - base;
    return d >= 0 ? `+${formatPeso(d)}` : formatPeso(d);
  };

  const deltaPercent = (projected: number, base: number) => {
    const d = projected - base;
    return d >= 0 ? `+${d.toFixed(2)}%` : `${d.toFixed(2)}%`;
  };

  const risk = pr ? riskColors[pr.riskLevel] || riskColors.HEALTHY : null;

  return (
    <div className="p-6">
      <FilterBar />
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calculator size={24} className="text-red-500" /> Financial Assumptions Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">Simulate financial scenarios and analyze projected outcomes</p>
        </motion.div>

        {/* Scenario Selector + Presets */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
          <select
            value={currentScenario?.id || ''}
            onChange={e => e.target.value === 'new' ? handleCreateScenario() : handleSelectScenario(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-w-[200px]"
          >
            <option value="">Select Scenario...</option>
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="new">+ New Scenario</option>
          </select>
          <div className="h-6 w-px bg-gray-200" />
          <span className="text-xs text-gray-500 font-medium">PRESETS:</span>
          {PRESETS.map(p => (
            <button key={p} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all">
              {p}
            </button>
          ))}
        </motion.div>

        {/* Three Panel Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel — Baseline + Assumptions */}
          <motion.div variants={itemVariants} className="col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Baseline Figures</h3>
              {bl ? (
                <div className="space-y-2">
                  <FinanceMetricCard label="Net Allotment" value={formatPeso(bl.netAllotment)} />
                  <FinanceMetricCard label="Net Obligation" value={formatPeso(bl.netObligation)} />
                  <FinanceMetricCard label="Utilization Rate" value={formatPercent(bl.utilizationRate)} thresholdLevel={getUtilizationLevel(bl.utilizationRate)} />
                  <FinanceMetricCard label="Actual Balance" value={formatPeso(bl.actualBalance)} thresholdLevel={getBalanceLevel(bl.actualBalance)} />
                  <FinanceMetricCard label="Disbursement" value={formatPeso(bl.disbursement)} />
                  <FinanceMetricCard label="Unpaid Obligations" value={formatPeso(bl.unpaidObligations)} />
                  <FinanceMetricCard label="Disbursement Rate" value={formatPercent(bl.disbursementRate)} thresholdLevel={getDisbursementLevel(bl.disbursementRate)} />
                </div>
              ) : <p className="text-sm text-gray-400">Select a scope to load baseline</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Add Assumption</h3>
              <AssumptionForm onAdd={handleAddAssumption} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Active Assumptions</h3>
              {(!currentScenario || currentScenario.assumptions.length === 0) ? (
                <p className="text-sm text-gray-400">No assumptions added yet</p>
              ) : (
                <div className="space-y-2">
                  {currentScenario.assumptions.map((a, idx) => (
                    <div key={a.id || idx} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 shrink-0">{a.type}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{a.label}</p>
                        {a.notes && <p className="text-[10px] text-gray-400 mt-0.5">{a.notes}</p>}
                      </div>
                      <button onClick={() => handleRemoveAssumption(idx)} className="text-gray-400 hover:text-red-500 shrink-0"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Center Panel — Projected Results */}
          <motion.div variants={itemVariants} className="col-span-6 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Projected Results</h3>

              {pr && bl ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <KpiCard title="Projected Net Allotment" value={formatPeso(pr.projectedNetAllotment)} subtitle={delta(pr.projectedNetAllotment, bl.netAllotment)} icon={DollarSign} />
                    <KpiCard title="Projected Net Obligation" value={formatPeso(pr.projectedNetObligation)} subtitle={delta(pr.projectedNetObligation, bl.netObligation)} icon={TrendingUp} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <KpiCard title="Projected Balance" value={formatPeso(pr.projectedActualBalance)} subtitle={delta(pr.projectedActualBalance, bl.actualBalance)} icon={Scale} thresholdLevel={getBalanceLevel(pr.projectedActualBalance)} />
                    <KpiCard title="Projected Utilization" value={formatPercent(pr.projectedUtilizationRate)} subtitle={deltaPercent(pr.projectedUtilizationRate, bl.utilizationRate)} icon={Activity} thresholdLevel={getUtilizationLevel(pr.projectedUtilizationRate)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <KpiCard title="Projected Disbursement" value={formatPeso(pr.projectedDisbursement)} subtitle={delta(pr.projectedDisbursement, bl.disbursement)} icon={Banknote} />
                    <KpiCard title="Projected Unpaid" value={formatPeso(pr.projectedUnpaidObligations)} subtitle={delta(pr.projectedUnpaidObligations, bl.unpaidObligations)} icon={AlertTriangle} />
                    <KpiCard title="Projected Disb. Rate" value={formatPercent(pr.projectedDisbursementRate)} subtitle={deltaPercent(pr.projectedDisbursementRate, bl.disbursementRate)} icon={Activity} thresholdLevel={getDisbursementLevel(pr.projectedDisbursementRate)} />
                  </div>
                  {pr.additionalObligationsNeeded > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-red-800">Additional Obligations Needed</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">{formatPeso(pr.additionalObligationsNeeded)}</p>
                      <p className="text-xs text-red-600 mt-1">To reach the target utilization rate</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Add assumptions and click Compute</p>
                  <p className="text-sm text-gray-400 mt-1">Projected results will appear here</p>
                </div>
              )}
            </div>

            <button
              onClick={handleCompute}
              disabled={computing || !currentScenario}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-500/20"
            >
              <Play size={18} />
              {computing ? 'Computing...' : 'Compute Projections'}
            </button>
          </motion.div>

          {/* Right Panel — Scenario Details + Risk */}
          <motion.div variants={itemVariants} className="col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Scenario Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                  <input
                    value={scenarioName || currentScenario?.name || ''}
                    onChange={e => setScenarioName(e.target.value)}
                    placeholder="Scenario name..."
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                  <textarea
                    value={scenarioDesc || currentScenario?.description || ''}
                    onChange={e => setScenarioDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe this scenario..."
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>Office: <strong className="text-gray-700">{currentScenario?.officeName || 'All'}</strong></span>
                  <span>FY: <strong className="text-gray-700">{currentScenario?.fiscalYear || filters.fiscalYear[0] || 'All'}</strong></span>
                </div>
                {currentScenario?.status && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {currentScenario.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className={`rounded-2xl shadow-sm border p-5 ${risk ? `${risk.bg} ${risk.border}` : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Risk Assessment</h3>
              {pr ? (
                <>
                  <div className={`inline-block px-4 py-2 rounded-xl text-lg font-bold ${risk?.text || 'text-gray-600'}`}>
                    {pr.riskLevel.replace(/_/g, ' ')}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {pr.riskNotes.map((n, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-gray-400">Compute projections to see risk assessment</p>
              )}
            </div>

            <button
              onClick={handleCreateScenario}
              className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Save size={16} />
              Save Scenario
            </button>
          </motion.div>
        </div>

        {/* Scenario Comparison */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Scenario Comparison</h3>
          <ScenarioComparisonTable scenarios={scenarios} />
        </motion.div>
      </motion.div>
    </div>
  );
}
