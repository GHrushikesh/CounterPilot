import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-lg active:scale-[0.97] transition-all shadow-2xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
