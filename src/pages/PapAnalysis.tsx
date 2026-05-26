import React from 'react';
import { motion } from 'framer-motion';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import { ChartCard } from '../components/data/ChartCard';
import { DataTable } from '../components/data/DataTable';
import { ProgressMetric } from '../components/data/ProgressMetric';
import { useFilters } from '../contexts/FilterContext';
import { formatPeso, formatPercent } from '../utils/formatters';
import { getUtilizationLevel } from '../utils/thresholds';
import * as api from '../services/exdashApi';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PieChart } from 'lucide-react';
import type { PAPSummary } from '../types/finance';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface DashboardPageProps {
  embedded?: boolean;
}

export default function PapAnalysis({ embedded = false }: DashboardPageProps) {
  const { filters } = useFilters();
  const [paps, setPaps] = React.useState<PAPSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    api.getFinanceByPap(filters).then(setPaps).finally(() => setLoading(false));
  }, [filters]);

  if (loading) {
    return (
      <div className={embedded ? 'space-y-6' : 'p-6'}>
        {!embedded && <FilterBar />}
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  const sorted = [...paps].sort((a, b) => b.totalNetAllotment - a.totalNetAllotment);

  const chartData = sorted.map(p => ({
    name: p.papDescription.length > 25 ? p.papDescription.substring(0, 25) + '…' : p.papDescription,
    allotment: p.totalNetAllotment,
    obligation: p.totalNetObligation,
    balance: p.actualBalance,
    utilization: p.utilizationRate,
    disbursement: p.disbursement,
  }));

  const columns = [
    { key: 'papCode', label: 'PAP Code', align: 'left' as const },
    { key: 'papDescription', label: 'Description', align: 'left' as const },
    { key: 'totalNetAllotment', label: 'Net Allotment', format: 'peso' as const, align: 'right' as const },
    { key: 'totalNetObligation', label: 'Net Obligation', format: 'peso' as const, align: 'right' as const },
    { key: 'actualBalance', label: 'Balance', format: 'peso' as const, align: 'right' as const },
    { key: 'utilizationRate', label: 'Utilization', format: 'percent' as const, align: 'right' as const },
    { key: 'disbursement', label: 'Disbursement', format: 'peso' as const, align: 'right' as const },
    { key: 'disbursementRate', label: 'Disb. Rate', format: 'percent' as const, align: 'right' as const },
  ];

  return (
    <div className={embedded ? 'space-y-6' : 'p-6'}>
      {!embedded && <FilterBar />}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><PieChart size={24} className="text-red-500" /> PAP Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Program, Activity, and Project financial breakdown</p>
        </motion.div>

        {/* PAP Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          {sorted.map(p => (
            <div key={p.papCode} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
              <p className="text-xs text-gray-500 mb-1 font-mono">{p.papCode}</p>
              <p className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2">{p.papDescription}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Net Allotment</span>
                  <span className="font-mono font-medium">{formatPeso(p.totalNetAllotment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Disbursement</span>
                  <span className="font-mono font-medium">{formatPeso(p.disbursement)}</span>
                </div>
                <ProgressMetric
                  label="Utilization"
                  value={p.totalNetObligation}
                  maxValue={p.totalNetAllotment}
                  percentage={p.utilizationRate}
                  thresholdLevel={getUtilizationLevel(p.utilizationRate)}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <ChartCard title="PAP Utilization Rate" subtitle="Percentage of allotment obligated">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip formatter={(v: number) => formatPercent(v)} />
                <Bar dataKey="utilization" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="PAP Budget Overview" subtitle="Allotment vs Obligation">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e9).toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Legend />
                <Bar dataKey="allotment" name="Allotment" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="obligation" name="Obligation" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ChartCard title="PAP Disbursement" subtitle="Total disbursement by program">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e9).toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Bar dataKey="disbursement" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Program-Level Summary</h3>
          <DataTable columns={columns} data={sorted} />
        </motion.div>
      </motion.div>
    </div>
  );
}
