import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useFilters } from '../../contexts/FilterContext';
import { useSettings } from '../../contexts/SettingsContext';
import { MultiSelectDropdown } from './MultiSelectDropdown';

const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters } = useFilters();
  const { filterOptions } = useSettings();

  return (
    <div className="mb-6 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <MultiSelectDropdown
          label="Office/Region"
          allLabel="All offices and regions"
          options={filterOptions.office}
          selectedValues={filters.office}
          onChange={(office) => setFilters({ office })}
        />

        <MultiSelectDropdown
          label="Fiscal Year"
          allLabel="All fiscal years"
          options={filterOptions.fiscalYear}
          selectedValues={filters.fiscalYear}
          onChange={(fiscalYear) => setFilters({ fiscalYear })}
        />

        <MultiSelectDropdown
          label="Appropriation Type"
          allLabel="All appropriation types"
          options={filterOptions.appropriationType}
          selectedValues={filters.appropriationType}
          onChange={(appropriationType) => setFilters({ appropriationType })}
        />

        <MultiSelectDropdown
          label="PAP"
          allLabel="All PAPs"
          options={filterOptions.pap}
          selectedValues={filters.pap}
          onChange={(pap) => setFilters({ pap })}
        />

        <button
          onClick={resetFilters}
          className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-800"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
export { FilterBar };
