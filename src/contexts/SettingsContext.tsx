import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FILTER_OPTIONS,
  type FilterOption,
  type FilterOptionGroup,
  type FilterOptionState,
} from '../data/filterOptions';

interface SettingsContextValue {
  filterOptions: FilterOptionState;
  addFilterOption: (group: FilterOptionGroup, option: Omit<FilterOption, 'id'>) => void;
  updateFilterOption: (group: FilterOptionGroup, id: string, option: Omit<FilterOption, 'id'>) => void;
  deleteFilterOption: (group: FilterOptionGroup, id: string) => void;
  resetFilterOptions: () => void;
}

const STORAGE_KEY = 'exdash.filterOptions.v1';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function mergeWithDefaults(saved: Partial<FilterOptionState> | null): FilterOptionState {
  return {
    office: saved?.office?.length ? saved.office : DEFAULT_FILTER_OPTIONS.office,
    fiscalYear: saved?.fiscalYear?.length ? saved.fiscalYear : DEFAULT_FILTER_OPTIONS.fiscalYear,
    appropriationType: saved?.appropriationType?.length
      ? saved.appropriationType
      : DEFAULT_FILTER_OPTIONS.appropriationType,
    pap: saved?.pap?.length ? saved.pap : DEFAULT_FILTER_OPTIONS.pap,
  };
}

function makeId(group: FilterOptionGroup, value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${group}-${normalized || Date.now()}`;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [filterOptions, setFilterOptions] = useState<FilterOptionState>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return mergeWithDefaults(saved ? JSON.parse(saved) : null);
    } catch {
      return DEFAULT_FILTER_OPTIONS;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filterOptions));
  }, [filterOptions]);

  const addFilterOption = useCallback((group: FilterOptionGroup, option: Omit<FilterOption, 'id'>) => {
    setFilterOptions((prev) => ({
      ...prev,
      [group]: [
        ...prev[group],
        {
          ...option,
          value: option.value.trim(),
          label: option.label.trim(),
          id: makeId(group, option.value || option.label),
        },
      ],
    }));
  }, []);

  const updateFilterOption = useCallback(
    (group: FilterOptionGroup, id: string, option: Omit<FilterOption, 'id'>) => {
      setFilterOptions((prev) => ({
        ...prev,
        [group]: prev[group].map((item) =>
          item.id === id
            ? {
                ...item,
                value: option.value.trim(),
                label: option.label.trim(),
                description: option.description,
              }
            : item
        ),
      }));
    },
    []
  );

  const deleteFilterOption = useCallback((group: FilterOptionGroup, id: string) => {
    setFilterOptions((prev) => ({
      ...prev,
      [group]: prev[group].filter((item) => item.id !== id),
    }));
  }, []);

  const resetFilterOptions = useCallback(() => {
    setFilterOptions(DEFAULT_FILTER_OPTIONS);
  }, []);

  const value = useMemo(
    () => ({
      filterOptions,
      addFilterOption,
      updateFilterOption,
      deleteFilterOption,
      resetFilterOptions,
    }),
    [addFilterOption, deleteFilterOption, filterOptions, resetFilterOptions, updateFilterOption]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
