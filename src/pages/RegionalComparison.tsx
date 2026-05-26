import React from 'react';
import { motion } from 'framer-motion';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import { DataTable } from '../components/data/DataTable';
import { ChartCard } from '../components/data/ChartCard';
import { RegionalRankBadge } from '../components/data/RegionalRankBadge';
import { useFilters } from '../contexts/FilterContext';
import { formatPeso, formatPercent } from '../utils/formatters';
import { getUtilizationLevel } from '../utils/thresholds';
import * as api from '../services/exdashApi';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ArrowUpDown } from 'lucide-react';
import type { OfficeSummary } from '../types/finance';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface DashboardPageProps {
  embedded?: boolean;
}

export default function RegionalComparison({ embedded = false }: DashboardPageProps) {
  const { filters } = useFilters();
  const [offices, setOffices] = React.useState<OfficeSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState<string>('utilizationRate');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  React.useEffect(() => {
    setLoading(true);
    api.getFinanceByOffice(filters).then(setOffices).finally(() => setLoading(false));
  }, [filters]);

  if (loading) {
    return (
      <div className={embedded ? 'space-y-6' : 'p-6'}>
        {!embedded && <FilterBar />}
        <LoadingSkeleton type="table" count={1} />
      </div>
    );
  }

  const sorted = [...offices].sort((a, b) => {
    const av = (a as any)[sortBy] ?? 0;
    const bv = (b as any)[sortBy] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const utilChartData = [...offices].sort((a, b) => b.utilizationRate - a.utilizationRate).map(o => ({
    name: o.officeName.replace(/Region |DSWD /, '').substring(0, 15),
    value: o.utilizationRate,
    fill: o.utilizationRate >= 90 ? '#16A34A' : o.utilizationRate >= 75 ? '#F59E0B' : '#DC2626',
  }));

  const disbChartData = [...offices].sort((a, b) => b.disbursementRate - a.disbursementRate).map(o => ({
    name: o.officeName.replace(/Region |DSWD /, '').substring(0, 15),
    value: o.disbursementRate,
    fill: o.disbursementRate >= 90 ? '#16A34A' : o.disbursementRate >= 75 ? '#F59E0B' : '#DC2626',
  }));

  // Radar: top 5 by utilization
  const top5 = [...offices].sort((a, b) => b.utilizationRate - a.utilizationRate).slice(0, 5);
  const maxAllot = Math.max(...top5.map(o => o.totalNetAllotment));
  const maxObl = Math.max(...top5.map(o => o.totalNetObligation));
  const maxBal = Math.max(...top5.map(o => Math.abs(o.actualBalance)));
  const radarData = [
    { metric: 'Utilization', ...Object.fromEntries(top5.map(o => [o.officeName.substring(0, 10), o.utilizationRate])) },
    { metric: 'Disbursement', ...Object.fromEntries(top5.map(o => [o.officeName.substring(0, 10), o.disbursementRate])) },
    { metric: 'Allotment', ...Object.fromEntries(top5.map(o => [o.officeName.substring(0, 10), maxAllot > 0 ? (o.totalNetAllotment / maxAllot) * 100 : 0])) },
    { metric: 'Obligations', ...Object.fromEntries(top5.map(o => [o.officeName.substring(0, 10), maxObl > 0 ? (o.totalNetObligation / maxObl) * 100 : 0])) },
    { metric: 'Balance', ...Object.fromEntries(top5.map(o => [o.officeName.substring(0, 10), maxBal > 0 ? (Math.abs(o.actualBalance) / maxBal) * 100 : 0])) },
  ];

  const columns = [
    { key: 'officeName', label: 'Office', align: 'left' as const },
    { key: 'totalNetAllotment', label: 'Net Allotment', format: 'peso' as const, align: 'right' as const },
    { key: 'totalNetObligation', label: 'Net Obligation', format: 'peso' as const, align: 'right' as const },
    { key: 'actualBalance', label: 'Balance', format: 'peso' as const, align: 'right' as const },
    { key: 'utilizationRate', label: 'Utilization %', format: 'percent' as const, align: 'right' as const },
    { key: 'disbursement', label: 'Disbursement', format: 'peso' as const, align: 'right' as const },
    { key: 'unpaidObligations', label: 'Unpaid', format: 'peso' as const, align: 'right' as const },
    { key: 'disbursementRate', label: 'Disb. Rate', format: 'percent' as const, align: 'right' as const },
  ];

  const COLORS = ['#DC2626', '#B91C1C', '#991B1B', '#EF4444', '#FCA5A5'];

  return (
    <div className={embedded ? 'space-y-6' : 'p-6'}>
      {!embedded && <FilterBar />}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ArrowUpDown size={24} className="text-red-500" /> Regional Comparison</h1>
          <p className="text-sm text-gray-500 mt-1">Compare all offices and regions side by side</p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <DataTable columns={columns} data={sorted} />
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <ChartCard title="Utilization Rate by Office" subtitle="Sorted highest to lowest">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={utilChartData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={100} />
                <Tooltip formatter={(v: number) => formatPercent(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {utilChartData.map((e, i) => (
                    <React.Fragment key={i}>{/* @ts-ignore */}<rect fill={e.fill} /></React.Fragment>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Disbursement Rate by Office" subtitle="Sorted highest to lowest">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={disbChartData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={100} />
                <Tooltip formatter={(v: number) => formatPercent(v)} />
                <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Radar */}
        <motion.div variants={itemVariants}>
          <ChartCard title="Top 5 Offices - Multi-Metric Comparison" subtitle="Normalized radar comparison">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {top5.map((o, i) => (
                  <Radar key={o.officeCode} name={o.officeName.substring(0, 15)} dataKey={o.officeName.substring(0, 10)} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
