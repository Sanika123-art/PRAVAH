import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getInstitutionApplication,
  respondToDeficiency,
  getCategoryChecklist,
  uploadApplicationDocument,
  resubmitCorrectedApplication,
  ChecklistItemStatus,
} from '../../services/institutionService';
import { Application, DeficiencyNotice, ApplicationDocument, ComplianceItem, DocumentType } from '@saksham/shared';
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Send,
  X,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

const WORKFLOW_STAGES = [
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'SCRUTINY', label: 'Scrutiny Committee' },
  { id: 'RE_SCRUTINY', label: 'Re-Scrutiny' },
  { id: 'EVC_SCHEDULED', label: 'EVC Inspection' },
  { id: 'SHC_HEARING', label: 'Standing Hearing' },
  { id: 'SAC_APPEAL', label: 'Standing Appellate' },
  { id: 'APPROVAL_GRANTED', label: 'Final Council Decision' },
];

export const InstitutionApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<(Application & {
    documents: ApplicationDocument[];
    deficiencyNotices: DeficiencyNotice[];
    complianceItems: ComplianceItem[];
    officerDecisions?: Array<{ id: string; decision: string; officerName: string; remarks: string; previousStage: string; resultingStage: string; createdAt: string }>;
  }) | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeNoticeForResponse, setActiveNoticeForResponse] = useState<DeficiencyNotice | null>(null);
  const [responseText, setResponseText] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccessMsg, setResponseSuccessMsg] = useState<string | null>(null);
  const [correctionChecklist, setCorrectionChecklist] = useState<ChecklistItemStatus[]>([]);
  const [correctionType, setCorrectionType] = useState<DocumentType | ''>('');
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [isUploadingCorrection, setIsUploadingCorrection] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [correctionMessage, setCorrectionMessage] = useState<string | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const fetchApp = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getInstitutionApplication(id);
      setApplication(data);
      if (data.currentStage === 'RE_SCRUTINY' && data.isDeficient) {
        setCorrectionChecklist(await getCategoryChecklist(id));
      } else {
        setCorrectionChecklist([]);
      }
    } catch (err) {
      console.error('Failed to load application details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const handleOpenResponseModal = (notice: DeficiencyNotice) => {
    setActiveNoticeForResponse(notice);
    setResponseText(notice.institutionResponse || '');
    setDocumentRef(notice.responseDocumentRef || '');
    setResponseSuccessMsg(null);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoticeForResponse || !responseText.trim()) return;

    setIsSubmittingResponse(true);
    try {
      await respondToDeficiency(activeNoticeForResponse.id, responseText.trim(), documentRef.trim() || undefined);
      setResponseSuccessMsg('Clarification response submitted successfully to the Scrutiny Committee.');
      await fetchApp();
      setTimeout(() => {
        setActiveNoticeForResponse(null);
        setResponseSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit deficiency response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleCorrectionUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!application || !correctionType || !correctionFile) return;
    setIsUploadingCorrection(true);
    setCorrectionError(null);
    setCorrectionMessage(null);
    try {
      const result = await uploadApplicationDocument(application.id, correctionFile, correctionType);
      setCorrectionMessage(`${result.fileName} uploaded. Automated result: ${result.verificationStatus}. ${result.verificationExplanation || ''}`);
      setCorrectionFile(null);
      setCorrectionType('');
      await fetchApp();
    } catch (err) {
      setCorrectionError(err instanceof Error ? err.message : 'Failed to upload the corrected document.');
    } finally {
      setIsUploadingCorrection(false);
    }
  };

  const handleCorrectionResubmit = async () => {
    if (!application) return;
    setIsResubmitting(true);
    setCorrectionError(null);
    setCorrectionMessage(null);
    try {
      await resubmitCorrectedApplication(application.id);
      setCorrectionMessage('Corrected documents passed server-side revalidation and were returned to officer scrutiny.');
      await fetchApp();
    } catch (err) {
      setCorrectionError(err instanceof Error ? err.message : 'Correction resubmission failed.');
    } finally {
      setIsResubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading application data...</div>;
  }

  if (!application) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-base font-bold text-slate-900">Application not found</h2>
        <Link to="/institution/applications" className="text-xs text-blue-600 underline mt-2 inline-block">
          Return to applications
        </Link>
      </div>
    );
  }

  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === application.currentStage);

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-[#17202B] p-4 rounded-sm shadow-[2px_2px_0px_#17202B]">
        <div>
          <Link
            to="/institution/applications"
            className="inline-flex items-center space-x-1.5 text-xs text-[#5B6875] hover:text-[#17202B] font-mono font-bold uppercase tracking-wider mb-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Applications Register</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-black font-mono text-[#142B45] tracking-wide">
              {application.applicationNumber}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-black uppercase rounded-sm border-2 border-[#17202B] bg-[#EAF0F5] text-[#142B45]">
              {application.isDraft ? 'DRAFT DOSSIER' : application.currentStage.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {application.isDraft && (
          <Link
            to={`/institution/applications/new?draftId=${application.id}`}
            className="gov-btn-saffron py-2 px-4 text-xs font-black shadow-[2px_2px_0px_#17202B]"
          >
            Continue Editing Draft
          </Link>
        )}
      </div>

      {/* Stage Progress Tracker */}
      <div className="bg-white p-5 border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] overflow-x-auto">
        <h2 className="text-xs font-mono font-black text-[#5B6875] uppercase tracking-wider mb-4 border-b-2 border-[#17202B] pb-2">
          Statutory Scrutiny Timeline & Processing State
        </h2>
        <div className="flex items-center justify-between min-w-[760px] gap-2">
          {WORKFLOW_STAGES.map((stg, i) => {
            const isPassed = currentStageIndex > i;
            const isCurrent = currentStageIndex === i || (currentStageIndex === -1 && i === 0);

            return (
              <React.Fragment key={stg.id}>
                <div className={`flex flex-col items-center text-center p-2 rounded-sm border-2 transition min-w-[100px] ${
                  isCurrent
                    ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
                    : isPassed
                    ? 'bg-[#EAF0F5] text-[#17202B] border-[#17202B]'
                    : 'bg-[#FAF9F6] text-[#5B6875] border-slate-300 opacity-60'
                }`}>
                  <div
                    className={`w-7 h-7 rounded-sm border-2 flex items-center justify-center font-mono font-black text-xs mb-1 ${
                      isCurrent
                        ? 'bg-[#E98232] text-white border-white'
                        : isPassed
                        ? 'bg-[#18794E] text-white border-[#17202B]'
                        : 'bg-white text-[#5B6875] border-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-black uppercase tracking-wider leading-tight ${
                      isCurrent ? 'text-white' : 'text-[#17202B]'
                    }`}
                  >
                    {stg.label}
                  </span>
                </div>
                {i < WORKFLOW_STAGES.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 border-t-2 border-dashed ${
                      currentStageIndex > i ? 'border-[#18794E]' : 'border-slate-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5B6875]">Category & Academic Cycle</span>
          <div className="text-sm font-black text-[#17202B] mt-0.5">{application.category.replace(/_/g, ' ')}</div>
          <div className="text-xs text-[#5B6875] font-mono mt-0.5">Cycle: {application.academicCycle || '2026-27'}</div>
        </div>

        <div className="bg-white p-4 rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5B6875]">Approved vs Requested Intake</span>
          <div className="text-sm font-black font-mono text-[#142B45] mt-0.5">{application.requestedIntake} SEATS</div>
          <div className="text-xs text-[#5B6875] font-mono mt-0.5">Campus Land: {application.landAreaAcres} Acres</div>
        </div>

        <div className="bg-white p-4 rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5B6875]">Submission Date & Review Ageing</span>
          <div className="text-sm font-black text-[#17202B] mt-0.5">
            {new Date(application.submissionDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-[#5B6875] font-mono mt-0.5">{application.totalAgeingDays} days in review pipeline</div>
        </div>
      </div>

      {/* Officer Decisions and Remarks (Properly unnested) */}
      {(application.officerDecisions?.length ?? 0) > 0 && (
        <section className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] p-5 space-y-3">
          <div className="border-b-2 border-[#17202B] pb-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-[#142B45]">
              Officer Decisions & Statutory Findings Log
            </h2>
            <p className="text-xs text-[#5B6875]">Recorded evaluations from the Scrutiny and Hearing committees</p>
          </div>
          <div className="space-y-3">
            {application.officerDecisions?.map((decision) => (
              <div key={decision.id} className="rounded-sm border-2 border-[#17202B] bg-[#FAF9F6] p-3 text-xs shadow-[1px_1px_0px_#17202B]">
                <div className="flex flex-wrap justify-between gap-2 font-black">
                  <span className="text-[#142B45] uppercase">{decision.decision.replace(/_/g, ' ')} · RESULTING: {decision.resultingStage.replace(/_/g, ' ')}</span>
                  <span className="text-[#5B6875] font-mono">{new Date(decision.createdAt).toLocaleString()} · Officer: {decision.officerName}</span>
                </div>
                <p className="mt-1.5 text-xs text-[#17202B] whitespace-pre-line leading-relaxed font-mono bg-white p-2 border border-slate-300 rounded-sm">{decision.remarks}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Re-Scrutiny Correction Workflow (Properly unnested) */}
      {application.currentStage === 'RE_SCRUTINY' && application.isDeficient && (
        <section className="bg-amber-50 rounded-sm border-2 border-amber-700 shadow-[2px_2px_0px_#b45309] p-5 space-y-4">
          <div className="border-b-2 border-amber-700 pb-2">
            <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide">
              Correct and Resubmit Application Documents
            </h2>
            <p className="text-xs text-amber-900 mt-0.5">
              New uploads are validated automatically by the server. Resubmission reruns preliminary rules on the latest mandatory documents and preserves earlier scrutiny history.
            </p>
          </div>
          {correctionError && (
            <p role="alert" className="rounded-sm border-2 border-rose-700 bg-white p-2.5 text-xs font-bold text-rose-900 shadow-[1px_1px_0px_#b91c1c]">
              {correctionError}
            </p>
          )}
          {correctionMessage && (
            <p className="rounded-sm border-2 border-[#18794E] bg-white p-2.5 text-xs font-bold text-[#18794E] shadow-[1px_1px_0px_#18794E]">
              {correctionMessage}
            </p>
          )}
          <div className="space-y-2">
            {correctionChecklist.map((item) => (
              <div key={item.documentType} className="rounded-sm border-2 border-amber-700 bg-white p-3 text-xs shadow-[1px_1px_0px_#b45309]">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong className="text-[#17202B] uppercase">{item.title}{item.mandatory ? ' · [MANDATORY]' : ''}</strong>
                  <span className={`font-mono font-black ${item.uploadedDocument?.verificationStatus === 'VERIFIED' ? 'text-[#18794E]' : 'text-amber-800'}`}>
                    {item.uploadedDocument?.verificationStatus || 'NOT UPLOADED'}
                  </span>
                </div>
                <p className="mt-1 text-[#5B6875] font-mono text-[11px]">{item.aphClause} · {item.description}</p>
                {item.uploadedDocument?.verificationExplanation && (
                  <p className="mt-1 text-xs text-slate-700 bg-slate-50 p-1.5 border border-slate-200 rounded-sm">{item.uploadedDocument.verificationExplanation}</p>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCorrectionUpload} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end pt-2">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-amber-950 mb-1">
                Required Document Type
              </label>
              <select
                required
                value={correctionType}
                onChange={(event) => setCorrectionType(event.target.value as DocumentType)}
                className="w-full rounded-sm border-2 border-amber-700 bg-white p-2 text-xs font-semibold"
              >
                <option value="">Select required document</option>
                {correctionChecklist.map((item) => (
                  <option key={item.documentType} value={item.documentType}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-amber-950 mb-1">
                Corrected File (PDF/JPEG/PNG)
              </label>
              <input
                required
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => setCorrectionFile(event.target.files?.[0] || null)}
                className="w-full rounded-sm border-2 border-amber-700 bg-white p-1 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isUploadingCorrection || !correctionType || !correctionFile}
              className="gov-btn-primary py-2 px-4 text-xs font-bold disabled:opacity-50"
            >
              {isUploadingCorrection ? 'Verifying…' : 'Upload & Verify'}
            </button>
          </form>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCorrectionResubmit}
              disabled={isResubmitting || correctionChecklist.some((item) => item.mandatory && item.uploadedDocument?.verificationStatus !== 'VERIFIED')}
              className="gov-btn-saffron py-2 px-5 text-xs font-black shadow-[2px_2px_0px_#17202B] disabled:opacity-50"
            >
              {isResubmitting ? 'Revalidating Dossier…' : 'Revalidate and Resubmit for Scrutiny'}
            </button>
          </div>
        </section>
      )}

      {/* Released Deficiency Notices Section */}
      <div className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#17202B]">
          <div>
            <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
              Scrutiny Deficiency Notices ({application.deficiencyNotices?.length || 0})
            </h2>
            <p className="text-xs text-[#5B6875] mt-0.5">
              Formal statutory deficiency notices released by the AICTE Scrutiny Committee requiring clarification
            </p>
          </div>
        </div>

        {(!application.deficiencyNotices || application.deficiencyNotices.length === 0) ? (
          <div className="p-8 text-center text-xs font-mono text-[#5B6875] border-2 border-dashed border-[#17202B]">
            <CheckCircle2 className="w-8 h-8 text-[#18794E] mx-auto mb-2" />
            <span className="font-bold text-[#17202B]">No formal deficiency notices issued on this dossier.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {application.deficiencyNotices.map((notice) => (
              <div
                key={notice.id}
                className="p-4 rounded-sm border-2 border-[#17202B] bg-[#FAF9F6] space-y-3 shadow-[1px_1px_0px_#17202B]"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-300 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-[#142B45]">{notice.noticeNumber}</span>
                    <span className="text-xs font-black text-[#17202B] uppercase">{notice.title}</span>
                    <span className="text-[10px] text-[#5B6875] font-mono font-bold">[{notice.requirementRef}]</span>
                  </div>

                  <div>
                    {notice.status === 'RESOLVED_SATISFIED' ? (
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-black border border-[#18794E] bg-emerald-100 text-emerald-950 uppercase">
                        Resolved / Satisfied
                      </span>
                    ) : notice.status === 'AWAITING_OFFICER_REVIEW' ? (
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-black border border-[#142B45] bg-[#EAF0F5] text-[#142B45] uppercase">
                        Response Awaiting Committee Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-black border border-amber-600 bg-amber-100 text-amber-950 uppercase">
                        Clarification Required
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#17202B] bg-white p-3 rounded-sm border border-slate-300 font-mono leading-relaxed">
                  {notice.description}
                </p>

                {notice.institutionResponse && (
                  <div className="p-3 bg-[#EAF0F5] rounded-sm border-2 border-[#142B45] text-xs">
                    <div className="font-black text-[#142B45] uppercase tracking-wide mb-1">Your Clarification Response:</div>
                    <p className="text-[#17202B] font-mono">{notice.institutionResponse}</p>
                    {notice.responseDocumentRef && (
                      <div className="text-[11px] text-[#5B6875] font-mono mt-1 pt-1 border-t border-slate-300">
                        Attached Supporting Reference: <strong>{notice.responseDocumentRef}</strong>
                      </div>
                    )}
                  </div>
                )}

                {notice.officerReviewNotes && (
                  <div className="p-3 bg-emerald-50 rounded-sm border-2 border-[#18794E] text-xs text-emerald-950">
                    <span className="font-black uppercase tracking-wide">Scrutiny Officer Evaluation Note:</span>
                    <p className="mt-1 font-mono">{notice.officerReviewNotes}</p>
                  </div>
                )}

                {notice.status !== 'RESOLVED_SATISFIED' && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenResponseModal(notice)}
                      className="gov-btn-primary py-1.5 px-3.5 text-xs font-bold"
                    >
                      {notice.institutionResponse ? 'Update Response & Evidence' : 'Submit Response & Evidence'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploaded Documents Vault */}
      <div className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] p-6 space-y-4">
        <div className="border-b-2 border-[#17202B] pb-3">
          <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
            Uploaded Statutory Documents Vault ({application.documents?.length || 0})
          </h2>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Immutable, hashed regulatory documents submitted for AICTE scrutiny evaluation
          </p>
        </div>

        {(!application.documents || application.documents.length === 0) ? (
          <p className="text-xs font-mono text-[#5B6875]">No documents uploaded for this application.</p>
        ) : (
          <div className="border-2 border-[#17202B] rounded-sm overflow-hidden text-xs shadow-[2px_2px_0px_#17202B]">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document Title & Details</th>
                  <th>Verification Status</th>
                  <th>SHA-256 Checksum & Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {application.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="font-black text-[#17202B]">{doc.title}</div>
                      <div className="text-[10px] text-[#5B6875] font-mono">{(doc.fileSize / 1024).toFixed(1)} KB · {doc.documentType}</div>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] font-black border ${
                        doc.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-950 border-[#18794E]'
                          : doc.verificationStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-950 border-rose-700'
                          : 'bg-amber-100 text-amber-950 border-amber-600'
                      }`}>
                        {doc.verificationStatus}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-[#5B6875]">
                      <div>{doc.fileHash ? doc.fileHash.slice(0, 18) + '...' : 'Verified on upload'}</div>
                      <div className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="text-right">
                      <a
                        href={`/api/institution/applications/${application.id}/documents/${doc.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="gov-btn-secondary py-1 px-2.5 text-xs font-bold inline-flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deficiency Response Modal */}
      {activeNoticeForResponse && (
        <div className="fixed inset-0 z-50 bg-[#17202B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-lg w-full p-6 shadow-[4px_4px_0px_#17202B] border-2 border-[#17202B] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-[#17202B]">
              <div>
                <h3 className="text-sm font-black text-[#142B45] uppercase tracking-wide">
                  Respond to Deficiency Notice
                </h3>
                <span className="text-xs font-mono text-[#5B6875]">
                  {activeNoticeForResponse.noticeNumber} — {activeNoticeForResponse.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoticeForResponse(null)}
                className="text-[#5B6875] hover:text-[#17202B] p-1 border border-transparent hover:border-[#17202B] rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {responseSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border-2 border-[#18794E] rounded-sm text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#18794E] mx-auto" />
                <div className="text-xs font-black text-emerald-950 uppercase">{responseSuccessMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div className="p-3 bg-[#FAF9F6] rounded-sm text-xs text-[#17202B] border-2 border-[#17202B]">
                  <strong>Deficiency Observation:</strong> {activeNoticeForResponse.description}
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                    Institutional Clarification / Explanation *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Provide specific factual explanation addressing the committee observation..."
                    className="w-full p-2.5 text-xs bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                    Supporting Document Reference / Filename (if applicable)
                  </label>
                  <input
                    type="text"
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="e.g. Registered_Lease_Deed_Addendum_35Yr.pdf"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t border-slate-300">
                  <button
                    type="button"
                    onClick={() => setActiveNoticeForResponse(null)}
                    className="gov-btn-secondary py-1.5 px-4 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResponse || !responseText.trim()}
                    className="gov-btn-primary py-1.5 px-4 text-xs font-bold disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>{isSubmittingResponse ? 'Submitting...' : 'Submit Clarification'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
