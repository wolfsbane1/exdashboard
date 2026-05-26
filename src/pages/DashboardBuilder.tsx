import React from 'react';
import { motion } from 'framer-motion';
import { DashboardBuilderCanvas } from '../components/builder/DashboardBuilderCanvas';
import { FilterBar } from '../components/layout/FilterBar';
import * as api from '../services/exdashApi';
import { Wrench, Plus, Save, Eye, EyeOff, BarChart3, TrendingUp, PieChart, Table2, Activity, AlertTriangle, Calculator, Trash2 } from 'lucide-react';
import type { DashboardWidget, DashboardDefinition } from '../types/dashboard';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const WIDGET_TYPES = [
  { type: 'KPI', label: 'KPI Card', icon: BarChart3, defaultW: 3, defaultH: 2 },
  { type: 'BAR', label: 'Bar Chart', icon: BarChart3, defaultW: 6, defaultH: 4 },
  { type: 'LINE', label: 'Line Chart', icon: TrendingUp, defaultW: 6, defaultH: 4 },
  { type: 'DONUT', label: 'Donut Chart', icon: PieChart, defaultW: 6, defaultH: 4 },
  { type: 'TABLE', label: 'Data Table', icon: Table2, defaultW: 12, defaultH: 4 },
  { type: 'PROGRESS', label: 'Progress Bar', icon: Activity, defaultW: 3, defaultH: 2 },
  { type: 'ALERT', label: 'Alert Card', icon: AlertTriangle, defaultW: 6, defaultH: 2 },
  { type: 'SCENARIO', label: 'Scenario Card', icon: Calculator, defaultW: 4, defaultH: 3 },
];

const METRICS = [
  'totalNetAllotment', 'totalNetObligation', 'actualBalance', 'utilizationRate',
  'earmarks', 'balanceLessEarmarks', 'disbursement', 'unpaidObligations', 'disbursementRate',
];

const GROUP_BY = ['office', 'pap', 'uacs', 'period'];

export default function DashboardBuilder() {
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = React.useState<string | null>(null);
  const [dashboardName, setDashboardName] = React.useState('My Dashboard');
  const [isPreview, setIsPreview] = React.useState(false);
  const [savedDashboards, setSavedDashboards] = React.useState<DashboardDefinition[]>([]);
  const [templates, setTemplates] = React.useState<DashboardDefinition[]>([]);

  // Widget settings state
  const [editTitle, setEditTitle] = React.useState('');
  const [editMetric, setEditMetric] = React.useState('');
  const [editGroupBy, setEditGroupBy] = React.useState('');
  const [editSize, setEditSize] = React.useState<'small' | 'medium' | 'large'>('medium');

  React.useEffect(() => {
    api.getDashboards().then(setSavedDashboards).catch(() => {});
    api.getDashboardTemplates().then(setTemplates).catch(() => {});
  }, []);

  const handleAddWidget = (typeInfo: typeof WIDGET_TYPES[0]) => {
    const id = 'w-' + Date.now().toString(36);
    const newWidget: DashboardWidget = {
      id, type: typeInfo.type as DashboardWidget['type'],
      title: typeInfo.label, metric: METRICS[0], groupBy: GROUP_BY[0],
      filters: {}, x: 0, y: 0, w: typeInfo.defaultW, h: typeInfo.defaultH, settings: {},
    };
    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidget(id);
    setEditTitle(typeInfo.label);
    setEditMetric(METRICS[0]);
    setEditGroupBy(GROUP_BY[0]);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (selectedWidget === id) setSelectedWidget(null);
  };

  const handleEditWidget = (id: string) => {
    setSelectedWidget(id);
    const w = widgets.find(w => w.id === id);
    if (w) { setEditTitle(w.title); setEditMetric(w.metric); setEditGroupBy(w.groupBy); }
  };

  const handleApplySettings = () => {
    if (!selectedWidget) return;
    const sizeMap = { small: { w: 3, h: 2 }, medium: { w: 6, h: 3 }, large: { w: 12, h: 4 } };
    const size = sizeMap[editSize];
    setWidgets(prev => prev.map(w => w.id === selectedWidget ? { ...w, title: editTitle, metric: editMetric, groupBy: editGroupBy, w: size.w, h: size.h } : w));
  };

  const handleSave = async () => {
    try {
      await api.saveDashboard({
        name: dashboardName, description: '', scope: 'ENTIRE_DSWD',
        widgets, filters: {}, visibility: 'PRIVATE', createdBy: 'current-user',
      });
      const updated = await api.getDashboards();
      setSavedDashboards(updated);
    } catch (e) { console.error(e); }
  };

  const handleLoadDashboard = (db: DashboardDefinition) => {
    setWidgets(db.widgets);
    setDashboardName(db.name);
  };

  const selectedWidgetData = widgets.find(w => w.id === selectedWidget);

  return (
    <div className="p-6">
      <FilterBar />
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Wrench size={24} className="text-red-500" /> Dashboard Builder</h1>
            <p className="text-sm text-gray-500 mt-1">Create custom dashboards with drag-and-drop widgets</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsPreview(!isPreview)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isPreview ? 'bg-red-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {isPreview ? <><EyeOff size={16} /> Edit Mode</> : <><Eye size={16} /> Preview</>}
            </button>
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
          <input
            value={dashboardName}
            onChange={e => setDashboardName(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none w-48"
          />
          <button onClick={handleSave} className="flex items-center gap-1.5 bg-red-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors">
            <Save size={14} /> Save
          </button>
          {savedDashboards.length > 0 && (
            <select
              onChange={e => { const db = savedDashboards.find(d => d.id === e.target.value); if (db) handleLoadDashboard(db); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
              defaultValue=""
            >
              <option value="" disabled>Load saved...</option>
              {savedDashboards.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          {templates.length > 0 && (
            <select
              onChange={e => { const t = templates.find(d => d.id === e.target.value); if (t) handleLoadDashboard(t); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
              defaultValue=""
            >
              <option value="" disabled>Load template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button onClick={() => setWidgets([])} className="flex items-center gap-1.5 border border-gray-200 text-gray-500 rounded-lg px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
            <Trash2 size={14} /> Clear All
          </button>
        </motion.div>

        {/* Three Panel Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Widget Palette */}
          {!isPreview && (
            <motion.div variants={itemVariants} className="col-span-2 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Widget</p>
              {WIDGET_TYPES.map(wt => (
                <button
                  key={wt.type}
                  onClick={() => handleAddWidget(wt)}
                  className="w-full flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-3 text-sm text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                >
                  <wt.icon size={16} />
                  {wt.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Center: Canvas */}
          <motion.div variants={itemVariants} className={isPreview ? 'col-span-12' : 'col-span-7'}>
            <DashboardBuilderCanvas
              widgets={widgets}
              onRemoveWidget={handleRemoveWidget}
              onEditWidget={handleEditWidget}
              isPreview={isPreview}
              selectedWidgetId={selectedWidget}
            />
          </motion.div>

          {/* Right: Widget Settings */}
          {!isPreview && (
            <motion.div variants={itemVariants} className="col-span-3">
              {selectedWidgetData ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 sticky top-20">
                  <h3 className="text-sm font-semibold text-gray-800">Widget Settings</h3>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                    <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{selectedWidgetData.type}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Metric</label>
                    <select value={editMetric} onChange={e => setEditMetric(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none">
                      {METRICS.map(m => <option key={m} value={m}>{m.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Group By</label>
                    <select value={editGroupBy} onChange={e => setEditGroupBy(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none">
                      {GROUP_BY.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</label>
                    <div className="flex gap-2 mt-1">
                      {(['small', 'medium', 'large'] as const).map(s => (
                        <button key={s} onClick={() => setEditSize(s)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${editSize === s ? 'bg-red-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleApplySettings} className="w-full bg-red-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors">Apply</button>
                  <button onClick={() => handleRemoveWidget(selectedWidgetData.id)} className="w-full border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors">Remove Widget</button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                  <p className="text-sm text-gray-400">Select a widget to edit its settings</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
