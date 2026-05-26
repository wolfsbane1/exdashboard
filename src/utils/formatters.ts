/**
 * Format a number as Philippine Peso currency.
 * @param value - The numeric value to format
 * @param compact - If true, returns compact form (₱669.42M). If false, returns full form (₱669,423,733.65). Default: true.
 */
export function formatPeso(value: number, compact: boolean = true): string {
  if (compact) {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1_000_000_000) {
      const formatted = (absValue / 1_000_000_000).toFixed(2);
      return `${sign}₱${formatted}B`;
    }
    if (absValue >= 1_000_000) {
      const formatted = (absValue / 1_000_000).toFixed(2);
      return `${sign}₱${formatted}M`;
    }
    if (absValue >= 1_000) {
      const formatted = (absValue / 1_000).toFixed(2);
      return `${sign}₱${formatted}K`;
    }
    return `${sign}₱${absValue.toFixed(2)}`;
  }

  return `₱${new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

/**
 * Format a number as a percentage with 2 decimal places.
 * @param value - The numeric percentage value (e.g. 82.59)
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Format a number in compact form without currency symbol.
 * @param value - The numeric value to format
 */
export function formatCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(1)}K`;
  }
  return `${sign}${absValue.toFixed(1)}`;
}

/**
 * Format an ISO date string into a human-readable format.
 * @param date - ISO date string (e.g. '2025-05-21T00:00:00Z')
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a period and fiscal year into a readable string.
 * @param period - Period identifier (e.g. 'Q1', 'FULL_YEAR', 'MONTHLY')
 * @param year - Fiscal year number
 */
export function formatPeriod(period: string, year: number): string {
  switch (period) {
    case 'FULL_YEAR':
      return `Full Year ${year}`;
    case 'Q1':
      return `Q1 ${year}`;
    case 'Q2':
      return `Q2 ${year}`;
    case 'Q3':
      return `Q3 ${year}`;
    case 'Q4':
      return `Q4 ${year}`;
    case 'MONTHLY':
      return `Monthly ${year}`;
    default:
      return `${period} ${year}`;
  }
}
