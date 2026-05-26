import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { FilterOption } from '../../data/filterOptions';

interface MultiSelectDropdownProps {
  label: string;
  allLabel: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const buttonClasses =
  'w-full min-w-[180px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm shadow-sm outline-none transition-all hover:border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100';

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  allLabel,
  options,
  selectedValues,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionValues = useMemo(() => options.map((option) => option.value), [options]);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const allSelected = selectedValues.length === 0 || selectedValues.length >= optionValues.length;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayText = useMemo(() => {
    if (options.length === 0) return 'No options configured';
    if (allSelected) return allLabel;
    if (selectedValues.length === 1) {
      return options.find((option) => option.value === selectedValues[0])?.label || '1 selected';
    }
    return `${selectedValues.length} selected`;
  }, [allLabel, allSelected, options, selectedValues]);

  const toggleOption = (value: string) => {
    if (allSelected) {
      onChange([value]);
      return;
    }

    const currentValues = allSelected ? optionValues : selectedValues;
    const next = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    onChange(next.length === 0 || next.length === optionValues.length ? [] : next);
  };

  return (
    <div className="relative flex-1 min-w-[180px]" ref={wrapperRef}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <button type="button" className={buttonClasses} onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center justify-between gap-3">
          <span className="truncate font-medium text-gray-700">{displayText}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-red-50"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                allSelected ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300'
              }`}
            >
              {allSelected && <Check size={12} />}
            </span>
            Select All
          </button>

          <div className="my-1 h-px bg-gray-100" />

          {options.map((option) => {
            const checked = allSelected || selectedSet.has(option.value);
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => toggleOption(option.value)}
                className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-red-50"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {checked && <Check size={12} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-gray-700">{option.label}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-gray-400">{option.description}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
