import React from 'react';
import { motion } from 'framer-motion';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import { ChartCard } from '../components/data/ChartCard';
import { KpiCard } from '../components/data/KpiCard';
import { useFilters } from '../contexts/FilterContext';
import { formatPeso, formatPercent } from '../utils/formatters';
import { getDisbursementLevel } from '../utils/thresholds';
import * as api from '../services/exdashApi';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Banknote, Activity, AlertTriangle } from 'lucide-react';
import type { FinanceSummary, OfficeSummary, PAPSummary, UACSummary } from '../types/finance';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface DashboardPageProps {
  embedded?: boolean;
}

export default function DisbursementMonitoring({ embedded = false }: DashboardPageProps) {
  const { filters } = useFilters();
  const [summary, setSummary] = React.useState<FinanceSummary | null>(null);
  const [offices, setOffices] = React.useState<OfficeSummary[]>([]);
  const [paps, setPaps] = React.useState<PAPSummary[]>([]);
  const [uacsList, setUacsList] = React.useState<UACSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getFinanceSummary(filters),
      api.getFinanceByOffice(filters),
      api.getFinanceByPap(filters),
      api.getFinanceByUacs(filters),
    ]).then(([s, o, p, u]) => { setSummary(s); setOffices(o); setPaps(p); setUacsList(u); })
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading || !summary) {
    return (
      <div className={embedded ? 'space-y-6' : 'p-6'}>
        {!embedded && <FilterBar />}
        <LoadingSkeleton type="kpi" count={4} />
      </div>
    );
  }

  const officeData = offices.map(o => ({
    name: o.officeName.replace(/Region /, 'R').substring(0, 15),
    disbursement: o.disbursement,
    unpaid: o.unpaidObligations,
  })).sort((a, b) => b.disbursement - a.disbursement);

  const papData = paps.map(p => ({
    name: p.papDescription.substring(0, 20),
    disbursement: p.disbursement,
  })).sort((a, b) => b.disbursement - a.disbursement);

  const uacsData = uacsList.map(u => ({
    name: u.uacsDescription.substring(0, 20),
    disbursement: u.disbursement,
  })).sort((a, b) => b.disbursement - a.disbursement);

  return (
    <div className={embedded ? 'space-y-6' : 'p-6'}>
      {!embedded && <FilterBar />}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Banknote size={24} className="text-red-500" /> Disbursement Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Track disbursement progress across all levels</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          <KpiCard title="Total Disbursement" value={formatPeso(summary.disbursement)} icon={Banknote} />
          <KpiCard title="Disbursement Rate" value={formatPercent(summary.disbursementRate)} icon={Activity} thresholdLevel={getDisbursementLevel(summary.disbursementRate)} />
          <KpiCard title="Unpaid Obligations" value={formatPeso(summary.unpaidObligations)} icon={AlertTriangle} />
        </motion.div>

        {/* Disbursement Rate Gauge */}
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500 mb-2">Overall Disbursement Rate</p>
            <div className="relative w-48 h-24 mx-auto overflow-hidden">
              <div className="absolute inset-0 w-48 h-48 rounded-full border-[16px] border-gray-200" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
              <div className="absolute inset-0 w-48 h-48 rounded-full border-[16px] border-transparent" style={{
                borderTopColor: summary.disbursementRate >= 90 ? '#16A34A' : summary.disbursementRate >= 75 ? '#F59E0B' : '#DC2626',
                borderRightColor: summary.disbursementRate >= 50 ? (summary.disbursementRate >= 90 ? '#16A34A' : summary.disbursementRate >= 75 ? '#F59E0B' : '#DC2626') : 'transparent',
                transform: `rotate(${Math.min(summary.disbursementRate, 100) * 1.8 - 180}deg)`,
                clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
              }} />
            </div>
            <p className="text-4xl font-bold text-gray-800 mt-2">{formatPercent(summary.disbursementRate)}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <ChartCard title="Disbursement by Region" subtitle="Total disbursement per office">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={officeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e9).toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Bar dataKey="disbursement" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Disbursement by PAP" subtitle="Total disbursement per program">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={papData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e9).toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Bar dataKey="disbursement" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <ChartCard title="Disbursement by Object Code" subtitle="UACS breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={uacsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e9).toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Bar dataKey="disbursement" fill="#B91C1C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Paid vs Unpaid Obligations" subtitle="Stacked by office">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={officeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v: number) => `₱${(v / 1e9).toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => formatPeso(v, false)} />
                <Legend />
                <Bar dataKey="disbursement" name="Paid" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="unpaid" name="Unpaid" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
