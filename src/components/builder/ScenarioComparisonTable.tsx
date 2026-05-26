import React from 'react';
import { motion } from 'framer-motion';
import { formatPeso, formatPercent } from '../../utils/formatters';
import type { FinancialScenario } from '../../types/scenario';

interface ScenarioComparisonTableProps {
  scenarios: FinancialScenario[];
}

const riskColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  LOW_UTILIZATION: 'bg-amber-100 text-amber-700',
  PAYMENT_RISK: 'bg-amber-100 text-amber-700',
  HEALTHY: 'bg-green-100 text-green-700',
  TIGHT_BALANCE: 'bg-red-100 text-red-700',
};

export const ScenarioComparisonTable: React.FC<ScenarioComparisonTableProps> = ({ scenarios }) => {
  const withResults = scenarios.filter(s => s.projectedResults);

  if (withResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No computed scenarios to compare. Add assumptions and compute projections first.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Scenario</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Allotment</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Obligation</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Utilization</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Disbursement</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Unpaid</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Disb. Rate</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Risk</th>
          </tr>
        </thead>
        <tbody>
          {withResults.map((s, idx) => {
            const r = s.projectedResults!;
            return (
              <tr key={s.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-red-50 transition-colors`}>
                <td className="py-3 px-4 font-medium text-gray-800">{s.name}</td>
                <td className="py-3 px-4 text-right font-mono">{formatPeso(r.projectedNetAllotment)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatPeso(r.projectedNetObligation)}</td>
                <td className={`py-3 px-4 text-right font-mono ${r.projectedActualBalance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatPeso(r.projectedActualBalance)}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${r.projectedUtilizationRate >= 90 ? 'text-green-600' : r.projectedUtilizationRate >= 75 ? 'text-amber-500' : 'text-red-600'}`}>
                  {formatPercent(r.projectedUtilizationRate)}
                </td>
                <td className="py-3 px-4 text-right font-mono">{formatPeso(r.projectedDisbursement)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatPeso(r.projectedUnpaidObligations)}</td>
                <td className={`py-3 px-4 text-right font-mono ${r.projectedDisbursementRate >= 90 ? 'text-green-600' : r.projectedDisbursementRate >= 75 ? 'text-amber-500' : 'text-red-600'}`}>
                  {formatPercent(r.projectedDisbursementRate)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${riskColors[r.riskLevel] || 'bg-gray-100 text-gray-600'}`}>
                    {r.riskLevel.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
};
