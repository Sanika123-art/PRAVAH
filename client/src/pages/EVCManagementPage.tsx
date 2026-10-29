import React, { useState, useEffect, useCallback } from 'react';
import { EVCInspection } from '@saksham/shared';
import { fetchEVCInspections } from '../services/evcService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { EVCBadge } from '../components/ui/StatusBadge';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Send,
} from 'lucide-react';

export const EVCManagementPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [inspections, setInspections] = useState<EVCInspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadEVCData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEVCInspections();
      setInspections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load EVC inspections from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEVCData();
  }, [loadEVCData]);

  const filteredInspections = inspections.filter((i) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OVERDUE') return i.isOverdue || i.status === 'REPORT_OVERDUE';
    return i.status === filterStatus;
  });

  const handleEscalationNotice = (inspection: EVCInspection) => {
    setActionNotice(
      `Notice: Formal 48-Hour SLA Breach Notice dispatch for ${inspection.applicationNumber} (Convener: ${inspection.convenerName}) is staged for Phase 3. No mutation committed.`
    );
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleActionClick = (actionDescription: string) => {
    setActionNotice(`Notice: "${actionDescription}" is reserved for Phase 3 workflow engine.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {actionNotice && (
        <div className="p-3.5 bg-amber-50 border-2 border-amber-700 rounded-sm text-amber-950 text-xs flex items-center justify-between shadow-[2px_2px_0px_#b45309]">
          <span className="font-mono font-bold">{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold underline ml-3 font-mono">Dismiss</button>
        </div>
      )}

      {/* Statutory EVC Regulation Banner */}
      <div className="bg-[#142B45] text-white p-4 rounded-sm shadow-[2px_2px_0px_#17202B] border-2 border-[#17202B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-[#E98232] uppercase tracking-wide">
              Statutory EVC Reporting SLA (APH Sec 1.5.4):
            </span>
            <span className="font-mono text-slate-300">Strict 48-Hour Rule</span>
          </div>
          <p className="text-slate-200 mt-1 font-mono leading-relaxed max-w-4xl">
            Expert Visit Committee (EVC) conveners are statutorily required to upload signed observation reports, geo-tagged physical verification photography, and laboratory readiness metrics within 48 hours of physical inspection.
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-[#FAF9F6] text-[#142B45] border-2 border-[#17202B] rounded-sm font-mono font-black text-xs whitespace-nowrap shadow-[1px_1px_0px_#17202B]">
          MAX TURNAROUND: 48H
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#17202B] pb-3">
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
              filterStatus === 'ALL'
                ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
                : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
            }`}
          >
            All Inspections ({inspections.length})
          </button>
          <button
            onClick={() => setFilterStatus('SCHEDULED')}
            className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
              filterStatus === 'SCHEDULED'
                ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
                : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilterStatus('OVERDUE')}
            className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
              filterStatus === 'OVERDUE'
                ? 'bg-rose-700 text-white border-[#17202B] shadow-[2px_2px_0px_#b91c1c]'
                : 'bg-rose-50 text-rose-900 border-rose-700 hover:bg-rose-100'
            }`}
          >
            Report Overdue (Action Required)
          </button>
          <button
            onClick={() => setFilterStatus('REPORT_SUBMITTED')}
            className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
              filterStatus === 'REPORT_SUBMITTED'
                ? 'bg-[#18794E] text-white border-[#17202B] shadow-[2px_2px_0px_#18794E]'
                : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
            }`}
          >
            Reports Completed
          </button>
        </div>

        <button
          onClick={() => handleActionClick('Constitute New EVC Committee')}
          className="gov-btn-saffron py-1.5 px-3.5 text-xs font-black shadow-[2px_2px_0px_#17202B] self-start sm:self-auto"
        >
          + Constitute New EVC
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live EVC records from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEVCData} />
      ) : filteredInspections.length === 0 ? (
        <EmptyState
          title="No Inspections Found"
          message="No EVC inspection records match the current filter selection."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInspections.map((inspection) => (
            <div
              key={inspection.id}
              className={`bg-white rounded-sm border-2 p-5 shadow-[2px_2px_0px_#17202B] space-y-3 transition ${
                inspection.isOverdue ? 'border-rose-700 bg-rose-50/20' : 'border-[#17202B]'
              }`}
            >
              {/* Header: App No & Status */}
              <div className="flex items-start justify-between border-b border-slate-300 pb-2">
                <div>
                  <span className="font-mono text-xs font-black text-[#142B45]">
                    {inspection.applicationNumber}
                  </span>
                  <h3 className="text-sm font-black text-[#17202B] uppercase tracking-wide mt-0.5">
                    {inspection.instituteName}
                  </h3>
                  <p className="text-xs text-[#5B6875] font-mono">Jurisdiction: {inspection.region}</p>
                </div>
                <EVCBadge status={inspection.status} delayHours={inspection.delayHours} />
              </div>

              {/* Visit Dates & Overdue Banner */}
              <div className="bg-[#FAF9F6] p-3 rounded-sm border-2 border-[#17202B] text-xs space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6875] flex items-center gap-1 font-bold">
                    <Calendar className="w-3.5 h-3.5" /> PROPOSED DATE:
                  </span>
                  <span className="font-black text-[#17202B]">
                    {new Date(inspection.proposedDate).toLocaleDateString()}
                  </span>
                </div>
                {inspection.actualVisitDate && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-300">
                    <span className="text-[#18794E] flex items-center gap-1 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> PHYSICAL VISIT CONCLUDED:
                    </span>
                    <span className="font-black text-[#17202B]">
                      {new Date(inspection.actualVisitDate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Committee Composition */}
              <div className="space-y-1.5 text-xs">
                <p className="font-black text-[#142B45] text-[10px] font-mono uppercase tracking-wider">
                  Committee Convener & Technical Experts
                </p>
                <div className="bg-[#FAF9F6] p-3 rounded-sm border-2 border-[#17202B] space-y-1.5 text-[#17202B] font-mono text-xs">
                  <div className="font-bold flex items-center justify-between">
                    <span>Convener: {inspection.convenerName}</span>
                    <span className="text-[10px] text-[#5B6875] font-normal">
                      {inspection.convenerAffiliation}
                    </span>
                  </div>
                  {inspection.expertMembers?.map((member, idx) => (
                    <div key={idx} className="text-[11px] text-[#5B6875] flex items-center justify-between pt-1 border-t border-slate-300">
                      <span>{member.name} ({member.specialization})</span>
                      <span className="text-slate-500 font-bold">{member.designation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overdue Alert Bar */}
              {inspection.isOverdue && (
                <div className="p-3 bg-rose-50 border-2 border-rose-700 rounded-sm text-xs text-rose-950 space-y-1 shadow-[1px_1px_0px_#b91c1c]">
                  <div className="flex items-center justify-between font-black uppercase">
                    <span className="flex items-center gap-1 text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5" /> Report Overdue by {inspection.delayHours} Hours
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-rose-200 border border-rose-400 text-rose-950 font-mono">
                      Level 2 Escalation
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-900 font-mono">
                    Statutory 48h deadline lapsed. AICTE Regional Director notified.
                  </p>
                </div>
              )}

              {/* Card Actions */}
              <div className="pt-2 border-t-2 border-[#17202B] flex items-center justify-between">
                {inspection.isOverdue ? (
                  <button
                    onClick={() => handleEscalationNotice(inspection)}
                    className="gov-btn-destructive py-1.5 px-3 text-xs font-bold flex items-center gap-1"
                  >
                    <Send className="w-3 h-3 mr-1" /> Issue Escalation Notice
                  </button>
                ) : (
                  <button
                    onClick={() => handleActionClick(`View inspection docket for ${inspection.applicationNumber}`)}
                    className="gov-btn-secondary py-1.5 px-3 text-xs font-bold"
                  >
                    View Committee Docket
                  </button>
                )}
                {inspection.reportUploadedDate && (
                  <span className="text-xs text-[#18794E] font-black uppercase font-mono flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Report Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
