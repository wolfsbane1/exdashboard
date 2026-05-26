import React from 'react';

interface LoadingSkeletonProps {
  type?: 'kpi' | 'chart' | 'table' | 'card';
  count?: number;
}

const SkeletonPulse: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'chart', count = 1 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'kpi') {
    return (
      <div className="grid grid-cols-4 gap-4">
        {items.map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
            <div className="animate-pulse bg-gray-200 rounded h-4 w-24" />
            <div className="animate-pulse bg-gray-200 rounded h-8 w-32" />
            <div className="animate-pulse bg-gray-200 rounded h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="space-y-6">
        {items.map(i => (
          <SkeletonPulse key={i} className="h-80 w-full" />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
        <div className="animate-pulse bg-gray-200 rounded h-4 w-48 mb-4" />
        {items.map(i => (
          <React.Fragment key={i}>
            {Array.from({ length: 6 }, (_, j) => (
              <div key={j} className="flex gap-4 mb-2">
                <div className="animate-pulse bg-gray-200 rounded h-3 w-20" />
                <div className="animate-pulse bg-gray-200 rounded h-3 flex-1" />
                <div className="animate-pulse bg-gray-200 rounded h-3 w-24" />
                <div className="animate-pulse bg-gray-200 rounded h-3 w-16" />
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // card
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(i => (
        <SkeletonPulse key={i} className="h-40 w-full" />
      ))}
    </div>
  );
};
