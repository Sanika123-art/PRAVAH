import React, { useState, useEffect, useCallback } from 'react';
import { ComplianceItem } from '@saksham/shared';
import { fetchComplianceItems } from '../services/complianceService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { ComplianceBadge } from '../components/ui/StatusBadge';
import {
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadComplianceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplianceItems();
      setComplianceItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load compliance undertakings from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  const filteredItems = complianceItems.filter((item) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OVERDUE') return item.isOverdue || item.daysRemaining < 0;
    return item.status === filterStatus;
  });

  const handleReminderDispatch = (item: ComplianceItem) => {
    setNoticeMessage(
      `Notice: Statutory reminder/show-cause for ${item.instituteName} ("${item.undertakingType}") staged for Phase 3 dispatch engine.`
    );
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  const handleActionClick = (actionName: string) => {
    setNoticeMessage(`Notice: "${actionName}" is reserved for Phase 3 document verification module.`);
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
      {/* Policy Banner */}
      <div className="bg-white rounded-sm border-2 border-[#17202B] p-4 shadow-[2px_2px_0px_#17202B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div>
          <h3 className="font-black text-[#142B45] text-sm uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#18794E]" />
            Time-Bound Institutional Undertakings & Conditional Approvals
          </h3>
          <p className="text-[#5B6875] font-mono mt-1 leading-relaxed max-w-4xl">
            Where statutory approvals are granted conditionally subject to legal affidavits (e.g. 90-day Fire Safety NOC renewal, cadre ratio rectification, or registered land mutation), PRAVAH automatically tracks deadlines and triggers statutory show-cause notices.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold">
          <span className="px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-600 rounded-sm uppercase">
            WARNING: 30 DAYS
          </span>
          <span className="px-2.5 py-1 bg-rose-100 text-rose-950 border border-rose-700 rounded-sm uppercase">
            SHOW-CAUSE: 0 DAYS
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b-2 border-[#17202B] pb-2 text-xs">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
            filterStatus === 'ALL'
              ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
              : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
          }`}
        >
          All Undertakings ({complianceItems.length})
        </button>
        <button
          onClick={() => setFilterStatus('ACTIVE_PENDING')}
          className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
            filterStatus === 'ACTIVE_PENDING'
              ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
              : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
          }`}
        >
          Pending ({complianceItems.filter((i) => i.status === 'ACTIVE_PENDING').length})
        </button>
        <button
          onClick={() => setFilterStatus('UNDER_REVIEW')}
          className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
            filterStatus === 'UNDER_REVIEW'
              ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
              : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
          }`}
        >
          Under Review ({complianceItems.filter((i) => i.status === 'UNDER_REVIEW').length})
        </button>
        <button
          onClick={() => setFilterStatus('OVERDUE')}
          className={`px-3 py-1.5 rounded-sm font-mono font-black uppercase border-2 transition ${
            filterStatus === 'OVERDUE'
              ? 'bg-rose-700 text-white border-[#17202B] shadow-[2px_2px_0px_#b91c1c]'
              : 'bg-rose-50 text-rose-900 border-rose-700 hover:bg-rose-100'
          }`}
        >
          Overdue ({complianceItems.filter((i) => i.isOverdue || i.daysRemaining < 0).length})
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live compliance records from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadComplianceData} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No Undertakings Found"
          message="No compliance undertakings match the selected filter status."
        />
      ) : (
        <div className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>App Number & Institute</th>
                  <th>Undertaking Requirement</th>
                  <th>Granted Date</th>
                  <th>Statutory Deadline</th>
                  <th>Days Remaining</th>
                  <th>Compliance Status</th>
                  <th>Escalation Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-mono text-xs font-black text-[#142B45]">
                        {item.applicationNumber}
                      </div>
                      <div className="text-xs font-bold text-[#17202B] truncate max-w-[200px]">
                        {item.instituteName}
                      </div>
                      <div className="text-[10px] text-[#5B6875] font-mono">{item.region} Region</div>
                    </td>
                    <td>
                      <div className="font-bold text-xs text-[#17202B] uppercase">{item.undertakingType}</div>
                      <p className="text-[11px] text-[#5B6875] font-mono line-clamp-2 max-w-[280px] mt-0.5">
                        {item.description}
                      </p>
                      {item.submittedDocumentRef && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#142B45] font-bold mt-1">
                          <FileText className="w-3 h-3" /> Doc: {item.submittedDocumentRef}
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-[#5B6875] font-mono">
                      {new Date(item.grantedDate).toLocaleDateString()}
                    </td>
                    <td className="text-xs font-bold font-mono text-[#17202B]">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`font-mono text-xs font-black ${
                          item.daysRemaining < 0
                            ? 'text-rose-700'
                            : item.daysRemaining <= 15
                            ? 'text-amber-700'
                            : 'text-[#17202B]'
                        }`}
                      >
                        {item.daysRemaining < 0
                          ? `${Math.abs(item.daysRemaining)}D OVERDUE`
                          : `${item.daysRemaining} DAYS`}
                      </span>
                    </td>
                    <td>
                      <ComplianceBadge status={item.status} daysRemaining={item.daysRemaining} />
                    </td>
                    <td>
                      <span
                        className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-sm border ${
                          item.escalationLevel === 'LEVEL_3_HEARING'
                            ? 'bg-rose-100 text-rose-950 border-rose-700'
                            : item.escalationLevel === 'LEVEL_2_SHOW_CAUSE'
                            ? 'bg-amber-100 text-amber-950 border-amber-700'
                            : item.escalationLevel === 'LEVEL_1_WARNING'
                            ? 'bg-[#EAF0F5] text-[#142B45] border-[#142B45]'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {item.escalationLevel.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {item.isOverdue ? (
                        <button
                          onClick={() => handleReminderDispatch(item)}
                          className="gov-btn-destructive py-1 px-2.5 text-xs font-bold flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 mr-1" /> Show Cause
                        </button>
                      ) : item.submittedDocumentRef ? (
                        <button
                          onClick={() => handleActionClick(`Reviewing submitted compliance artifact: ${item.submittedDocumentRef}`)}
                          className="gov-btn-primary py-1 px-2.5 text-xs font-bold"
                        >
                          Verify Upload
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReminderDispatch(item)}
                          className="gov-btn-secondary py-1 px-2.5 text-xs font-bold"
                        >
                          Send Reminder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
