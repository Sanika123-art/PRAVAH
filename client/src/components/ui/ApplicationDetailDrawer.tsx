import React, { useState, useEffect } from 'react';
import { Application, DeficiencyNotice, ApplicationDocument } from '@saksham/shared';
import { StageBadge, PriorityBadge } from './StatusBadge';
import { apiGet, apiPost } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Building2,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Download,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface ApplicationDetailDrawerProps {
  application: Application | null;
  onClose: () => void;
  onReviewScrutiny?: (application: Application) => void;
}

export const ApplicationDetailDrawer: React.FC<ApplicationDetailDrawerProps> = ({
  application,
  onClose,
  onReviewScrutiny,
}) => {
  const { currentUser } = useAuth();

  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [deficiencyNotices, setDeficiencyNotices] = useState<DeficiencyNotice[]>([]);
  const [isDraftingDeficiency, setIsDraftingDeficiency] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParam, setNewParam] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (application?.id) {
      apiGet<{ success: boolean; data: any }>(`/applications/${application.id}`)
        .then((res) => {
          if (res.data) {
            setDocuments(res.data.documents || []);
            setDeficiencyNotices(res.data.deficiencyNotices || []);
          }
        })
        .catch(() => {});
    }
  }, [application?.id]);

  if (!application) return null;

  const canManageDeficiencies =
    currentUser?.role === 'SCRUTINY_OFFICER' ||
    currentUser?.role === 'REGIONAL_OFFICER' ||
    currentUser?.role === 'SYSTEM_ADMIN';

  const handleCreateDeficiency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      const res = await apiPost<{ success: boolean; data: DeficiencyNotice }>(
        `/applications/${application.id}/deficiencies`,
        {
          title: newTitle.trim(),
          parameterName: newParam.trim() || 'General Scrutiny Compliance',
          description: newDesc.trim(),
        }
      );

      setDeficiencyNotices((prev) => [res.data, ...prev]);
      setIsDraftingDeficiency(false);
      setNewTitle('');
      setNewParam('');
      setNewDesc('');
      setActionSuccess('Draft deficiency notice recorded in regulatory register.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create deficiency notice.');
    }
  };

  const handleReleaseNotice = async (noticeId: string) => {
    try {
      const res = await apiPost<{ success: boolean; data: DeficiencyNotice }>(
        `/applications/${application.id}/deficiencies/${noticeId}/release`,
        {}
      );

      setDeficiencyNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? res.data : n))
      );
      setActionSuccess('Deficiency notice formally released to institution.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to release deficiency notice.');
    }
  };

  const handleReviewNotice = async (noticeId: string, status: 'RESOLVED_SATISFIED' | 'REJECTED_UNSATISFACTORY') => {
    const reviewNotes = prompt(
      status === 'RESOLVED_SATISFIED'
        ? 'Enter officer verification remarks confirming satisfaction:'
        : 'Enter rejection notes explaining why clarification is inadequate:'
    );

    if (!reviewNotes) return;

    try {
      const res = await apiPost<{ success: boolean; data: DeficiencyNotice }>(
        `/applications/${application.id}/deficiencies/${noticeId}/review`,
        { status, reviewNotes }
      );

      setDeficiencyNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? res.data : n))
      );
      setActionSuccess(`Finding marked ${status === 'RESOLVED_SATISFIED' ? 'Resolved' : 'Rejected'}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate deficiency response.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 flex justify-end"
    >
      <div className="w-full max-w-xl bg-white h-full shadow-[-4px_0px_0px_#17202B] flex flex-col border-l-2 border-[#17202B]">
        {/* Drawer Header */}
        <div className="bg-[#142B45] text-white p-5 flex items-start justify-between border-b-2 border-[#17202B]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-mono font-bold text-[#E98232]">
                APPLICATION DOSSIER
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="font-mono text-xs font-bold text-white bg-[#0A1B38] px-1.5 py-0.5 rounded-sm border border-[#3E556E]">
                {application.applicationNumber}
              </span>
            </div>
            <h2 id="drawer-title" className="text-lg font-black text-white mt-1 leading-snug">
              {application.instituteName}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              PID: <span className="font-mono font-bold text-[#E98232]">{application.permanentInstituteId}</span> • Trust: {application.trustName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white border-2 border-white/40 p-1.5 rounded-sm hover:bg-[#0A1B38] hover:border-white transition"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm bg-[#FAF9F6]">
          {actionSuccess && (
            <div className="p-3 bg-[#EBF6F0] border-2 border-[#18794E] text-[#13603E] rounded-sm text-xs font-bold flex items-center space-x-2 shadow-[2px_2px_0px_#18794E]">
              <CheckCircle2 className="w-4 h-4 text-[#18794E] flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Status & Priority Ribbon */}
          <div className="bg-white border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-black text-[#5B6875] block uppercase tracking-wider mb-1">
                Approval Stage
              </span>
              <StageBadge stage={application.currentStage} className="text-xs" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#5B6875] block uppercase tracking-wider mb-1">
                Pendency Priority
              </span>
              <PriorityBadge priority={application.priority} className="text-xs" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#5B6875] block uppercase tracking-wider mb-1">
                Stage Ageing
              </span>
              <span className="font-black text-[#17202B] font-mono text-sm">
                {application.stageAgeingDays} Days
              </span>
              <span className="text-[11px] text-[#5B6875] ml-1 font-mono">({application.totalAgeingDays} total)</span>
            </div>
          </div>

          {/* Institutional Demographics */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#142B45] uppercase tracking-wider border-b-2 border-[#17202B] pb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#142B45]" /> Statutory Classification
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-sm border border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="text-[10px] font-bold text-[#5B6875] uppercase block">Approval Category:</span>
                <span className="font-bold text-[#17202B]">{application.category.replace(/_/g, ' ')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-sm border border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="text-[10px] font-bold text-[#5B6875] uppercase block">Institution Sector:</span>
                <span className="font-bold text-[#17202B]">{application.institutionType.replace(/_/g, ' ')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-sm border border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="text-[10px] font-bold text-[#5B6875] uppercase block">Regional Jurisdiction:</span>
                <span className="font-bold text-[#17202B]">{application.region.replace(/_/g, ' ')} ({application.state})</span>
              </div>
              <div className="bg-white p-2.5 rounded-sm border border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="text-[10px] font-bold text-[#5B6875] uppercase block">Campus Land:</span>
                <span className="font-black text-[#17202B] font-mono">{application.landAreaAcres} Acres</span>
              </div>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#142B45] uppercase tracking-wider border-b-2 border-[#17202B] pb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#142B45]" /> Uploaded Statutory Documents ({documents.length})
            </h4>
            {documents.length === 0 ? (
              <p className="text-xs text-[#5B6875] italic">No documents uploaded for this application record.</p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-white border border-[#17202B] rounded-sm shadow-[1px_1px_0px_#17202B] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#17202B]">{doc.title}</div>
                      <div className="text-[10px] text-[#5B6875] font-mono mt-0.5">
                        {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={`/api/institution/applications/${application.id}/documents/${doc.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-sm bg-[#EAF0F5] border border-[#17202B] text-[#142B45] hover:bg-[#142B45] hover:text-white flex items-center space-x-1 font-bold text-[10px] uppercase tracking-wider transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>Inspect</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deficiencies Section with Drafting & Review */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-[#17202B] pb-1">
              <h4 className="text-xs font-black text-[#142B45] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" /> Deficiency Notices ({deficiencyNotices.length})
              </h4>
              {canManageDeficiencies && (
                <button
                  type="button"
                  onClick={() => setIsDraftingDeficiency(!isDraftingDeficiency)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-[#B45309] hover:underline uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft Notice</span>
                </button>
              )}
            </div>

            {/* Draft Deficiency Form */}
            {isDraftingDeficiency && (
              <form onSubmit={handleCreateDeficiency} className="p-3 bg-[#FFF7ED] border-2 border-[#B45309] rounded-sm space-y-2.5 text-xs shadow-[2px_2px_0px_#B45309]">
                <div className="font-black text-[#B45309] uppercase tracking-wider text-[11px]">Draft Scrutiny Deficiency Notice</div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#17202B] mb-0.5">Notice Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Land Title Lease Period Discrepancy"
                    className="w-full px-2 py-1.5 bg-white border border-[#17202B] rounded-sm text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#17202B] mb-0.5">Norm Parameter *</label>
                  <input
                    type="text"
                    value={newParam}
                    onChange={(e) => setNewParam(e.target.value)}
                    placeholder="e.g. Land Area / APH Clause 1.4"
                    className="w-full px-2 py-1.5 bg-white border border-[#17202B] rounded-sm text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#17202B] mb-0.5">Committee Deficiency Finding *</label>
                  <textarea
                    rows={2}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Specify the regulatory deficiency observed during scrutiny..."
                    className="w-full p-2 bg-white border border-[#17202B] rounded-sm text-xs font-medium"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDraftingDeficiency(false)}
                    className="px-2.5 py-1 rounded-sm border border-[#17202B] bg-white text-[#17202B] text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-sm bg-[#142B45] text-white border border-[#17202B] font-bold text-xs uppercase shadow-[1px_1px_0px_#17202B]"
                  >
                    Save Internal Draft
                  </button>
                </div>
              </form>
            )}

            {deficiencyNotices.length === 0 ? (
              <div className="p-3 bg-white border border-[#17202B] rounded-sm text-xs text-[#18794E] font-bold flex items-center space-x-2 shadow-[1px_1px_0px_#17202B]">
                <ShieldCheck className="w-4 h-4 text-[#18794E] flex-shrink-0" />
                <span>Zero deficiencies active on this application file.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {deficiencyNotices.map((n) => (
                  <div key={n.id} className="p-3 bg-white border-2 border-[#17202B] rounded-sm space-y-2 text-xs shadow-[2px_2px_0px_#17202B]">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-[#142B45] bg-[#EAF0F5] px-1 py-0.2 border border-[#CBD5E1] text-[10px]">{n.noticeNumber}</span>
                          <span className="font-black text-[#17202B]">{n.title}</span>
                        </div>
                        <p className="text-[#5B6875] mt-1 leading-relaxed">{n.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {n.isReleased ? (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#EAF0F5] text-[#142B45] border border-[#142B45]">
                            Released
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[#FFF7ED] text-[#B45309] border border-[#B45309]">
                            Internal Draft
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Institution Response View */}
                    {n.institutionResponse && (
                      <div className="p-2.5 bg-[#EAF0F5] border border-[#142B45] rounded-sm text-xs text-[#142B45]">
                        <span className="font-black uppercase text-[10px] tracking-wide block">Institution Clarification Response:</span>
                        <p className="mt-0.5 leading-relaxed">{n.institutionResponse}</p>
                        {n.responseDocumentRef && (
                          <div className="text-[10px] text-[#5B6875] mt-1 font-mono">
                            Ref: <strong>{n.responseDocumentRef}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Officer Review Notes */}
                    {n.officerReviewNotes && (
                      <div className="p-2.5 bg-[#EBF6F0] border border-[#18794E] rounded-sm text-xs text-[#13603E]">
                        <span className="font-black uppercase text-[10px] tracking-wide block">Review Evaluation:</span>
                        <p className="mt-0.5">{n.officerReviewNotes}</p>
                      </div>
                    )}

                    {/* Officer Actions */}
                    {canManageDeficiencies && (
                      <div className="flex justify-end space-x-2 pt-1 border-t border-[#CBD5E1]">
                        {!n.isReleased && (
                          <button
                            type="button"
                            onClick={() => handleReleaseNotice(n.id)}
                            className="px-2.5 py-1 rounded-sm bg-[#E98232] hover:bg-[#D16E20] text-white font-bold text-[10px] uppercase tracking-wider border border-[#17202B] shadow-[1px_1px_0px_#17202B]"
                          >
                            Release Notice to Institution
                          </button>
                        )}

                        {n.isReleased && n.status === 'AWAITING_OFFICER_REVIEW' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviewNotice(n.id, 'RESOLVED_SATISFIED')}
                              className="px-2.5 py-1 rounded-sm bg-[#18794E] hover:bg-[#13603E] text-white font-bold text-[10px] uppercase tracking-wider border border-[#17202B] shadow-[1px_1px_0px_#17202B]"
                            >
                              Satisfy & Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewNotice(n.id, 'REJECTED_UNSATISFACTORY')}
                              className="px-2.5 py-1 rounded-sm bg-[#C5221F] hover:bg-[#9A1B18] text-white font-bold text-[10px] uppercase tracking-wider border border-[#17202B] shadow-[1px_1px_0px_#17202B]"
                            >
                              Reject Response
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission and Audit Metadata */}
          <div className="space-y-2 bg-white p-3 rounded-sm border border-[#17202B] text-xs font-mono text-[#5B6875] shadow-[1px_1px_0px_#17202B]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#142B45]" /> SUBMISSION TIMESTAMP:
              </span>
              <span className="font-bold text-[#17202B]">{new Date(application.submissionDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#142B45]" /> LAST REGULATORY UPDATE:
              </span>
              <span className="font-bold text-[#17202B]">{new Date(application.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-white border-t-2 border-[#17202B] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-[#17202B] text-[#17202B] hover:bg-[#FAF9F6] rounded-sm text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#17202B]"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onReviewScrutiny) {
                  onReviewScrutiny(application);
                  onClose();
                }
              }}
              className="px-4 py-2 bg-[#142B45] text-white hover:bg-[#0A1B38] border-2 border-[#17202B] rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#17202B]"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#E98232]" /> Open Scrutiny Evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
