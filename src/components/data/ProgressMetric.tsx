import React from 'react';
import { motion } from 'framer-motion';
import type { ThresholdLevel } from '../../types/finance';
import { formatPeso } from '../../utils/formatters';

interface ProgressMetricProps {
  label: string;
  value: number;
  maxValue?: number;
  percentage?: number;
  formatValue?: (value: number) => string;
  color?: 'green' | 'amber' | 'red';
  formatAsPeso?: boolean;
  thresholdLevel?: ThresholdLevel;
}

const barColors: Record<ThresholdLevel, string> = {
  good: 'bg-green-600',
  monitoring: 'bg-amber-500',
  low: 'bg-red-600',
  critical: 'bg-red-600',
};

const textColors: Record<ThresholdLevel, string> = {
  good: 'text-green-600',
  monitoring: 'text-amber-500',
  low: 'text-red-600',
  critical: 'text-red-600',
};

const ProgressMetric: React.FC<ProgressMetricProps> = ({
  label,
  value,
  maxValue = 100,
  percentage,
  formatValue,
  color,
  formatAsPeso = false,
  thresholdLevel = 'monitoring',
}) => {
  const colorMap = {
    green: 'bg-green-600',
    amber: 'bg-amber-500',
    red: 'bg-red-600',
  };
  const textColorMap = {
    green: 'text-green-600',
    amber: 'text-amber-500',
    red: 'text-red-600',
  };
  const effectivePercentage = percentage ?? (maxValue !== 0 ? (value / maxValue) * 100 : 0);
  const barColor = color ? colorMap[color] : barColors[thresholdLevel];
  const textColor = color ? textColorMap[color] : textColors[thresholdLevel];
  const clampedPercentage = Math.min(Math.max(effectivePercentage, 0), 100);

  const displayValue = formatValue
    ? formatValue(value)
    : formatAsPeso
      ? formatPeso(value, true)
      : value.toLocaleString('en-PH');
  const displayMax = formatAsPeso ? formatPeso(maxValue, true) : maxValue.toLocaleString('en-PH');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
        <span className="text-sm font-semibold text-gray-800 ml-2 flex-shrink-0">
          {displayValue}
          {!formatValue && <span className="text-xs text-gray-400 font-normal"> / {displayMax}</span>}
        </span>
      </div>
      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`${barColor} rounded-full h-3`}
        />
      </div>
      <p className={`text-xs font-medium ${textColor}`}>
        {effectivePercentage.toFixed(2)}%
      </p>
    </div>
  );
};

export default ProgressMetric;

export { ProgressMetric };
