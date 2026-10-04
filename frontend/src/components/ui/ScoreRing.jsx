import React, { useEffect, useState } from 'react';

const colorFor = (score) => {
  if (score >= 80) return { ring: '#059669', bg: '#d1fae5', text: 'text-emerald-700' };
  if (score >= 60) return { ring: '#d97706', bg: '#fef3c7', text: 'text-amber-700' };
  return { ring: '#e11d48', bg: '#ffe4e6', text: 'text-rose-700' };
};

const ScoreRing = ({ score = 0, size = 120, strokeWidth = 10, label }) => {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const { ring, bg, text } = colorFor(score);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bg} strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ring}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring-fg"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold ${text}`}>{Math.round(animated)}%</span>
          {label && <span className="text-[11px] font-medium text-slate-500 mt-0.5">{label}</span>}
        </div>
      </div>
    </div>
  );
};

export default ScoreRing;
