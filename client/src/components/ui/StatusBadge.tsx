import React from 'react';
import {
  ApplicationStage,
  PriorityLevel,
  ValidityStatus,
  ComplianceStatus,
  EVCStatus,
} from '@saksham/shared';
import { useLanguage } from '../../context/LanguageContext';

export const StageBadge: React.FC<{ stage: ApplicationStage; className?: string }> = ({
  stage,
  className = '',
}) => {
  const { t } = useLanguage();
  const configs: Record<ApplicationStage, { label: string; bg: string; text: string; border: string; dot: string }> = {
    SUBMITTED: { label: 'Submitted', bg: 'bg-[#FAF9F6]', text: 'text-[#17202B]', border: 'border-[#17202B]', dot: 'bg-[#5B6875]' },
    SCRUTINY: { label: 'Scrutiny Desk', bg: 'bg-[#EAF0F5]', text: 'text-[#142B45]', border: 'border-[#142B45]', dot: 'bg-[#142B45]' },
    RE_SCRUTINY: { label: 'Re-Scrutiny Desk', bg: 'bg-[#FFF7ED]', text: 'text-[#B45309]', border: 'border-[#B45309]', dot: 'bg-[#E98232]' },
    EVC_SCHEDULED: { label: 'EVC Scheduled', bg: 'bg-[#F0FDF4]', text: 'text-[#13603E]', border: 'border-[#18794E]', dot: 'bg-[#18794E]' },
    EVC_COMPLETED: { label: 'EVC Completed', bg: 'bg-[#EAF0F5]', text: 'text-[#142B45]', border: 'border-[#142B45]', dot: 'bg-[#142B45]' },
    SHC_HEARING: { label: 'SHC Hearing', bg: 'bg-[#FAF5FF]', text: 'text-[#6B21A8]', border: 'border-[#6B21A8]', dot: 'bg-[#7E22CE]' },
    SAC_APPEAL: { label: 'SAC Appeal', bg: 'bg-[#EFF6FF]', text: 'text-[#1E40AF]', border: 'border-[#1E40AF]', dot: 'bg-[#2563EB]' },
    APPROVED_CONDITIONAL: { label: 'Conditional Approval', bg: 'bg-[#EBF6F0]', text: 'text-[#13603E]', border: 'border-[#13603E]', dot: 'bg-[#18794E]' },
    APPROVAL_GRANTED: { label: 'Approval Granted', bg: 'bg-[#18794E]', text: 'text-[#FFFFFF]', border: 'border-[#0F4E32]', dot: 'bg-[#FFFFFF]' },
    REJECTED: { label: 'Decision: Rejected', bg: 'bg-[#FDF2F2]', text: 'text-[#C5221F]', border: 'border-[#C5221F]', dot: 'bg-[#C5221F]' },
  };

  const config = configs[stage] || configs.SUBMITTED;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-none mr-1.5 ${config.dot}`}></span>
      {t(config.label)}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel; className?: string }> = ({
  priority,
  className = '',
}) => {
  const { t } = useLanguage();
  const configs: Record<PriorityLevel, { label: string; bg: string; text: string; border: string; dot?: boolean }> = {
    NORMAL: { label: 'Normal Priority', bg: 'bg-[#FAF9F6]', text: 'text-[#5B6875]', border: 'border-[#CBD5E1]' },
    MEDIUM: { label: 'Medium Priority', bg: 'bg-[#EAF0F5]', text: 'text-[#142B45]', border: 'border-[#142B45]' },
    HIGH: { label: 'High Priority', bg: 'bg-[#FFF7ED]', text: 'text-[#B45309]', border: 'border-[#B45309]' },
    CRITICAL_OVERDUE: { label: 'Critical Overdue', bg: 'bg-[#FDF2F2]', text: 'text-[#C5221F]', border: 'border-[#C5221F]', dot: true },
  };

  const config = configs[priority] || configs.NORMAL;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.dot && (
        <span className="w-1.5 h-1.5 rounded-none mr-1.5 bg-[#C5221F] animate-pulse"></span>
      )}
      {t(config.label)}
    </span>
  );
};

export const ValidityBadge: React.FC<{ status: ValidityStatus; days: number }> = ({
  status,
  days,
}) => {
  const { t } = useLanguage();
  switch (status) {
    case 'VALID':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#EBF6F0] text-[#13603E] border border-[#13603E]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#18794E]"></span>
          {t('Valid')} ({days > 0 ? `${days}d` : t('Current')})
        </span>
      );
    case 'EXPIRING_SOON':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#FFF7ED] text-[#B45309] border border-[#B45309]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#E98232]"></span>
          {t('Expiring in')} {days}d
        </span>
      );
    case 'CRITICAL_WARNING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-[#FFF1F2] text-[#BE123C] border border-[#BE123C]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#BE123C]"></span>
          {t('Urgent')} ({days}d {t('left')})
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-[#FDF2F2] text-[#C5221F] border border-[#C5221F]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#C5221F]"></span>
          {t('Expired')} ({Math.abs(days)}d {t('ago')})
        </span>
      );
    default:
      return null;
  }
};

export const ComplianceBadge: React.FC<{ status: ComplianceStatus; daysRemaining: number }> = ({
  status,
  daysRemaining,
}) => {
  const { t } = useLanguage();
  switch (status) {
    case 'VERIFIED_SATISFACTORY':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#EBF6F0] text-[#13603E] border border-[#13603E]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#18794E]"></span>
          {t('Verified Satisfactory')}
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#EAF0F5] text-[#142B45] border border-[#142B45]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#142B45]"></span>
          {t('Under Review')}
        </span>
      );
    case 'OVERDUE_ESCALATED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-[#FDF2F2] text-[#C5221F] border border-[#C5221F]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#C5221F] animate-pulse"></span>
          {t('Overdue')} ({Math.abs(daysRemaining)}d)
        </span>
      );
    case 'ACTIVE_PENDING':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#FAF9F6] text-[#17202B] border border-[#17202B]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#5B6875]"></span>
          {t('Due in')} {daysRemaining}d
        </span>
      );
  }
};

export const EVCBadge: React.FC<{ status: EVCStatus; delayHours?: number }> = ({
  status,
  delayHours = 0,
}) => {
  const { t } = useLanguage();
  switch (status) {
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#EAF0F5] text-[#142B45] border border-[#142B45]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#142B45]"></span>
          {t('Visit Scheduled')}
        </span>
      );
    case 'CONSTITUTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#FAF9F6] text-[#17202B] border border-[#17202B]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#5B6875]"></span>
          {t('Committee Constituted')}
        </span>
      );
    case 'VISIT_COMPLETED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#FFF7ED] text-[#B45309] border border-[#B45309]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#E98232]"></span>
          {t('Visit Done (Report Awaited)')}
        </span>
      );
    case 'REPORT_SUBMITTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#EBF6F0] text-[#13603E] border border-[#13603E]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#18794E]"></span>
          {t('Report Uploaded')}
        </span>
      );
    case 'REPORT_OVERDUE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-[#FDF2F2] text-[#C5221F] border border-[#C5221F]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#C5221F] animate-pulse"></span>
          {t('Report Overdue')} (+{delayHours}h)
        </span>
      );
    case 'PENDING_CONSTITUTION':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-[#FAF9F6] text-[#5B6875] border border-[#CBD5E1]">
          <span className="w-1.5 h-1.5 mr-1.5 bg-[#CBD5E1]"></span>
          {t('Constitution Pending')}
        </span>
      );
  }
};
