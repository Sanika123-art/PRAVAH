import React from 'react';
import { AlertCircle, RotateCcw, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading live data from PRAVAH PostgreSQL service...',
  className = 'py-16',
}) => {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="p-3 bg-white rounded-sm border-2 border-[#142B45] shadow-[2px_2px_0px_#142B45]">
        <svg className="w-6 h-6 text-[#142B45] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#142B45]">{t(message)}</p>
      <div className="flex items-center gap-1.5 text-[11px] text-[#5B6875] font-mono">
        <FileText className="w-3.5 h-3.5" />
        <span>{t('Querying Express API / PostgreSQL Database')}</span>
      </div>
    </div>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to fetch records from backend API service.',
  onRetry,
  className = 'py-10 px-6',
}) => {
  const { t } = useLanguage();
  return (
    <div className={`bg-[#FDF2F2] border-2 border-[#C5221F] shadow-[3px_3px_0px_#C5221F] rounded-sm text-center space-y-3 ${className}`}>
      <div className="flex justify-center">
        <div className="p-2 bg-white rounded-sm border border-[#C5221F] text-[#C5221F]">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-black text-[#C5221F] uppercase tracking-wider">{t('Database API Query Failed')}</h4>
        <p className="text-xs text-[#17202B] mt-1 max-w-md mx-auto leading-relaxed font-mono">{t(message)}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#C5221F] hover:bg-[#9A1B18] text-white rounded-sm text-xs font-bold shadow-[2px_2px_0px_#17202B] border border-[#17202B] transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('Retry Connection')}</span>
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  message = 'No application files match your specified filter parameters.',
  className = 'py-12 text-center',
}) => {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center space-y-2.5 text-[#5B6875] bg-[#FAF9F6] border-2 border-dashed border-[#CBD5E1] rounded-sm p-8 ${className}`}>
      <div className="p-2.5 bg-white rounded-sm border border-[#17202B] text-[#142B45] shadow-[2px_2px_0px_#17202B]">
        <FileText className="w-6 h-6" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-[#17202B]">{t(title)}</p>
      <p className="text-xs text-[#5B6875] max-w-sm leading-relaxed">{t(message)}</p>
    </div>
  );
};

interface PhaseNoticeProps {
  actionName: string;
}

export const Phase2ActionNotice: React.FC<PhaseNoticeProps> = ({ actionName }) => (
  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm bg-[#FAF9F6] border border-[#17202B] text-[#17202B] text-[10px] font-bold uppercase tracking-wider" title="Phase 2 is database read-only integration. State mutation engine is scheduled for Phase 3.">
    <FileText className="w-3 h-3 text-[#5B6875]" />
    <span>{actionName} (Read-only stage)</span>
  </div>
);
