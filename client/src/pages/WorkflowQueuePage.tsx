import React, { useState, useEffect, useCallback } from 'react';
import { Application } from '@saksham/shared';
import { fetchApplications } from '../services/applicationService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { StageBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { ApplicationDetailDrawer } from '../components/ui/ApplicationDetailDrawer';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { ScrutinyEvaluationModal } from '../components/features/ScrutinyEvaluationModal';

export const WorkflowQueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SCRUTINY' | 'RE_SCRUTINY' | 'EVC_TRANSITIONS'>('SCRUTINY');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [evaluatingApplication, setEvaluatingApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadQueueData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApplications({ limit: 100 });
      setApplications(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow queues from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  const scrutinyCount = applications.filter((a) => a.currentStage === 'SUBMITTED' || a.currentStage === 'SCRUTINY').length;
  const reScrutinyCount = applications.filter((a) => a.currentStage === 'RE_SCRUTINY').length;
  const evcTransitionsCount = applications.filter(
    (a) => a.currentStage === 'EVC_SCHEDULED' || a.currentStage === 'EVC_COMPLETED'
  ).length;

  const queueApplications = applications.filter((app) => {
    if (activeTab === 'SCRUTINY') return app.currentStage === 'SUBMITTED' || app.currentStage === 'SCRUTINY';
    if (activeTab === 'RE_SCRUTINY') return app.currentStage === 'RE_SCRUTINY';
    if (activeTab === 'EVC_TRANSITIONS')
      return app.currentStage === 'EVC_SCHEDULED' || app.currentStage === 'EVC_COMPLETED';
    return true;
  });

  const handleActionClick = (actionName: string, appNumber: string) => {
    setNoticeMessage(`Notice: Action "${actionName}" for ${appNumber} is staged for Phase 3 mutation engine. No mock mutation executed.`);
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {noticeMessage && (
        <div className="p-3.5 bg-amber-50 border-2 border-amber-700 rounded-sm text-amber-950 text-xs flex items-center justify-between shadow-[2px_2px_0px_#b45309]">
          <span className="font-mono font-bold">{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="font-bold underline ml-3 font-mono">Dismiss</button>
        </div>
      )}

      {/* SLA Policy Advisory */}
      <div className="bg-[#142B45] text-white rounded-sm p-5 shadow-[2px_2px_0px_#17202B] border-2 border-[#17202B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[#E98232] font-black text-sm uppercase tracking-wide">
            <Clock className="w-4 h-4 text-[#E98232]" />
            <span>AICTE Statutory Scrutiny SLA: Strict 7 Business Days Turnaround</span>
          </div>
          <p className="text-slate-200 text-xs leading-relaxed max-w-4xl font-mono">
            Per the AICTE Approval Process Handbook (APH 2024–27 Chapter I & II), applications assigned to Scrutiny Committee experts must complete preliminary document verification within 7 days. Files with unresolved deficiencies are automatically flagged for Re-Scrutiny or Hearing (SHC).
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-[#FAF9F6] text-[#142B45] border-2 border-[#17202B] rounded-sm font-mono font-black text-xs whitespace-nowrap shadow-[1px_1px_0px_#17202B]">
          SLA LIMIT: 7 DAYS
        </div>
      </div>

      {/* Queue Tabs with Official Government Neo-Brutalist Styling */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#17202B] pb-2">
        <button
          onClick={() => setActiveTab('SCRUTINY')}
          className={`px-4 py-2 text-xs font-mono font-black uppercase rounded-sm border-2 transition flex items-center space-x-2 ${
            activeTab === 'SCRUTINY'
              ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
              : 'bg-white text-[#17202B] border-[#17202B] hover:bg-[#FAF9F6]'
          }`}
        >
          <span>Primary Scrutiny Queue</span>
          <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono ${
            activeTab === 'SCRUTINY' ? 'bg-[#E98232] text-white border-white' : 'bg-[#EAF0F5] text-[#142B45] border-[#17202B]'
          }`}>
            {scrutinyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RE_SCRUTINY')}
          className={`px-4 py-2 text-xs font-mono font-black uppercase rounded-sm border-2 transition flex items-center space-x-2 ${
            activeTab === 'RE_SCRUTINY'
              ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
              : 'bg-white text-[#17202B] border-[#17202B] hover:bg-[#FAF9F6]'
          }`}
        >
          <span>Re-Scrutiny (Rectifications)</span>
          <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono ${
            activeTab === 'RE_SCRUTINY' ? 'bg-[#E98232] text-white border-white' : 'bg-amber-100 text-amber-950 border-amber-600'
          }`}>
            {reScrutinyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('EVC_TRANSITIONS')}
          className={`px-4 py-2 text-xs font-mono font-black uppercase rounded-sm border-2 transition flex items-center space-x-2 ${
            activeTab === 'EVC_TRANSITIONS'
              ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
              : 'bg-white text-[#17202B] border-[#17202B] hover:bg-[#FAF9F6]'
          }`}
        >
          <span>EVC Committee Transitions</span>
          <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono ${
            activeTab === 'EVC_TRANSITIONS' ? 'bg-[#E98232] text-white border-white' : 'bg-cyan-100 text-cyan-950 border-cyan-600'
          }`}>
            {evcTransitionsCount}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live applications from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadQueueData} />
      ) : (
        <div className="space-y-4">
          {queueApplications.length > 0 ? (
            queueApplications.map((app) => {
              const isOverdue = app.stageAgeingDays > 7;
              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-sm border-2 p-5 shadow-[2px_2px_0px_#17202B] transition ${
                    isOverdue ? 'border-rose-700 bg-rose-50/30' : 'border-[#17202B]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Application Identification & Institute Details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-[#142B45] bg-[#EAF0F5] px-2.5 py-1 rounded-sm border border-[#17202B]">
                          {app.applicationNumber}
                        </span>
                        <span className="text-slate-400">|</span>
                        <StageBadge stage={app.currentStage} />
                        <PriorityBadge priority={app.priority} />
                        {isOverdue && (
                          <span className="px-2.5 py-0.5 rounded-sm border border-rose-800 text-[10px] font-mono font-black bg-rose-700 text-white uppercase">
                            SLA BREACHED ({app.stageAgeingDays}D)
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-[#17202B] uppercase tracking-wide">{app.instituteName}</h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5B6875] font-mono">
                        <span><strong>Trust:</strong> {app.trustName}</span>
                        <span>•</span>
                        <span><strong>Category:</strong> {app.category.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span><strong>Region:</strong> {app.region} ({app.state})</span>
                        <span>•</span>
                        <span><strong>Land:</strong> {app.landAreaAcres} Acres</span>
                      </div>
                    </div>

                    {/* Middle: Ageing & Officer Assignment */}
                    <div className="flex items-center space-x-6 text-xs bg-[#FAF9F6] p-3 rounded-sm border-2 border-[#17202B] flex-shrink-0 font-mono">
                      <div>
                        <span className="text-[#5B6875] block text-[10px] uppercase font-bold">Assigned Officer</span>
                        <span className="font-bold text-[#142B45]">{app.assignedOfficer}</span>
                      </div>
                      <div>
                        <span className="text-[#5B6875] block text-[10px] uppercase font-bold">Desk Ageing</span>
                        <span className={`font-mono text-sm font-black ${isOverdue ? 'text-rose-700' : 'text-[#17202B]'}`}>
                          {app.stageAgeingDays} DAYS
                        </span>
                        <span className="text-[10px] text-slate-400 block">Total: {app.totalAgeingDays}d</span>
                      </div>
                    </div>

                    {/* Right: Operational Triggers */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="gov-btn-secondary py-2 px-3.5 text-xs font-bold"
                      >
                        Inspect Docket
                      </button>
                      {(app.currentStage === 'SUBMITTED' || app.currentStage === 'SCRUTINY') && (
                        <button
                          onClick={() => setEvaluatingApplication(app)}
                          className="gov-btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                        >
                          <FileCheck className="w-4 h-4 text-[#E98232]" />
                          <span>{app.currentStage === 'SUBMITTED' ? 'Start Scrutiny' : 'Open Scrutiny'}</span>
                        </button>
                      )}
                      {app.currentStage === 'RE_SCRUTINY' && (
                        <button
                          onClick={() => setEvaluatingApplication(app)}
                          className="gov-btn-saffron py-2 px-4 text-xs font-black shadow-[2px_2px_0px_#17202B] flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Verify Rectifications</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Deficiency Notice Bar if Flagged */}
                  {app.isDeficient && (
                    <div className="mt-3.5 pt-3 border-t-2 border-[#17202B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-rose-50 p-3 rounded-sm border-2 border-rose-700 shadow-[1px_1px_0px_#b91c1c]">
                      <div className="flex items-center space-x-2 text-rose-950 font-bold font-mono">
                        <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                        <span>{app.deficiencyCount} deficiency item(s) recorded under faculty cadre / municipal NOC. Rectification window active under APH norms.</span>
                      </div>
                      <button
                        onClick={() => handleActionClick('Forward to SHC Bench', app.applicationNumber)}
                        className="font-bold text-rose-900 hover:underline flex items-center gap-1 whitespace-nowrap self-start sm:self-auto font-mono uppercase"
                      >
                        Forward to Hearing (SHC) &rarr;
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No Queue Applications"
              message="No application files currently match the selected workflow queue."
            />
          )}
        </div>
      )}

      {/* Flyout Drawer */}
      <ApplicationDetailDrawer
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />

      {/* Interactive Scrutiny Checklist Evaluation Modal */}
      <ScrutinyEvaluationModal
        application={evaluatingApplication}
        onClose={() => setEvaluatingApplication(null)}
        onDecisionSaved={loadQueueData}
      />
    </div>
  );
};
