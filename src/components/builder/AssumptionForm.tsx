import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AssumptionInput {
  type: 'ALLOTMENT' | 'OBLIGATION' | 'DISBURSEMENT' | 'EARMARK' | 'TARGET';
  label: string;
  method: 'AMOUNT' | 'PERCENTAGE' | 'TARGET_RATE';
  value: number;
  targetMetric: string;
  affectedOffice: string;
  affectedPap: string;
  affectedUacs: string;
  notes: string;
}

interface AssumptionFormProps {
  onAdd: (assumption: AssumptionInput) => void;
}

const TYPES = [
  { value: 'ALLOTMENT', label: 'Allotment' },
  { value: 'OBLIGATION', label: 'Obligation' },
  { value: 'DISBURSEMENT', label: 'Disbursement' },
  { value: 'EARMARK', label: 'Earmark' },
  { value: 'TARGET', label: 'Target' },
];

const METHODS: Record<string, { value: string; label: string }[]> = {
  ALLOTMENT: [{ value: 'AMOUNT', label: 'Amount' }, { value: 'PERCENTAGE', label: 'Percentage' }],
  OBLIGATION: [{ value: 'AMOUNT', label: 'Amount' }, { value: 'PERCENTAGE', label: 'Percentage' }],
  DISBURSEMENT: [{ value: 'AMOUNT', label: 'Amount' }, { value: 'PERCENTAGE', label: 'Percentage' }],
  EARMARK: [{ value: 'AMOUNT', label: 'Amount' }],
  TARGET: [{ value: 'TARGET_RATE', label: 'Target Rate' }],
};

export const AssumptionForm: React.FC<AssumptionFormProps> = ({ onAdd }) => {
  const [type, setType] = useState<AssumptionInput['type']>('OBLIGATION');
  const [method, setMethod] = useState<AssumptionInput['method']>('AMOUNT');
  const [value, setValue] = useState<string>('');
  const [targetMetric, setTargetMetric] = useState('UTILIZATION');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    const numValue = parseFloat(value);
    const label = generateLabel(type, method, numValue, targetMetric);

    onAdd({
      type,
      label,
      method,
      value: numValue,
      targetMetric: type === 'TARGET' ? targetMetric : '',
      affectedOffice: '',
      affectedPap: '',
      affectedUacs: '',
      notes,
    });

    setValue('');
    setNotes('');
  };

  const generateLabel = (t: string, m: string, v: number, tm: string): string => {
    if (t === 'TARGET') return `Target ${tm === 'UTILIZATION' ? 'utilization' : 'disbursement'} rate at ${v}%`;
    const action = v >= 0 ? 'Increase' : 'Decrease';
    const suffix = m === 'PERCENTAGE' ? `by ${Math.abs(v)}%` : `by ₱${Math.abs(v).toLocaleString()}`;
    return `${action} ${t.toLowerCase()} ${suffix}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
        <select
          value={type}
          onChange={e => { setType(e.target.value as AssumptionInput['type']); setMethod(METHODS[e.target.value]?.[0]?.value as AssumptionInput['method'] || 'AMOUNT'); }}
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        >
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Method</label>
        <select
          value={method}
          onChange={e => setMethod(e.target.value as AssumptionInput['method'])}
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        >
          {(METHODS[type] || []).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {type === 'TARGET' && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target Metric</label>
          <select
            value={targetMetric}
            onChange={e => setTargetMetric(e.target.value)}
            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          >
            <option value="UTILIZATION">Utilization Rate</option>
            <option value="DISBURSEMENT_RATE">Disbursement Rate</option>
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Value {method === 'PERCENTAGE' || method === 'TARGET_RATE' ? '(%)' : '(₱)'}
        </label>
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={method === 'PERCENTAGE' || method === 'TARGET_RATE' ? 'e.g. 95' : 'e.g. 50000000'}
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes..."
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-red-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-600 transition-colors"
      >
        <Plus size={16} />
        Add Assumption
      </button>
    </form>
  );
};
