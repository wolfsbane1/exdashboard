import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AlertTriangle, DollarSign, Percent, Building2 } from 'lucide-react';
import { formatPeso, formatPercent } from '../utils/formatters';
import { getUtilizationLevel, getDisbursementLevel, getBalanceLevel } from '../utils/thresholds';
import { KpiCard } from '../components/data/KpiCard';
import { ChartCard } from '../components/data/ChartCard';
import { DataTable } from '../components/data/DataTable';
import { AlertCard } from '../components/data/AlertCard';
import { ProgressMetric } from '../components/data/ProgressMetric';
import { FinanceMetricCard } from '../components/data/FinanceMetricCard';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import * as api from '../services/exdashApi';
import { useFilters } from '../contexts/FilterContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const CHART_COLORS = ['#DC2626', '#B91C1C', '#991B1B', '#EF4444', '#FCA5A5', '#16A34A', '#F59E0B', '#DC2626', '#6B7280', '#9CA3AF'];
const AGING_COLORS = ['#16A34A', '#F59E0B', '#DC2626', '#B91C1C', '#DC2626'];
const AGING_LABELS = ['0-3 days', '4-7 days', '8-15 days', '16-30 days', '30+ days'];

function fsdsAgingValue(record: any, label: string): number {
  const aging = record.aging || {};
  const fsdsLabel = label === '30+ days' ? 'Over 30 days' : label;
  return Number(aging[label] ?? aging[fsdsLabel] ?? 0);
}

interface DashboardPageProps {
  embedded?: boolean;
}

export default function UnpaidObligations({ embedded = false }: DashboardPageProps) {
  const { filters } = useFilters();
  const [unpaidData, setUnpaidData] = useState<any[]>([]);
  const [papData, setPapData] = useState<any[]>([]);
  const [uacsData, setUacsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [unpaidRes, papRes, uacsRes] = await Promise.all([
          api.getUnpaidObligations(filters),
          api.getFinanceByPap(filters),
          api.getFinanceByUacs(filters),
        ]);
        if (!cancelled) {
          setUnpaidData(unpaidRes);
          setPapData(papRes);
          setUacsData(uacsRes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load unpaid obligations data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [filters]);

  const totalUnpaid = useMemo(
    () => unpaidData.reduce((sum, r) => sum + (r.totalUnpaidObligations || 0), 0),
    [unpaidData]
  );

  const avgUnpaidRatio = useMemo(() => {
    if (unpaidData.length === 0) return 0;
    const totalRatio = unpaidData.reduce((sum, r) => {
      const ratio = r.netObligation > 0 ? r.totalUnpaidObligations / r.netObligation : 0;
      return sum + ratio;
    }, 0);
    return totalRatio / unpaidData.length;
  }, [unpaidData]);

  const highUnpaidCount = useMemo(
    () => unpaidData.filter(r => r.netObligation > 0 && (r.totalUnpaidObligations / r.netObligation) > 0.10).length,
    [unpaidData]
  );

  const regionChartData = useMemo(
    () => unpaidData
      .map(r => ({
        name: r.officeName.replace('Region ', 'R').replace(' - ', '\n').substring(0, 20),
        fullName: r.officeName,
        value: r.totalUnpaidObligations,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    [unpaidData]
  );

  const papChartData = useMemo(
    () => papData
      .filter(r => (r.totalUnpaidObligations || 0) > 0)
      .map(r => ({
        name: r.papName.length > 25 ? r.papName.substring(0, 22) + '...' : r.papName,
        fullName: r.papName,
        value: r.totalUnpaidObligations || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    [papData]
  );

  const uacsChartData = useMemo(
    () => uacsData
      .filter(r => (r.totalUnpaidObligations || 0) > 0)
      .map(r => ({
        name: r.uacsCode,
        fullName: `${r.uacsCode} - ${r.uacsName}`,
        value: r.totalUnpaidObligations || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    [uacsData]
  );

  const agingTableData = useMemo(
    () => unpaidData
      .filter(r => r.totalUnpaidObligations > 0)
      .map(r => ({
        office: r.officeName,
        'days_0_3': fsdsAgingValue(r, '0-3 days'),
        'days_4_7': fsdsAgingValue(r, '4-7 days'),
        'days_8_15': fsdsAgingValue(r, '8-15 days'),
        'days_16_30': fsdsAgingValue(r, '16-30 days'),
        'days_30_plus': fsdsAgingValue(r, '30+ days'),
        total: r.totalUnpaidObligations,
      })),
    [unpaidData]
  );

  const agingDonutData = useMemo(() => {
    const totals = [0, 0, 0, 0, 0];
    agingTableData.forEach(row => {
      totals[0] += row['days_0_3'];
      totals[1] += row['days_4_7'];
      totals[2] += row['days_8_15'];
      totals[3] += row['days_16_30'];
      totals[4] += row['days_30_plus'];
    });
    return AGING_LABELS.map((label, i) => ({
      name: label,
      value: Math.round(totals[i] * 100) / 100,
    }));
  }, [agingTableData]);

  const pesoTooltipFormatter = (value: number) => formatPeso(value);

  if (loading) {
    return (
      <div className={embedded ? 'space-y-6' : 'p-6'}>
        {!embedded && <FilterBar />}
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={embedded ? 'space-y-6' : 'p-6'}>
        {!embedded && <FilterBar />}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Error Loading Data</span>
          </div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-6' : 'p-6 space-y-6'}>
      {!embedded && <FilterBar />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Section 1: Title */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800">Unpaid Obligations Monitoring</h1>
          <p className="text-gray-500 mt-1">Track outstanding payment obligations across offices and programs</p>
        </motion.div>

        {/* Section 2: KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard
            title="Total Unpaid Obligations"
            value={formatPeso(totalUnpaid)}
            icon={DollarSign}
            trend={totalUnpaid > 0 ? 'Requires attention' : 'No outstanding'}
            trendDirection={totalUnpaid > 0 ? 'down' : 'up'}
          />
          <KpiCard
            title="Average Unpaid Ratio"
            value={formatPercent(avgUnpaidRatio * 100)}
            icon={Percent}
            trend={avgUnpaidRatio > 0.10 ? 'Above threshold' : 'Within limits'}
            trendDirection={avgUnpaidRatio > 0.10 ? 'down' : 'up'}
          />
          <KpiCard
            title="Offices with High Unpaid"
            value={highUnpaidCount.toString()}
            icon={Building2}
            trend={`${highUnpaidCount} offices >10% unpaid ratio`}
            trendDirection={highUnpaidCount > 0 ? 'down' : 'up'}
          />
        </motion.div>

        {/* Section 3: Charts Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Unpaid Obligations by Region">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={regionChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tickFormatter={(v: number) => formatPeso(v)} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={pesoTooltipFormatter}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="value" fill="#DC2626" radius={[0, 4, 4, 0]} name="Unpaid Obligations" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Unpaid by PAP">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={papChartData} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                <YAxis tickFormatter={(v: number) => formatPeso(v)} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={pesoTooltipFormatter}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="value" fill="#B91C1C" radius={[4, 4, 0, 0]} name="Unpaid Obligations" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Section 4: UACS Chart */}
        <motion.div variants={itemVariants}>
          <ChartCard title="Unpaid by Object Code (UACS)">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={uacsChartData} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v: number) => formatPeso(v)} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={pesoTooltipFormatter}
                  labelFormatter={(label: string) => {
                    const match = uacsChartData.find(d => d.name === label);
                    return match?.fullName || label;
                  }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Unpaid Obligations">
                  {uacsChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Section 5: Aging Buckets */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Aging Buckets Analysis</h2>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aging Summary Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Aging Summary by Office</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Office</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">0-3 days</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">4-7 days</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">8-15 days</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">16-30 days</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">30+ days</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {agingTableData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">No unpaid obligations data</td>
                    </tr>
                  ) : (
                    agingTableData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-red-50/40 transition-colors">
                        <td className="py-2.5 px-2 text-gray-800 font-medium text-xs">
                          {row.office.length > 22 ? row.office.substring(0, 19) + '...' : row.office}
                        </td>
                        <td className="py-2.5 px-2 text-right text-green-600 text-xs">{formatPeso(row['days_0_3'])}</td>
                        <td className="py-2.5 px-2 text-right text-amber-500 text-xs">{formatPeso(row['days_4_7'])}</td>
                        <td className="py-2.5 px-2 text-right text-red-500 text-xs">{formatPeso(row['days_8_15'])}</td>
                        <td className="py-2.5 px-2 text-right text-red-600 text-xs">{formatPeso(row['days_16_30'])}</td>
                        <td className="py-2.5 px-2 text-right text-red-600 text-xs">{formatPeso(row['days_30_plus'])}</td>
                        <td className="py-2.5 px-2 text-right text-gray-800 font-semibold text-xs">{formatPeso(row.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aging Distribution Donut */}
          <ChartCard title="Aging Distribution (All Offices)">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={agingDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {agingDonutData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AGING_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={pesoTooltipFormatter}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Alert if high unpaid offices exist */}
        {highUnpaidCount > 0 && (
          <motion.div variants={itemVariants}>
            <AlertCard
              type="warning"
              title="High Unpaid Obligations Detected"
              message={`${highUnpaidCount} office(s) have unpaid obligations exceeding 10% of their net obligation. Review payment schedules and disbursement pipelines.`}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
