import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FilterState, ViewScope, Period } from '../types/finance';

interface FilterContextValue {
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  scope: 'ENTIRE_DSWD' as ViewScope,
  office: [],
  fiscalYear: [],
  appropriationType: [],
  pap: [],
  uacs: 'ALL',
  period: 'FULL_YEAR' as Period,
};

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);

  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
