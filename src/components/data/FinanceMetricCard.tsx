import React from 'react';
import { motion } from 'framer-motion';
import type { ThresholdLevel } from '../../types/finance';
import MaximizeControl from '../utility/MaximizeControl';

interface FinanceMetricCardProps {
  label: string;
  value: string;
  subLabel?: string;
  compact?: boolean;
  thresholdLevel?: ThresholdLevel;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const borderColors: Record<ThresholdLevel, string> = {
  good: 'border-l-green-600',
  monitoring: 'border-l-amber-500',
  low: 'border-l-red-600',
  critical: 'border-l-red-600',
};

const valueColors: Record<ThresholdLevel, string> = {
  good: 'text-green-600',
  monitoring: 'text-amber-500',
  low: 'text-red-600',
  critical: 'text-red-600',
};

const FinanceMetricCard: React.FC<FinanceMetricCardProps> = ({
  label,
  value,
  subLabel,
  compact = false,
  thresholdLevel,
}) => {
  const borderColor = thresholdLevel ? borderColors[thresholdLevel] : 'border-l-red-500';
  const valColor = thresholdLevel ? valueColors[thresholdLevel] : 'text-gray-800';
  const content = (
    <>
      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide truncate">
        {label}
      </p>
      <p className={`${compact ? 'text-base' : 'text-lg'} font-semibold mt-1 ${valColor}`}>
        {value}
      </p>
      {subLabel && (
        <p className="text-xs text-gray-400 mt-0.5 truncate">{subLabel}</p>
      )}
    </>
  );

  return (
    <motion.div
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      transition={fadeIn.transition}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} ${
        compact ? 'p-3' : 'p-4'
      } hover:shadow-md transition-all duration-200`}
    >
      <div className="mb-2 flex justify-end">
        <MaximizeControl title={label} contentClassName="flex min-h-[50vh] items-center justify-center">
          <div className={`w-full max-w-lg rounded-xl border border-gray-100 border-l-4 ${borderColor} bg-white p-8 shadow-sm`}>
            {content}
          </div>
        </MaximizeControl>
      </div>
      {content}
    </motion.div>
  );
};

export default FinanceMetricCard;

export { FinanceMetricCard };
