import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Wrench,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Executive Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Financial Assumptions', icon: Calculator, path: '/assumptions' },
  { label: 'Dashboard Builder', icon: Wrench, path: '/builder' },
  { label: 'API Console', icon: Terminal, path: '/api-console' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-red-700 via-red-700 to-red-900 text-white flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0 shadow-2xl`}
    >
      {/* Logo Area */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-2' : 'px-6'} border-b border-white/10`}>
        {collapsed ? (
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-red-700 font-bold text-sm">eD</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-red-700 font-bold text-sm">eD</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                ex<span className="text-red-100">DASH</span>
              </h1>
              <p className="text-[10px] text-red-100 leading-tight">Analytics Hub</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-red-700 shadow-lg'
                  : 'text-red-100 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={`flex-shrink-0 ${
                    isActive ? 'text-red-700' : 'text-red-100 group-hover:text-white'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-lg">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
