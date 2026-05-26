import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatPeso, formatPercent } from '../../utils/formatters';
import MaximizeControl from '../utility/MaximizeControl';

interface ColumnDef {
  key: string;
  label: string;
  format?: 'peso' | 'percent' | 'number' | 'text';
  align?: 'left' | 'right';
  sortable?: boolean;
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
}

interface DataTableProps {
  columns: ColumnDef[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
  maxHeight?: string;
}

type SortDir = 'asc' | 'desc';

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onRowClick,
  maxHeight = '500px',
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir]);

  const formatValue = (value: unknown, format?: string): string => {
    if (value == null) return '—';
    switch (format) {
      case 'peso':
        return formatPeso(Number(value), false);
      case 'percent':
        return formatPercent(Number(value));
      case 'number':
        return Number(value).toLocaleString('en-PH');
      default:
        return String(value);
    }
  };

  const isNegative = (value: unknown): boolean => {
    return typeof value === 'number' && value < 0;
  };

  const getAlignment = (col: ColumnDef): string => {
    if (col.align) return col.align === 'right' ? 'text-right' : 'text-left';
    if (col.format === 'peso' || col.format === 'percent' || col.format === 'number') {
      return 'text-right';
    }
    return 'text-left';
  };

  const renderTable = (height: string) => (
    <div className="overflow-auto" style={{ maxHeight: height }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-white border-b-2 border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide cursor-pointer select-none hover:bg-gray-50 transition-colors ${getAlignment(
                    col
                  )}`}
                  onClick={() => handleSort(col.key)}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      getAlignment(col) === 'text-right' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{col.label}</span>
                    <div className="flex flex-col">
                      <ChevronUp
                        size={10}
                        className={`${
                          sortKey === col.key && sortDir === 'asc'
                            ? 'text-red-500'
                            : 'text-gray-300'
                        }`}
                      />
                      <ChevronDown
                        size={10}
                        className={`-mt-1 ${
                          sortKey === col.key && sortDir === 'desc'
                            ? 'text-red-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-gray-100 hover:bg-red-50 transition-colors ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => {
                    const cellValue = row[col.key];
                    const negative = isNegative(cellValue);
                    const isNumeric =
                      col.format === 'peso' ||
                      col.format === 'percent' ||
                      col.format === 'number';
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${getAlignment(col)} ${
                          isNumeric ? 'font-mono' : ''
                        } ${negative ? 'text-red-600' : 'text-gray-700'}`}
                      >
                        {col.render ? col.render(cellValue, row) : formatValue(cellValue, col.format)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  );

  return (
    <div
      className="finance-table bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="flex justify-end border-b border-gray-100 px-3 py-2">
        <MaximizeControl title="Data Table" contentClassName="min-h-[68vh]">
          <div className="finance-table overflow-hidden rounded-lg border border-gray-100 bg-white">
            {renderTable('72vh')}
          </div>
        </MaximizeControl>
      </div>
      {renderTable(maxHeight)}
    </div>
  );
};

export default DataTable;

export { DataTable };
