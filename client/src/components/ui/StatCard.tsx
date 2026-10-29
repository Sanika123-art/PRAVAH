import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeVariant?: 'default' | 'amber' | 'emerald' | 'rose' | 'navy';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeVariant = 'default',
  onClick,
}) => {
  const badgeClasses = {
    default: 'bg-[#FAF9F6] text-[#17202B] border-[#17202B]',
    amber: 'bg-[#FFF7ED] text-[#B45309] border-[#B45309] font-bold',
    emerald: 'bg-[#EBF6F0] text-[#13603E] border-[#13603E] font-bold',
    rose: 'bg-[#FDF2F2] text-[#C5221F] border-[#C5221F] font-bold',
    navy: 'bg-[#EAF0F5] text-[#142B45] border-[#142B45] font-bold',
  }[badgeVariant];

  const clickableClasses = onClick
    ? 'cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#17202B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#17202B] transition-all duration-100'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-sm border-2 border-[#17202B] p-4 shadow-[2px_2px_0px_#17202B] ${clickableClasses} relative`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6875]">{title}</p>
          <p className="text-2xl font-black text-[#17202B] tracking-tight font-mono">{value}</p>
        </div>
        <div className="p-2 rounded-sm bg-[#EAF0F5] border border-[#17202B] text-[#142B45] flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtext || badgeText) && (
        <div className="mt-3 pt-2.5 border-t border-[#CBD5E1] flex items-center justify-between text-xs gap-2">
          {subtext && <span className="text-[#5B6875] text-[11px] font-medium truncate">{subtext}</span>}
          {badgeText && (
            <span className={`px-1.5 py-0.5 rounded-sm text-[10px] uppercase tracking-wide border ${badgeClasses} whitespace-nowrap`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
