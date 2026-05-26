import React from 'react';
import type { ThresholdLevel } from '../../types/finance';

interface RegionalRankBadgeProps {
  label: string;
  level: ThresholdLevel;
}

const levelStyles: Record<ThresholdLevel, string> = {
  good: 'bg-green-100 text-green-700',
  monitoring: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-800',
};

const RegionalRankBadge: React.FC<RegionalRankBadgeProps> = ({ label, level }) => {
  const styles = levelStyles[level];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
};

export default RegionalRankBadge;

export { RegionalRankBadge };
