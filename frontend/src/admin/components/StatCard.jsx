import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  color = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose'
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-[#F0EDFF]',
      border: 'border-[#E8E5F0]',
      text: 'text-[#7357D9]',
    },
    emerald: {
      bg: 'bg-[#ECFDF5]',
      border: 'border-[#A7F3D0]',
      text: 'text-[#059669]',
    },
    amber: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-[#FDE68A]',
      text: 'text-[#D97706]',
    },
    rose: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FECACA]',
      text: 'text-[#DC2626]',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm transition-all duration-200 hover:border-[#D6D0E8] hover:shadow-[0_4px_12px_rgba(115,87,217,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#77748B] tracking-wider uppercase">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg ${scheme.bg} border ${scheme.border} flex items-center justify-center ${scheme.text}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline space-x-3">
        <span className="text-2xl font-bold font-mono text-[#29243B] tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trendDirection === 'up'
                ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                : trendDirection === 'down'
                ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                : 'bg-[#F7F7FC] text-[#77748B] border border-[#E8E5F0]'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtext && <p className="mt-2 text-xs text-[#9692A7] truncate">{subtext}</p>}
    </div>
  );
};
