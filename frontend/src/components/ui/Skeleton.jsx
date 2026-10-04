import React from 'react';

export const SkeletonLine = ({ className = '' }) => (
  <div className={`skeleton animate-shimmer rounded-md h-4 ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
    <SkeletonLine className="w-1/3" />
    <SkeletonLine className="w-2/3 h-6" />
    <SkeletonLine className="w-full" />
    <SkeletonLine className="w-5/6" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0">
        {Array.from({ length: cols }).map((__, c) => (
          <SkeletonLine key={c} className={c === 0 ? 'w-1/4' : 'flex-1'} />
        ))}
      </div>
    ))}
  </div>
);
