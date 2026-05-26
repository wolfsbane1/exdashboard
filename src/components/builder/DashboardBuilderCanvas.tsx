import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { GripVertical, Pencil, X } from 'lucide-react';
import type { DashboardWidget } from '../../types/dashboard';
import MaximizeControl from '../utility/MaximizeControl';

interface DashboardBuilderCanvasProps {
  widgets: DashboardWidget[];
  onLayoutChange?: (widgets: DashboardWidget[]) => void;
  onRemoveWidget: (id: string) => void;
  onEditWidget: (id: string) => void;
  isPreview: boolean;
  selectedWidgetId?: string | null;
}

const SAMPLE_DATA = [
  { name: 'NCR', value: 85 },
  { name: 'CAR', value: 78 },
  { name: 'R-I', value: 91 },
  { name: 'R-II', value: 72 },
  { name: 'R-III', value: 88 },
  { name: 'R-V', value: 83 },
];

const COLORS = ['#DC2626', '#B91C1C', '#991B1B', '#EF4444', '#FCA5A5', '#16A34A'];

const sizeClasses: Record<string, string> = {
  '3': 'col-span-3',
  '4': 'col-span-4',
  '6': 'col-span-6',
  '12': 'col-span-12',
};

function WidgetContent({ widget }: { widget: DashboardWidget }) {
  switch (widget.type) {
    case 'KPI':
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-xs text-gray-500 mb-1">{widget.metric || 'Metric'}</p>
          <p className="text-3xl font-bold text-gray-800">₱669.42M</p>
          <p className="text-xs text-green-600 mt-1">+2.3% ▲</p>
        </div>
      );
    case 'BAR':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SAMPLE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#DC2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'LINE':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={SAMPLE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#DC2626" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'DONUT':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={SAMPLE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
              {SAMPLE_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    case 'TABLE':
      return (
        <div className="overflow-auto h-full text-xs">
          <table className="w-full">
            <thead><tr className="border-b"><th className="py-1 text-left text-gray-500">Office</th><th className="py-1 text-right text-gray-500">Value</th></tr></thead>
            <tbody>{SAMPLE_DATA.map(d => <tr key={d.name} className="border-b border-gray-50"><td className="py-1">{d.name}</td><td className="py-1 text-right font-mono">{d.value}%</td></tr>)}</tbody>
          </table>
        </div>
      );
    case 'PROGRESS':
      return (
        <div className="flex flex-col justify-center h-full gap-2">
          <p className="text-xs text-gray-500">{widget.metric || 'Progress'}</p>
          <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-red-500 h-4 rounded-full" style={{ width: '83%' }} /></div>
          <p className="text-sm font-semibold text-gray-700">82.59%</p>
        </div>
      );
    case 'ALERT':
      return (
        <div className="flex items-center gap-3 h-full bg-amber-50 rounded-lg p-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <div><p className="text-xs font-medium text-amber-800">Monitoring Required</p><p className="text-xs text-amber-600">3 offices below 80% utilization</p></div>
        </div>
      );
    case 'SCENARIO':
      return (
        <div className="flex flex-col justify-center h-full text-center">
          <p className="text-xs text-gray-500">Projected Utilization</p>
          <p className="text-2xl font-bold text-green-600">95.00%</p>
          <p className="text-xs text-gray-400 mt-1">+12.41% from baseline</p>
        </div>
      );
    default:
      return <div className="text-gray-400 text-sm text-center py-8">Unknown widget type</div>;
  }
}

export const DashboardBuilderCanvas: React.FC<DashboardBuilderCanvasProps> = ({
  widgets, onRemoveWidget, onEditWidget, isPreview, selectedWidgetId,
}) => {
  if (widgets.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <p className="text-gray-400 text-lg font-medium">Dashboard Canvas</p>
        <p className="text-gray-300 text-sm mt-1">Add widgets from the palette to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 min-h-[400px]">
      {widgets.map((widget, idx) => {
        const colSpan = sizeClasses[String(widget.w)] || 'col-span-6';
        const isSelected = selectedWidgetId === widget.id;

        return (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`${colSpan} bg-white rounded-2xl shadow-sm border ${isSelected ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-100'} p-4 relative group hover:shadow-md transition-all duration-200`}
            style={{ minHeight: widget.h * 80 }}
          >
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <MaximizeControl
                title={widget.title}
                className="h-7 w-7"
                contentClassName="min-h-[68vh]"
              >
                <div className="h-[68vh] min-h-[420px]">
                  <WidgetContent widget={widget} />
                </div>
              </MaximizeControl>
              {!isPreview && (
                <>
                <button onClick={() => onEditWidget(widget.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors">
                  <Pencil size={12} />
                </button>
                <button onClick={() => onRemoveWidget(widget.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors">
                  <X size={12} />
                </button>
                </>
              )}
            </div>
            {!isPreview && (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab">
                <GripVertical size={14} className="text-gray-400" />
              </div>
            )}
            <p className="text-xs font-medium text-gray-500 mb-2">{widget.title}</p>
            <div className="h-[calc(100%-24px)]">
              <WidgetContent widget={widget} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
