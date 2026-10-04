import React, { useEffect, useState } from 'react';

const COLORS = {
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-500',
  purple: 'bg-purple-600',
  indigo: 'bg-indigo-600',
  rose: 'bg-rose-500',
};

const ProgressBar = ({ label, value = 0, max = 100, color = 'blue', suffix = '%' }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  const pct = Math.min(100, Math.round((animated / max) * 100));

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-800">
          {Math.round(animated)}
          {suffix}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full progress-fill ${COLORS[color] || COLORS.blue}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
