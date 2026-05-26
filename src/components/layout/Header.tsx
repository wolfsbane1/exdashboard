import React from 'react';
import { Download, Moon, RefreshCw, Sun, User } from 'lucide-react';
import { useFilters } from '../../contexts/FilterContext';
import { useRole } from '../../contexts/RoleContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';

const Header: React.FC = () => {
  const { filters } = useFilters();
  const { role } = useRole();
  const { theme, toggleTheme } = useTheme();
  const { filterOptions } = useSettings();

  const officeLabel =
    filters.office.length === 0
      ? 'All offices and regions'
      : filters.office.length === 1
        ? filterOptions.office.find((option) => option.value === filters.office[0])?.label || filters.office[0]
        : `${filters.office.length} offices/regions`;

  const fiscalYearLabel =
    filters.fiscalYear.length === 0
      ? 'All FY'
      : filters.fiscalYear.length === 1
        ? `FY ${filters.fiscalYear[0]}`
        : `${filters.fiscalYear.length} FYs`;

  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between flex-shrink-0 z-10">
      {/* Left: Title */}
      <div className="flex flex-col">
        <h1 className="font-bold text-lg text-gray-800 leading-tight">
          ex<span className="text-red-600">DASH</span>
        </h1>
        <p className="text-xs text-gray-500 leading-tight">
          EMPOWERX Dashboard and Analytics Services Hub
        </p>
      </div>

      {/* Center: Current Scope Pill */}
      <div className="hidden md:flex items-center gap-2">
        <span className="bg-red-50 text-red-700 rounded-full px-3 py-1 text-sm font-medium">
          {officeLabel}
        </span>
        <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">
          {fiscalYearLabel}
        </span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Last Sync */}
        <span className="text-xs text-gray-400 hidden lg:block">
          Last sync: May 21, 2025 09:00 AM
        </span>

        {/* Refresh Button */}
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-all duration-200"
          aria-label="Refresh data"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Export Button */}
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          aria-label="Export data"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 transition-all duration-200 hover:bg-gray-50"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Role Chip */}
        <div className="bg-gray-100 rounded-full px-3 py-1.5 flex items-center gap-2">
          <User size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700">{roleLabel}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
export { Header };
