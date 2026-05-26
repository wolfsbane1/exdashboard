import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
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
  Activity,
  AlertTriangle,
  MapPin,
  Building2,
} from 'lucide-react';

import { useFilters } from '../contexts/FilterContext';
import * as api from '../services/exdashApi';
import { formatPeso, formatPercent } from '../utils/formatters';
import {
  getUtilizationLevel,
  getDisbursementLevel,
  getBalanceLevel,
} from '../utils/thresholds';
import type {
  FinanceSummary,
  UACSummary,
  PAPSummary,
} from '../types/finance';

import { KpiCard } from '../components/data/KpiCard';
import { ChartCard } from '../components/data/ChartCard';
import { DataTable } from '../components/data/DataTable';
import { AlertCard } from '../components/data/AlertCard';
import { ProgressMetric } from '../components/data/ProgressMetric';
import { FilterBar } from '../components/layout/FilterBar';
import { LoadingSkeleton } from '../components/utility/LoadingSkeleton';

const CHART_COLORS = [
  '#DC2626',
  '#B91C1C',
  '#991B1B',
  '#EF4444',
  '#FCA5A5',
  '#16A34A',
  '#F59E0B',
  '#DC2626',
  '#6B7280',
  '#9CA3AF',
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

const REGIONS = [
  'REGION_I',
  'REGION_II',
  'REGION_III',
  'REGION_IV-A',
  'REGION_IV-B',
  'REGION_V',
  'REGION_VI',
  'REGION_VII',
  'REGION_VIII',
  'REGION_IX',
  'REGION_X',
  'REGION_XI',
  'REGION_XII',
  'REGION_XIII',
  'NCR',
  'CAR',
  'BARMM',
  'CENTRAL_OFFICE',
];

interface DashboardPageProps {
  embedded?: boolean;
}

export default function RegionalDashboard({ embedded = false }: DashboardPageProps) {
  const { filters } = useFilters();
  const [selectedRegion, setSelectedRegion] = useState<string>(
    filters.office[0] || 'REGION_V'
  );
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [uacsData, setUacsData] = useState<UACSummary[]>([]);
  const [papData, setPapData] = useState<PAPSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const regionFilters = { ...filters, office: [selectedRegion] };
        const [summaryRes, uacsRes, papRes] = await Promise.all([
          api.getFinanceSummary(regionFilters),
          api.getFinanceByUacs(regionFilters),
          api.getFinanceByPap(regionFilters),
        ]);
        if (!cancelled) {
          setSummary(summaryRes);
          setUacsData(uacsRes);
          setPapData(papRes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load regional data'
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
  }, [filters, selectedRegion]);

  const handleRegionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedRegion(e.target.value);
    },
    []
  );

  const uacsTableColumns = useMemo(
    () => [
      { key: 'uacsCode' as const, label: 'UACS Code', sortable: true },
      { key: 'description' as const, label: 'Description', sortable: true },
      {
        key: 'netAllotment' as const,
        label: 'Net Allotment',
        sortable: true,
        render: (val: number) => formatPeso(val),
      },
      {
        key: 'netObligation' as const,
        label: 'Net Obligation',
        sortable: true,
        render: (val: number) => formatPeso(val),
      },
      {
        key: 'balance' as const,
        label: 'Balance',
        sortable: true,
        render: (val: number) => (
          <span className={val < 0 ? 'text-red-600 font-semibold' : ''}>
            {formatPeso(val)}
          </span>
        ),
      },
      {
        key: 'utilizationRate' as const,
        label: 'Utilization',
        sortable: true,
        render: (val: number) => {
          const level = getUtilizationLevel(val);
          const colorClass =
            level === 'good'
              ? 'text-green-600'
              : level === 'monitoring'
                ? 'text-amber-500'
                : 'text-red-600';
          return <span className={`font-semibold ${colorClass}`}>{formatPercent(val)}</span>;
        },
      },
      {
        key: 'disbursement' as const,
        label: 'Disbursement',
        sortable: true,
        render: (val: number) => formatPeso(val),
      },
      {
        key: 'unpaidObligations' as const,
        label: 'Unpaid',
        sortable: true,
        render: (val: number) => formatPeso(val),
      },
      {
        key: 'disbursementRate' as const,
        label: 'Disb. Rate',
        sortable: true,
        render: (val: number) => formatPercent(val),
      },
    ],
    []
  );

  const papChartData = useMemo(
    () =>
      papData.map((p) => ({
        name: p.papName || p.papDescription,
        allotment: p.netAllotment || p.totalNetAllotment,
        obligation: p.netObligation || p.totalNetObligation,
        balance: p.balance || p.actualBalance,
      })),
    [papData]
  );

  const objectCodeDistribution = useMemo(
    () =>
      uacsData.slice(0, 8).map((u) => ({
        name: u.description || u.uacsDescription || u.uacsCode,
        value: u.netObligation || u.totalNetObligation,
      })),
    [uacsData]
  );

  const alerts = useMemo(() => {
    const result: Array<{
      type: 'success' | 'warning' | 'critical';
      title: string;
      message: string;
    }> = [];

    if (summary) {
      if (summary.utilizationRate >= 90) {
        result.push({
          type: 'success',
          title: 'Utilization On Track',
          message: `${selectedRegion.replace(/_/g, ' ')} utilization rate is ${formatPercent(summary.utilizationRate)}.`,
        });
      } else if (summary.utilizationRate < 75) {
        result.push({
          type: 'warning',
          title: 'Low Utilization',
          message: `${selectedRegion.replace(/_/g, ' ')} utilization rate is only ${formatPercent(summary.utilizationRate)}. Review needed.`,
        });
      }

      if (summary.actualBalance < 0) {
        result.push({
          type: 'critical',
          title: 'Negative Balance',
          message: `The region has a negative actual balance of ${formatPeso(summary.actualBalance)}.`,
        });
      }

      if (
        summary.totalNetObligation > 0 &&
        summary.unpaidObligations / summary.totalNetObligation > 0.1
      ) {
        result.push({
          type: 'warning',
          title: 'High Unpaid Obligations',
          message: `Unpaid obligations are ${formatPeso(summary.unpaidObligations)} (${formatPercent((summary.unpaidObligations / summary.totalNetObligation) * 100)} of net obligation).`,
        });
      }
    }

    return result;
  }, [summary, selectedRegion]);

  if (loading) {
    return (
      <div className={embedded ? 'space-y-6' : 'space-y-6 p-6'}>
        {!embedded && <FilterBar />}
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={embedded ? 'space-y-6' : 'space-y-6 p-6'}>
        {!embedded && <FilterBar />}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Data</h3>
              <p className="text-gray-500 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6 p-6'}>
      {!embedded && <FilterBar />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Section 1: Region Selector + Title */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Regional Dashboard</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {selectedRegion.replace(/_/g, ' ')} Financial Overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Section 2: Regional KPI Summary */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <KpiCard
            title="Net Allotment"
            value={formatPeso(summary.totalNetAllotment)}
            icon={DollarSign}
          />
          <KpiCard
            title="Net Obligation"
            value={formatPeso(summary.totalNetObligation)}
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
            value={formatPeso(summary.disbursement)}
            icon={Activity}
          />
          <KpiCard
            title="Disbursement Rate"
            value={formatPercent(summary.disbursementRate)}
            icon={Activity}
            thresholdLevel={getDisbursementLevel(summary.disbursementRate)}
          />
        </motion.div>

        {/* Section 3: UACS Table + PAP Chart */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              UACS Detail Table
            </h3>
            <div className="overflow-x-auto">
              <DataTable columns={uacsTableColumns} data={uacsData} />
            </div>
          </div>

          <ChartCard title="PAP Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={papChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  angle={-30}
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
                  dataKey="allotment"
                  name="Allotment"
                  fill="#DC2626"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="obligation"
                  name="Obligation"
                  fill="#B91C1C"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Section 4: Object Code Distribution + Disbursement Status */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <ChartCard title="Object Code Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={objectCodeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {objectCodeDistribution.map((_entry, index) => (
                    <Cell
                      key={`cell-oc-${index}`}
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Disbursement Status by PAP
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {papData.map((pap, idx) => (
                <ProgressMetric
                  key={`prog-${idx}`}
                  label={pap.papName || pap.papDescription}
                  value={pap.disbursementRate}
                  maxValue={100}
                  formatValue={(v: number) => formatPercent(v)}
                  color={
                    pap.disbursementRate >= 90
                      ? 'green'
                      : pap.disbursementRate >= 75
                        ? 'amber'
                        : 'red'
                  }
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Section 5: Alert Cards */}
        {alerts.length > 0 && (
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Regional Alerts
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
    </div>
  );
}
