import React from 'react';
import { motion } from 'framer-motion';
import { KpiCard } from '../components/data/KpiCard';
import { ChartCard } from '../components/data/ChartCard';
import { DataTable } from '../components/data/DataTable';
import { FinanceMetricCard } from '../components/data/FinanceMetricCard';
import { RegionalRankBadge } from '../components/data/RegionalRankBadge';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import { useFilters } from '../contexts/FilterContext';
import { formatPeso, formatPercent } from '../utils/formatters';
import { getUtilizationLevel, getDisbursementLevel, getBalanceLevel } from '../utils/thresholds';
import * as api from '../services/exdashApi';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Building2, TrendingUp, Scale, DollarSign, Banknote, AlertTriangle } from 'lucide-react';
import type { OfficeSummary, FinanceSummary } from '../types/finance';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface DashboardPageProps {
  embedded?: boolean;
}

export default function ConsolidatedView({ embedded = false }: DashboardPageProps) {
  const { filters } = useFilters();
  const [summary, setSummary] = React.useState<FinanceSummary | null>(null);
  const [offices, setOffices] = React.useState<OfficeSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([api.getFinanceSummary(filters), api.getFinanceByOffice(filters)])
      .then(([s, o]) => { setSummary(s); setOffices(o); })
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading || !summary) {
    return (
      <div className={embedded ? 'space-y-6' : 'p-6'}>
        {!embedded && <FilterBar />}
        <LoadingSkeleton type="kpi" count={8} />
      </div>
    );
  }

  const coOffices = offices.filter(o => o.officeType === 'CENTRAL_OFFICE');
  const roOffices = offices.filter(o => o.officeType === 'REGIONAL_OFFICE');
  const coSummary = coOffices.length > 0 ? coOffices[0] : null;
  const roTotals = roOffices.reduce((acc, o) => ({
    totalNetAllotment: acc.totalNetAllotment + o.totalNetAllotment,
    totalNetObligation: acc.totalNetObligation + o.totalNetObligation,
    actualBalance: acc.actualBalance + o.actualBalance,
    disbursement: acc.disbursement + o.disbursement,
    unpaidObligations: acc.unpaidObligations + o.unpaidObligations,
  }), { totalNetAllotment: 0, totalNetObligation: 0, actualBalance: 0, disbursement: 0, unpaidObligations: 0 });
  const roUtilization = roTotals.totalNetAllotment > 0 ? (roTotals.totalNetObligation / roTotals.totalNetAllotment) * 100 : 0;

  const sortedByUtil = [...offices].sort((a, b) => b.utilizationRate - a.utilizationRate);
  const avgBalance = offices.reduce((s, o) => s + o.actualBalance, 0) / offices.length;
  const highBalance = offices.filter(o => o.actualBalance > avgBalance * 1.5);
  const lowUtil = offices.filter(o => o.utilizationRate < 80);
  const highUnpaid = offices.filter(o => o.totalNetObligation > 0 && (o.unpaidObligations / o.totalNetObligation) > 0.1);

  const comparisonData = [
    { name: 'Central Office', allotment: coSummary?.totalNetAllotment || 0, obligation: coSummary?.totalNetObligation || 0 },
    { name: 'Regional Offices', allotment: roTotals.totalNetAllotment, obligation: roTotals.totalNetObligation },
  ];

  const columns = [
    { key: 'rank', label: '#', align: 'left' as const },
    { key: 'officeName', label: 'Office', align: 'left' as const },
    { key: 'totalNetAllotment', label: 'Net Allotment', format: 'peso' as const, align: 'right' as const },
    { key: 'totalNetObligation', label: 'Net Obligation', format: 'peso' as const, align: 'right' as const },
    { key: 'actualBalance', label: 'Balance', format: 'peso' as const, align: 'right' as const },
    { key: 'utilizationRate', label: 'Utilization', format: 'percent' as const, align: 'right' as const },
    { key: 'disbursementRate', label: 'Disbursement Rate', format: 'percent' as const, align: 'right' as const },
  ];

  const tableData = sortedByUtil.map((o, idx) => ({ ...o, rank: idx + 1 }));

  return (
    <div className={embedded ? 'space-y-6' : 'p-6'}>
      {!embedded && <FilterBar />}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800">Consolidated View</h1>
          <p className="text-sm text-gray-500 mt-1">Central Office + All Regional Offices</p>
        </motion.div>

        {/* National KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
          <KpiCard title="Total Net Allotment" value={formatPeso(summary.totalNetAllotment)} icon={DollarSign} />
          <KpiCard title="Total Net Obligation" value={formatPeso(summary.totalNetObligation)} icon={TrendingUp} />
          <KpiCard title="Utilization Rate" value={formatPercent(summary.utilizationRate)} icon={Scale} thresholdLevel={getUtilizationLevel(summary.utilizationRate)} />
          <KpiCard title="Total Disbursement" value={formatPeso(summary.disbursement)} icon={Banknote} />
        </motion.div>

        {/* CO vs RO Comparison */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Central Office</h3>
            <div className="space-y-3">
              <FinanceMetricCard label="Net Allotment" value={formatPeso(coSummary?.totalNetAllotment || 0)} />
              <FinanceMetricCard label="Net Obligation" value={formatPeso(coSummary?.totalNetObligation || 0)} />
              <FinanceMetricCard label="Utilization Rate" value={formatPercent(coSummary?.utilizationRate || 0)} thresholdLevel={getUtilizationLevel(coSummary?.utilizationRate || 0)} />
              <FinanceMetricCard label="Disbursement" value={formatPeso(coSummary?.disbursement || 0)} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">All Regional Offices</h3>
            <div className="space-y-3">
              <FinanceMetricCard label="Net Allotment" value={formatPeso(roTotals.totalNetAllotment)} />
              <FinanceMetricCard label="Net Obligation" value={formatPeso(roTotals.totalNetObligation)} />
              <FinanceMetricCard label="Utilization Rate" value={formatPercent(roUtilization)} thresholdLevel={getUtilizationLevel(roUtilization)} />
              <FinanceMetricCard label="Disbursement" value={formatPeso(roTotals.disbursement)} />
            </div>
          </div>
        </motion.div>

        {/* CO vs RO Chart */}
        <motion.div variants={itemVariants}>
          <ChartCard title="Central Office vs Regional Offices" subtitle="Budget allocation comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e9).toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Legend />
                <Bar dataKey="allotment" name="Net Allotment" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="obligation" name="Net Obligation" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Region Ranking Table */}
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Region Ranking by Utilization Rate</h3>
            <DataTable columns={columns} data={tableData} />
          </div>
        </motion.div>

        {/* Highlights */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-red-500" /> High-Balance Offices
            </h4>
            {highBalance.length === 0 ? <p className="text-sm text-gray-400">None</p> : highBalance.map(o => (
              <div key={o.officeCode} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{o.officeName}</span>
                <span className="text-sm font-mono text-gray-600">{formatPeso(o.actualBalance)}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} /> Low-Utilization Offices
            </h4>
            {lowUtil.length === 0 ? <p className="text-sm text-amber-600">All offices above 80%</p> : lowUtil.map(o => (
              <div key={o.officeCode} className="flex justify-between items-center py-2 border-b border-amber-100 last:border-0">
                <span className="text-sm text-amber-800">{o.officeName}</span>
                <RegionalRankBadge label={`${formatPercent(o.utilizationRate)}`} level={getUtilizationLevel(o.utilizationRate)} />
              </div>
            ))}
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
            <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} /> High Unpaid Obligations
            </h4>
            {highUnpaid.length === 0 ? <p className="text-sm text-red-600">All offices within threshold</p> : highUnpaid.map(o => (
              <div key={o.officeCode} className="flex justify-between items-center py-2 border-b border-red-100 last:border-0">
                <span className="text-sm text-red-800">{o.officeName}</span>
                <span className="text-sm font-mono text-red-600">{formatPeso(o.unpaidObligations)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
