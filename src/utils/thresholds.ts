export type ThresholdLevel = 'good' | 'monitoring' | 'low' | 'critical';

/**
 * Determine the threshold level for a utilization rate.
 * >=90%: good, 75-89.99%: monitoring, <75%: low
 */
export function getUtilizationLevel(rate: number): ThresholdLevel {
  if (rate >= 90) return 'good';
  if (rate >= 75) return 'monitoring';
  return 'low';
}

/**
 * Determine the threshold level for a disbursement rate.
 * Same thresholds as utilization.
 */
export function getDisbursementLevel(rate: number): ThresholdLevel {
  if (rate >= 90) return 'good';
  if (rate >= 75) return 'monitoring';
  return 'low';
}

/**
 * Determine the threshold level for a balance.
 * Negative balance is critical, otherwise good.
 */
export function getBalanceLevel(balance: number): ThresholdLevel {
  if (balance < 0) return 'critical';
  return 'good';
}

/**
 * Determine the threshold level for unpaid obligations.
 * >10% of net obligation is monitoring, otherwise good.
 */
export function getUnpaidLevel(unpaid: number, netObligation: number): ThresholdLevel {
  if (netObligation === 0) return 'good';
  const ratio = (unpaid / netObligation) * 100;
  if (ratio > 10) return 'monitoring';
  return 'good';
}

/**
 * Get the text color class for a threshold level.
 */
export function getThresholdColor(level: ThresholdLevel): string {
  switch (level) {
    case 'good':
      return 'text-green-600';
    case 'monitoring':
      return 'text-amber-500';
    case 'low':
      return 'text-red-600';
    case 'critical':
      return 'text-red-600';
  }
}

/**
 * Get the background color class for a threshold level.
 */
export function getThresholdBgColor(level: ThresholdLevel): string {
  switch (level) {
    case 'good':
      return 'bg-green-50';
    case 'monitoring':
      return 'bg-amber-50';
    case 'low':
      return 'bg-red-50';
    case 'critical':
      return 'bg-red-50';
  }
}

/**
 * Get the human-readable label for a threshold level.
 */
export function getThresholdLabel(level: ThresholdLevel): string {
  switch (level) {
    case 'good':
      return 'Good';
    case 'monitoring':
      return 'Monitoring';
    case 'low':
      return 'Low';
    case 'critical':
      return 'Critical';
  }
}

/**
 * Get combined badge classes (bg, text, border) for a threshold level.
 */
export function getThresholdBadgeClasses(level: ThresholdLevel): string {
  switch (level) {
    case 'good':
      return 'bg-green-50 text-green-600 border border-green-200';
    case 'monitoring':
      return 'bg-amber-50 text-amber-500 border border-amber-200';
    case 'low':
      return 'bg-red-50 text-red-600 border border-red-200';
    case 'critical':
      return 'bg-red-50 text-red-600 border border-red-200';
  }
}

/**
 * Get a composite rank badge based on multiple financial metrics.
 */
export function getRankBadge(
  utilizationRate: number,
  disbursementRate: number,
  unpaidRatio: number,
  balance: number
): { label: string; level: ThresholdLevel } {
  if (balance < 0) {
    return { label: 'Critical', level: 'critical' };
  }

  if (utilizationRate < 75 || disbursementRate < 75) {
    return { label: 'Low', level: 'low' };
  }

  if (unpaidRatio > 10 || utilizationRate < 90 || disbursementRate < 90) {
    return { label: 'Monitoring', level: 'monitoring' };
  }

  return { label: 'Good', level: 'good' };
}
