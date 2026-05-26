import React from 'react';
import { Pencil, X, GripVertical } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardWidget } from '../../types/dashboard';
import MaximizeControl from '../utility/MaximizeControl';

interface DashboardWidgetCardProps {
  widget: DashboardWidget;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  isEditing?: boolean;
}

const sampleBarData = [
  { name: 'CO', value: 420 },
  { name: 'I', value: 380 },
  { name: 'II', value: 310 },
  { name: 'III', value: 450 },
  { name: 'IV-A', value: 390 },
  { name: 'V', value: 280 },
];

const sampleLineData = [
  { month: 'Jan', value: 65 },
  { month: 'Feb', value: 68 },
  { month: 'Mar', value: 72 },
  { month: 'Apr', value: 70 },
  { month: 'May', value: 78 },
  { month: 'Jun', value: 82 },
];

const samplePieData = [
  { name: 'PS', value: 45 },
  { name: 'MOOE', value: 35 },
  { name: 'CO', value: 15 },
  { name: 'FE', value: 5 },
];

const pieColors = ['#DC2626', '#EF4444', '#FCA5A5', '#FECACA'];

const SampleKpi: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full py-4">
    <p className="text-xs text-gray-500 font-medium">{title}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">₱669.42M</p>
    <p className="text-xs text-green-600 mt-1">+2.3% vs prior</p>
  </div>
);

const SampleBarChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={120}>
    <BarChart data={sampleBarData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
      <Bar dataKey="value" fill="#DC2626" radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const SampleLineChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={120}>
    <LineChart data={sampleLineData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
      <Line type="monotone" dataKey="value" stroke="#DC2626" strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

const SampleDonutChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={120}>
    <PieChart>
      <Pie
        data={samplePieData}
        cx="50%"
        cy="50%"
        innerRadius={30}
        outerRadius={50}
        dataKey="value"
        stroke="none"
      >
        {samplePieData.map((_, index) => (
          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);

const SampleTable: React.FC = () => (
  <div className="space-y-1.5 px-2 py-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex gap-2">
        <div className="h-3 bg-gray-200 rounded flex-1 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
      </div>
    ))}
  </div>
);

const SampleProgress: React.FC = () => (
  <div className="px-2 py-4 space-y-3">
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Utilization</span>
        <span>82.59%</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2.5">
        <div className="bg-red-500 rounded-full h-2.5" style={{ width: '82.59%' }} />
      </div>
    </div>
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Disbursement</span>
        <span>74.32%</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2.5">
        <div className="bg-amber-500 rounded-full h-2.5" style={{ width: '74.32%' }} />
      </div>
    </div>
  </div>
);

const SampleAlert: React.FC = () => (
  <div className="px-2 py-3">
    <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-lg p-3">
      <p className="text-xs font-semibold text-amber-800">Low Utilization Alert</p>
      <p className="text-xs text-amber-700 mt-0.5">3 offices below 75% threshold</p>
    </div>
  </div>
);

const SampleScenario: React.FC = () => (
  <div className="px-2 py-3 space-y-2">
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Scenario Result</span>
      <span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-[10px] font-medium">
        Low Risk
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <p className="text-[10px] text-gray-400">Proj. Utilization</p>
        <p className="text-sm font-semibold text-green-600">91.20%</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-400">Proj. Disbursement</p>
        <p className="text-sm font-semibold text-amber-500">78.50%</p>
      </div>
    </div>
  </div>
);

const widgetRenderers: Record<string, React.FC<{ title: string }>> = {
  KPI: SampleKpi,
  BAR: () => <SampleBarChart />,
  LINE: () => <SampleLineChart />,
  DONUT: () => <SampleDonutChart />,
  TABLE: () => <SampleTable />,
  PROGRESS: () => <SampleProgress />,
  ALERT: () => <SampleAlert />,
  SCENARIO: () => <SampleScenario />,
};

const DashboardWidgetCard: React.FC<DashboardWidgetCardProps> = ({
  widget,
  onRemove,
  onEdit,
  isEditing = false,
}) => {
  const Renderer = widgetRenderers[widget.type];

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border ${
        isEditing ? 'border-red-500 border-2' : 'border-gray-100'
      } h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md`}
    >
      {/* Header with drag handle and controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical size={14} className="text-gray-300 cursor-grab flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700 truncate">
            {widget.title}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <MaximizeControl
            title={widget.title}
            className="h-7 w-7 border-transparent bg-transparent shadow-none hover:bg-red-50"
            contentClassName="min-h-[68vh]"
          >
            <div className="h-[68vh] min-h-[420px]">
              {Renderer ? (
                <Renderer title={widget.title} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Unknown widget type
                </div>
              )}
            </div>
          </MaximizeControl>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(widget.id);
            }}
            className="p-1 rounded-md hover:bg-gray-200 transition-colors"
            aria-label="Edit widget"
          >
            <Pencil size={12} className="text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(widget.id);
            }}
            className="p-1 rounded-md hover:bg-red-100 transition-colors"
            aria-label="Remove widget"
          >
            <X size={12} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-hidden">
        {Renderer ? (
          <Renderer title={widget.title} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            Unknown widget type
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWidgetCard;
