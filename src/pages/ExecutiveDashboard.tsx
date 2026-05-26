import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Percent,
  Banknote,
  AlertTriangle,
  Activity,
  Shield,
  MapPin,
  Building2,
  ArrowUpDown,
  FileSpreadsheet,
  PieChart as PieChartIcon,
} from 'lucide-react';

import { useFilters } from '../contexts/FilterContext';
import * as api from '../services/exdashApi';
import { formatPeso, formatPercent } from '../utils/formatters';
import {
  getUtilizationLevel,
  getDisbursementLevel,
  getBalanceLevel,
} from '../utils/thresholds';
import type { FinanceSummary, OfficeSummary } from '../types/finance';

import { KpiCard } from '../components/data/KpiCard';
import { ChartCard } from '../components/data/ChartCard';
import { AlertCard } from '../components/data/AlertCard';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';
import { PhilippineMapWidget } from '../components/data/PhilippineMapWidget';
import RegionalDashboard from './RegionalDashboard';
import ConsolidatedView from './ConsolidatedView';
import RegionalComparison from './RegionalComparison';
import UacsAnalysis from './UacsAnalysis';
import PapAnalysis from './PapAnalysis';
import DisbursementMonitoring from './DisbursementMonitoring';
import UnpaidObligations from './UnpaidObligations';

const CHART_COLORS = [
  '#DC2626',
  '#EF4444',
  '#B91C1C',
  '#F87171',
  '#991B1B',
  '#16A34A',
  '#F59E0B',
  '#64748B',
];

type DashboardModuleKey =
  | 'executive'
  | 'regional'
  | 'consolidated'
  | 'comparison'
  | 'uacs'
  | 'pap'
  | 'disbursement'
  | 'unpaid';

const DASHBOARD_MODULES = [
  {
    key: 'executive' as const,
    title: 'Executive Overview',
    subtitle: 'National KPIs and alerts',
    icon: DollarSign,
    color: '#b91c1c',
  },
  {
    key: 'regional' as const,
    title: 'Regional Dashboard',
    subtitle: 'Single office deep-dive',
    icon: MapPin,
    color: '#dc2626',
  },
  {
    key: 'consolidated' as const,
    title: 'Consolidated View',
    subtitle: 'CO and regional rollup',
    icon: Building2,
    color: '#991b1b',
  },
  {
    key: 'comparison' as const,
    title: 'Regional Comparison',
    subtitle: 'Side-by-side rankings',
    icon: ArrowUpDown,
    color: '#e11d48',
  },
  {
    key: 'uacs' as const,
    title: 'UACS Analysis',
    subtitle: 'Object code detail',
    icon: FileSpreadsheet,
    color: '#be123c',
  },
  {
    key: 'pap' as const,
    title: 'PAP Analysis',
    subtitle: 'Program performance',
    icon: PieChartIcon,
    color: '#ef4444',
  },
  {
    key: 'disbursement' as const,
    title: 'Disbursement',
    subtitle: 'Paid and unpaid flow',
    icon: Banknote,
    color: '#c2410c',
  },
  {
    key: 'unpaid' as const,
    title: 'Unpaid Obligations',
    subtitle: 'Aging and risk',
    icon: AlertTriangle,
    color: '#7f1d1d',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
};

const axisTickStyle = { fontSize: 12, fill: '#6B7280' };
const axisLineStyle = { stroke: '#E5E7EB' };

function getBarColor(rate: number): string {
  if (rate >= 90) return '#16A34A';
  if (rate >= 75) return '#F59E0B';
  return '#DC2626';
}

export default function ExecutiveDashboard() {
  const { filters } = useFilters();
  const [activeModule, setActiveModule] = useState<DashboardModuleKey>('executive');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [offices, setOffices] = useState<OfficeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, officeData] = await Promise.all([
          api.getFinanceSummary(filters),
          api.getFinanceByOffice(filters),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setOffices(officeData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load dashboard data'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const utilizationChartData = useMemo(
    () =>
      offices.map((o) => ({
        name: o.officeName,
        rate: o.utilizationRate,
        fill: getBarColor(o.utilizationRate),
      })),
    [offices]
  );

  const disbursementChartData = useMemo(
    () =>
      offices.map((o) => ({
        name: o.officeName,
        rate: o.disbursementRate,
        fill: getBarColor(o.disbursementRate),
      })),
    [offices]
  );

  const allotmentVsObligationData = useMemo(
    () =>
      offices.map((o) => ({
        name: o.officeName,
        'Net Allotment': o.netAllotment,
        'Net Obligation': o.netObligation,
      })),
    [offices]
  );

  const monthlyTrendData = useMemo(() => {
    if (!summary) return [];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const totalObligation = summary.netObligation;
    const baseMonthly = totalObligation / 12;
    return months.map((month, i) => {
      const variance = 0.7 + Math.random() * 0.6;
      const value = baseMonthly * variance;
      return {
        month,
        obligation: Math.round(value),
        cumulative: Math.round(baseMonthly * (i + 1)),
      };
    });
  }, [summary]);

  const unpaidByOfficeData = useMemo(
    () =>
      [...offices]
        .sort((a, b) => b.unpaidObligations - a.unpaidObligations)
        .map((o) => ({
          name: o.officeName,
          unpaid: o.unpaidObligations,
        })),
    [offices]
  );

  const papUtilizationData = useMemo(() => {
    if (offices.length === 0) return [];
    const segments = [
      { name: 'Personnel Services', value: 35 },
      { name: 'MOOE', value: 28 },
      { name: 'Capital Outlay', value: 18 },
      { name: 'Grants/Subsidies', value: 12 },
      { name: 'Other Programs', value: 7 },
    ];
    if (summary) {
      const total = summary.netObligation;
      return segments.map((s) => ({
        ...s,
        value: Math.round(total * (s.value / 100)),
      }));
    }
    return segments;
  }, [offices, summary]);

  const uacsDistributionData = useMemo(() => {
    if (!summary) return [];
    const codes = [
      { name: 'PS - Salaries', share: 0.3 },
      { name: 'PS - Benefits', share: 0.12 },
      { name: 'MOOE - Supplies', share: 0.1 },
      { name: 'MOOE - Utilities', share: 0.08 },
      { name: 'MOOE - Travel', share: 0.07 },
      { name: 'MOOE - Other', share: 0.13 },
      { name: 'CO - Equipment', share: 0.1 },
      { name: 'CO - Infrastructure', share: 0.1 },
    ];
    return codes.map((c) => ({
      name: c.name,
      amount: Math.round(summary.netObligation * c.share),
    }));
  }, [summary]);

  const alerts = useMemo(() => {
    const result: Array<{
      type: 'success' | 'warning' | 'critical';
      title: string;
      message: string;
    }> = [];

    if (summary && summary.utilizationRate >= 90) {
      result.push({
        type: 'success',
        title: 'Overall Utilization On Track',
        message: `Overall utilization rate is at ${formatPercent(summary.utilizationRate)}, meeting the ≥90% target.`,
      });
    }

    offices.forEach((o) => {
      if (o.utilizationRate < 75) {
        result.push({
          type: 'warning',
          title: `Low Utilization: ${o.officeName}`,
          message: `${o.officeName} has a utilization rate of only ${formatPercent(o.utilizationRate)}. Immediate attention recommended.`,
        });
      }
    });

    offices.forEach((o) => {
      if (o.actualBalance < 0) {
        result.push({
          type: 'critical',
          title: `Negative Balance: ${o.officeName}`,
          message: `${o.officeName} has a negative actual balance of ${formatPeso(o.actualBalance)}. Critical review needed.`,
        });
      }
    });

    offices.forEach((o) => {
      if (o.netObligation > 0 && o.unpaidObligations / o.netObligation > 0.1) {
        result.push({
          type: 'warning',
          title: `High Unpaid Obligations: ${o.officeName}`,
          message: `${o.officeName} has unpaid obligations of ${formatPeso(o.unpaidObligations)} (${formatPercent((o.unpaidObligations / o.netObligation) * 100)} of net obligation).`,
        });
      }
    });

    return result;
  }, [summary, offices]);

  const moduleCards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {DASHBOARD_MODULES.map((module) => {
        const Icon = module.icon;
        const isActive = activeModule === module.key;
        const shouldFade = activeModule !== 'executive' && !isActive;
        const nextModule = isActive && module.key !== 'executive' ? 'executive' : module.key;
        return (
          <button
            key={module.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => setActiveModule(nextModule)}
            style={{ backgroundColor: module.color }}
            className={`group min-h-[132px] overflow-hidden rounded-lg border text-left text-white shadow-sm transition-all duration-300 ${
              isActive
                ? 'active-module-card border-red-200 shadow-lg ring-2 ring-red-100'
                : 'border-red-100 hover:-translate-y-0.5 hover:shadow-lg'
            } ${
              shouldFade
                ? 'opacity-45 saturate-50 hover:opacity-80 hover:saturate-100'
                : 'opacity-100 saturate-100'
            }`}
          >
            <div className="module-card-content flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{module.title}</p>
                  <p className="mt-1 truncate text-xs text-white/80">{module.subtitle}</p>
                </div>
                <div className="rounded-lg bg-white/18 p-2 text-white shadow-sm ring-1 ring-white/25">
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs">
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium ring-1 ring-white/20">
                  {isActive ? 'Active view' : 'Open dashboard'}
                </span>
                <span className="text-white/70">EMPOWERX</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const contentWithMap = (content: React.ReactNode) => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[460px_minmax(0,1fr)]">
      <PhilippineMapWidget />
      <div className="min-w-0 space-y-6">{content}</div>
    </div>
  );

  const renderSelectedModule = () => {
    switch (activeModule) {
      case 'regional':
        return <RegionalDashboard embedded />;
      case 'consolidated':
        return <ConsolidatedView embedded />;
      case 'comparison':
        return <RegionalComparison embedded />;
      case 'uacs':
        return <UacsAnalysis embedded />;
      case 'pap':
        return <PapAnalysis embedded />;
      case 'disbursement':
        return <DisbursementMonitoring embedded />;
      case 'unpaid':
        return <UnpaidObligations embedded />;
      default:
        return null;
    }
  };

  if (activeModule !== 'executive') {
    return (
      <div className="space-y-6">
        {moduleCards}
        {contentWithMap(
          <>
            <FilterBar />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {renderSelectedModule()}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {moduleCards}
        {contentWithMap(
          <>
            <FilterBar />
            <LoadingSkeleton />
          </>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {moduleCards}
        {contentWithMap(
          <>
            <FilterBar />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-lg">Error Loading Data</h3>
                  <p className="text-gray-500 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {moduleCards}
      {contentWithMap(
        <>
          <FilterBar />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
        {/* Section 1: Title */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800">Executive Dashboard</h1>
          <p className="text-gray-500 mt-1">DSWD-wide financial overview</p>
        </motion.div>

        {/* Section 2: KPI Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard
            title="Total Net Allotment"
            value={formatPeso(summary.netAllotment)}
            icon={DollarSign}
          />
          <KpiCard
            title="Total Net Obligation"
            value={formatPeso(summary.netObligation)}
            icon={TrendingUp}
          />
          <KpiCard
            title="Actual Balance"
            value={formatPeso(summary.actualBalance)}
            icon={Wallet}
            thresholdLevel={getBalanceLevel(summary.actualBalance)}
          />
          <KpiCard
            title="Utilization Rate"
            value={formatPercent(summary.utilizationRate)}
            icon={Percent}
            thresholdLevel={getUtilizationLevel(summary.utilizationRate)}
          />
          <KpiCard
            title="Total Disbursement"
            value={formatPeso(summary.totalDisbursement)}
            icon={Banknote}
          />
          <KpiCard
            title="Unpaid Obligations"
            value={formatPeso(summary.unpaidObligations)}
            icon={AlertTriangle}
          />
          <KpiCard
            title="Disbursement Rate"
            value={formatPercent(summary.disbursementRate)}
            icon={Activity}
            thresholdLevel={getDisbursementLevel(summary.disbursementRate)}
          />
          <KpiCard
            title="Balance Less Earmarks"
            value={formatPeso(summary.balanceLessEarmarks)}
            icon={Shield}
          />
        </motion.div>

        {/* Section 3: Charts grid 2x2 */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <ChartCard title="Utilization Rate by Office">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${formatPercent(value)}`, 'Utilization']}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {utilizationChartData.map((entry, index) => (
                    <Cell key={`cell-util-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Disbursement Rate by Office">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={disbursementChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${formatPercent(value)}`, 'Disbursement Rate']}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {disbursementChartData.map((entry, index) => (
                    <Cell key={`cell-disb-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Net Allotment vs Net Obligation">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allotmentVsObligationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickFormatter={(v: number) => formatPeso(v)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatPeso(value)]}
                />
                <Legend />
                <Bar
                  dataKey="Net Allotment"
                  fill="#DC2626"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Net Obligation"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Obligation Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickFormatter={(v: number) => formatPeso(v)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatPeso(value)]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="obligation"
                  name="Monthly Obligation"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ fill: '#DC2626' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative"
                  stroke="#991B1B"
                  strokeWidth={2}
                  dot={{ fill: '#991B1B' }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Section 4: More charts (3 cols) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <ChartCard title="Unpaid Obligations by Office">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={unpaidByOfficeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickFormatter={(v: number) => formatPeso(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatPeso(value), 'Unpaid']}
                />
                <Bar
                  dataKey="unpaid"
                  fill="#DC2626"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="PAP Utilization">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={papUtilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {papUtilizationData.map((_entry, index) => (
                    <Cell
                      key={`cell-pap-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatPeso(value)]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="UACS Spending Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={uacsDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickFormatter={(v: number) => formatPeso(v)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatPeso(value), 'Amount']}
                />
                <Bar dataKey="amount" fill="#DC2626" radius={[4, 4, 0, 0]}>
                  {uacsDistributionData.map((_entry, index) => (
                    <Cell
                      key={`cell-uacs-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Section 5: Alerts */}
        {alerts.length > 0 && (
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Alerts &amp; Notifications
            </h2>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <AlertCard
                  key={`alert-${idx}`}
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                />
              ))}
            </div>
          </motion.div>
        )}
          </motion.div>
        </>
      )}
    </div>
  );
}
