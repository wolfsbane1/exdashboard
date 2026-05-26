import React from 'react';
import { motion } from 'framer-motion';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import { ChartCard } from '../components/data/ChartCard';
import { DataTable } from '../components/data/DataTable';
import { KpiCard } from '../components/data/KpiCard';
import { useFilters } from '../contexts/FilterContext';
import { formatPeso, formatPercent } from '../utils/formatters';
import { getUtilizationLevel } from '../utils/thresholds';
import * as api from '../services/exdashApi';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { FileSpreadsheet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { UACSummary } from '../types/finance';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface DashboardPageProps {
  embedded?: boolean;
}

export default function UacsAnalysis({ embedded = false }: DashboardPageProps) {
  const { filters } = useFilters();
  const [uacs, setUacs] = React.useState<UACSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    api.getFinanceByUacs(filters).then(setUacs).finally(() => setLoading(false));
  }, [filters]);

  if (loading) {
    return (
      <div className={embedded ? 'space-y-6' : 'p-6'}>
        {!embedded && <FilterBar />}
        <LoadingSkeleton type="kpi" count={4} />
        <div className="mt-6"><LoadingSkeleton type="table" /></div>
      </div>
    );
  }

  const sorted = [...uacs].sort((a, b) => b.totalNetAllotment - a.totalNetAllotment);
  const highest = sorted.length > 0 ? sorted[0] : null;
  const lowest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const negBalanceCodes = uacs.filter(u => u.actualBalance < 0);
  const highBalanceCodes = uacs.filter(u => u.actualBalance > uacs.reduce((s, u2) => s + u2.actualBalance, 0) / uacs.length * 2);

  const columns = [
    { key: 'uacsCode', label: 'UACS Code', align: 'left' as const },
    { key: 'uacsDescription', label: 'Description', align: 'left' as const },
    { key: 'totalNetAllotment', label: 'Net Allotment', format: 'peso' as const, align: 'right' as const },
    { key: 'totalNetObligation', label: 'Net Obligation', format: 'peso' as const, align: 'right' as const },
    { key: 'actualBalance', label: 'Balance', format: 'peso' as const, align: 'right' as const },
    { key: 'utilizationRate', label: 'Utilization', format: 'percent' as const, align: 'right' as const },
    { key: 'disbursement', label: 'Disbursement', format: 'peso' as const, align: 'right' as const },
    { key: 'unpaidObligations', label: 'Unpaid', format: 'peso' as const, align: 'right' as const },
    { key: 'disbursementRate', label: 'Disb. Rate', format: 'percent' as const, align: 'right' as const },
  ];

  const utilChartData = sorted.map(u => ({
    name: u.uacsDescription.substring(0, 20),
    value: u.utilizationRate,
    fill: u.utilizationRate >= 90 ? '#16A34A' : u.utilizationRate >= 75 ? '#F59E0B' : '#DC2626',
  }));

  const balanceChartData = sorted.map(u => ({
    name: u.uacsDescription.substring(0, 20),
    value: u.actualBalance,
    fill: u.actualBalance < 0 ? '#DC2626' : '#DC2626',
  }));

  return (
    <div className={embedded ? 'space-y-6' : 'p-6'}>
      {!embedded && <FilterBar />}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileSpreadsheet size={24} className="text-red-500" /> UACS / Object Code Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed analysis by UACS object code</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
          <KpiCard title="Total Object Codes" value={String(uacs.length)} icon={FileSpreadsheet} />
          <KpiCard title="Highest Utilization" value={highest ? formatPercent(highest.utilizationRate) : 'N/A'} subtitle={highest?.uacsDescription?.substring(0, 30)} icon={TrendingUp} thresholdLevel={highest ? getUtilizationLevel(highest.utilizationRate) : undefined} />
          <KpiCard title="Lowest Utilization" value={lowest ? formatPercent(lowest.utilizationRate) : 'N/A'} subtitle={lowest?.uacsDescription?.substring(0, 30)} icon={TrendingDown} thresholdLevel={lowest ? getUtilizationLevel(lowest.utilizationRate) : undefined} />
          <KpiCard title="Negative Balances" value={String(negBalanceCodes.length)} subtitle={negBalanceCodes.length > 0 ? 'Requires attention' : 'All positive'} icon={AlertTriangle} thresholdLevel={negBalanceCodes.length > 0 ? 'critical' : 'good'} />
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">UACS Detail Table</h3>
          <DataTable columns={columns} data={sorted} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <ChartCard title="Utilization by Object Code" subtitle="Color-coded by threshold">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={utilChartData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={120} />
                <Tooltip formatter={(v: number) => formatPercent(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {utilChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Balance by Object Code" subtitle="Negative values in red">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={balanceChartData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e6).toFixed(0)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={120} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {balanceChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
