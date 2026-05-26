import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ThresholdLevel } from '../../types/finance';
import MaximizeControl from '../utility/MaximizeControl';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string } | string;
  trendDirection?: 'up' | 'down';
  thresholdLevel?: ThresholdLevel;
  onClick?: () => void;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const thresholdColors: Record<ThresholdLevel, string> = {
  good: 'text-green-600',
  monitoring: 'text-amber-500',
  low: 'text-red-600',
  critical: 'text-red-600',
};

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection,
  thresholdLevel,
  onClick,
}) => {
  const valueColor = thresholdLevel ? thresholdColors[thresholdLevel] : 'text-gray-800';
  const trendContent = (
    <>
      {typeof trend === 'string' && (
        <div className="flex items-center gap-1 mt-2">
          {trendDirection === 'down' ? (
            <TrendingDown size={14} className="text-red-600" />
          ) : (
            <TrendingUp size={14} className="text-green-600" />
          )}
          <span
            className={`text-xs font-medium ${
              trendDirection === 'down' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {trend}
          </span>
        </div>
      )}
      {trend && typeof trend !== 'string' && (
        <div className="flex items-center gap-1 mt-2">
          {trend.value >= 0 ? (
            <TrendingUp size={14} className="text-green-600" />
          ) : (
            <TrendingDown size={14} className="text-red-600" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.value >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value.toFixed(2)}%
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}
    </>
  );

  const content = (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
        {trendContent}
      </div>
      <div className="bg-red-50 p-3 rounded-lg flex-shrink-0 ml-4">
        <Icon size={24} className="text-red-600" />
      </div>
    </div>
  );

  const expandedContent = (
    <div className="w-full max-w-4xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className={`mt-3 break-words text-4xl font-bold sm:text-5xl ${valueColor}`}>{value}</p>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm text-gray-500">{subtitle}</p>
          )}
          <div className="mt-2">{trendContent}</div>
        </div>
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Icon size={38} />
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      transition={fadeIn.transition}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="mb-3 flex justify-end">
        <MaximizeControl title={title} contentClassName="flex min-h-[58vh] items-center justify-center">
          {expandedContent}
        </MaximizeControl>
      </div>
      {content}
    </motion.div>
  );
};

export default KpiCard;

export { KpiCard };
