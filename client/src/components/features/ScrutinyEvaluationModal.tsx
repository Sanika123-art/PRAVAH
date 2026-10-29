import React, { useEffect, useState } from 'react';
import { Application } from '@saksham/shared';
import {
  analyzeApplicationScrutiny,
  fetchScrutinyWorkbench,
  reviewApplicationFinding,
  saveApplicationDecision,
  ScrutinyComparison,
  ScrutinyFinding,
  ScrutinyWorkbench,
} from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle2, ExternalLink, FileCheck, Clock, RotateCcw, ShieldAlert, X } from 'lucide-react';

interface ScrutinyEvaluationModalProps {
  application: Application | null;
  onClose: () => void;
  onDecisionSaved?: () => void;
}

const severityStyles: Record<ScrutinyFinding['severity'], string> = {
  CRITICAL: 'border-2 border-[#C5221F] bg-[#FDF2F2] text-[#C5221F] font-bold shadow-[1px_1px_0px_#C5221F]',
  HIGH: 'border-2 border-[#B45309] bg-[#FFF7ED] text-[#B45309] font-bold shadow-[1px_1px_0px_#B45309]',
  MEDIUM: 'border-2 border-[#D97706] bg-[#FEF3C7] text-[#92400E] font-bold shadow-[1px_1px_0px_#D97706]',
  LOW: 'border-2 border-[#17202B] bg-[#FAF9F6] text-[#17202B] font-bold shadow-[1px_1px_0px_#17202B]',
};

const findingStateLabel: Record<ScrutinyFinding['reviewState'], string> = {
  PENDING: 'Pending Scrutiny',
  CONFIRMED: 'Confirmed Deficiency',
  DISMISSED: 'Dismissed as False Positive',
  RESOLVED: 'Resolved Satisfactorily',
};

const fileUrl = (applicationId: string, documentId: string) =>
  `/api/institution/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}/file`;

export const ScrutinyEvaluationModal: React.FC<ScrutinyEvaluationModalProps> = ({ application, onClose, onDecisionSaved }) => {
  const { currentUser } = useAuth();
  const [workbench, setWorkbench] = useState<ScrutinyWorkbench | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<ScrutinyFinding | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState<'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT'>('APPROVE');
  const [affectedFindingIds, setAffectedFindingIds] = useState<string[]>([]);
  const [overrideFindingIds, setOverrideFindingIds] = useState<string[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshWorkbench = async () => {
    if (!application) return;
    const data = await fetchScrutinyWorkbench(application.id);
    setWorkbench(data);
    const currentFindings = data.latestRun?.findings || [];
    setAffectedFindingIds((previous) => previous.filter((id) => currentFindings.some((finding) => finding.id === id)));
    setOverrideFindingIds((previous) => previous.filter((id) => currentFindings.some((finding) => finding.id === id)));
    if (selectedFinding) {
      setSelectedFinding(currentFindings.find((finding) => finding.id === selectedFinding.id) || null);
    }
  };

  useEffect(() => {
    setWorkbench(null);
    setError(null);
    setSuccess(null);
    setSelectedFinding(null);
    if (application) {
      let cancelled = false;
      const loadWorkbench = async () => {
        setBusy(true);
        try {
          let data = await fetchScrutinyWorkbench(application.id);
          if (!data.latestRun && !application.isDemo) {
            await analyzeApplicationScrutiny(application.id);
            data = await fetchScrutinyWorkbench(application.id);
          }
          if (!cancelled) setWorkbench(data);
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load the scrutiny workbench.');
        } finally {
          if (!cancelled) setBusy(false);
        }
      };
      void loadWorkbench();
      return () => {
        cancelled = true;
      };
    }
  }, [application?.id]);

  if (!application) return null;

  const findings = workbench?.latestRun?.findings || [];
  const unresolved = findings.filter((finding) => ['PENDING', 'CONFIRMED'].includes(finding.reviewState));
  const blocking = unresolved.filter((finding) => finding.severity !== 'LOW');
  const canOverride = currentUser?.role === 'SYSTEM_ADMIN';
  const documents = workbench?.application.documents || [];

  const runAnalysis = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await analyzeApplicationScrutiny(application.id);
      await refreshWorkbench();
      setSuccess('A new OCR/rule scrutiny run was saved. Earlier runs remain available in the history.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to analyze this application.');
    } finally {
      setBusy(false);
    }
  };

  const saveFindingReview = async (reviewState: ScrutinyFinding['reviewState']) => {
    if (!selectedFinding || reviewNote.trim().length < 5) {
      setError('Add an officer note of at least 5 characters before updating the finding.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reviewApplicationFinding(application.id, selectedFinding.id, reviewState, reviewNote.trim());
      await refreshWorkbench();
      setReviewNote('');
      setSuccess(`Finding marked ${findingStateLabel[reviewState].toLowerCase()}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the finding review.');
    } finally {
      setBusy(false);
    }
  };

  const saveDecision = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await saveApplicationDecision(application.id, {
        decision,
        remarks: remarks.trim(),
        affectedFindingIds,
        overrideFindingIds,
        overrideReason: overrideFindingIds.length ? overrideReason.trim() : undefined,
      });
      setSuccess(`Decision saved. Application advanced to ${result.data.resultingStage.replace(/_/g, ' ')}.`);
      await refreshWorkbench();
      onDecisionSaved?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the decision.');
    } finally {
      setBusy(false);
    }
  };

  const toggleId = (ids: string[], setIds: (value: string[]) => void, id: string) =>
    setIds(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="scrutiny-title"
        className="bg-white rounded-sm shadow-[4px_4px_0px_#17202B] w-full max-w-6xl max-h-[94vh] flex flex-col border-2 border-[#17202B]"
      >
        <header className="bg-[#142B45] text-white p-5 flex items-start justify-between border-b-2 border-[#17202B]">
          <div>
            <div className="flex gap-2 items-center text-[10px] uppercase tracking-wider font-mono font-bold text-[#E98232]">
              <FileCheck className="w-4 h-4 text-[#E98232]" />
              <span>REGULATORY SCRUTINY WORKBENCH • AICTE APH 2024–27</span>
              {application.isDemo && (
                <span className="rounded-sm bg-[#E98232] text-white px-2 py-0.2 border border-[#17202B] font-bold">
                  DEMO SPECIMEN
                </span>
              )}
            </div>
            <h2 id="scrutiny-title" className="mt-1 text-lg font-black tracking-tight text-white leading-tight">
              {application.instituteName}
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              APP: <span className="text-white font-bold">{application.applicationNumber}</span> • PID: <span className="text-[#E98232] font-bold">{application.permanentInstituteId}</span> • Scope: {application.region.replace(/_/g, ' ')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scrutiny workbench"
            className="p-1.5 text-white border border-white/40 rounded-sm hover:bg-[#0A1B38] hover:border-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-5 text-xs bg-[#FAF9F6]">
          {error && (
            <div role="alert" className="rounded-sm border-2 border-[#C5221F] bg-[#FDF2F2] p-3 text-[#C5221F] font-bold shadow-[2px_2px_0px_#C5221F]">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-sm border-2 border-[#18794E] bg-[#EBF6F0] p-3 text-[#13603E] font-bold shadow-[2px_2px_0px_#18794E]">
              {success}
            </div>
          )}
          {!workbench && !error ? (
            <div className="p-10 text-center text-[#5B6875] font-bold font-mono">
              <Clock className="w-5 h-5 animate-spin inline mr-2 text-[#142B45]" />
              Querying actual application data from PostgreSQL...
            </div>
          ) : null}

          {workbench && (
            <>
              {/* Institution Metadata Grid */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  ['Trust / Society', application.trustName],
                  ['Approval category', application.category.replace(/_/g, ' ')],
                  ['Sector / type', application.institutionType.replace(/_/g, ' ')],
                  ['Regional office / state', `${application.region.replace(/_/g, ' ')} · ${application.state}`],
                  ['Campus land', `${application.landAreaAcres} acres`],
                  ['Current stage', application.currentStage.replace(/_/g, ' ')],
                  ['Stage / application age', `${application.stageAgeingDays} / ${application.totalAgeingDays} days`],
                  ['Submitted', new Date(application.submissionDate).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label} className="p-2.5 rounded-sm border border-[#17202B] bg-white shadow-[1px_1px_0px_#17202B]">
                    <div className="text-[10px] font-black uppercase text-[#5B6875]">{label}</div>
                    <div className="mt-0.5 font-bold text-[#17202B] truncate">{value || 'Not recorded'}</div>
                  </div>
                ))}
              </section>

              {/* Application Documents Section */}
              <section className="rounded-sm border-2 border-[#17202B] bg-white shadow-[2px_2px_0px_#17202B] overflow-hidden">
                <div className="p-3 bg-[#EAF0F5] border-b-2 border-[#17202B] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-[#142B45] text-xs uppercase tracking-wider">
                      Application Documents ({documents.length})
                    </h3>
                    <p className="text-[10px] text-[#5B6875] font-medium">
                      OCR and deterministic rules assist review; regulatory officers retain statutory decision authority.
                    </p>
                  </div>
                  <button
                    disabled={busy || application.isDemo}
                    onClick={runAnalysis}
                    className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded-sm bg-[#142B45] text-white border border-[#17202B] font-bold uppercase tracking-wider text-[11px] hover:bg-[#0A1B38] shadow-[1px_1px_0px_#17202B] disabled:opacity-50 transition"
                  >
                    {busy ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Run Verification Rules</span>
                  </button>
                </div>
                {documents.length === 0 ? (
                  <p className="p-4 text-[#5B6875] italic">No documents are uploaded for this application.</p>
                ) : (
                  <div className="divide-y divide-[#CBD5E1]">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 flex flex-wrap items-center justify-between gap-2 hover:bg-[#FAF9F6]">
                        <div>
                          <div className="font-bold text-[#17202B] text-xs">
                            {doc.title}{' '}
                            <span className="font-mono text-[10px] text-[#5B6875] bg-[#EAF0F5] px-1 py-0.2 border border-[#CBD5E1] ml-1">
                              {doc.documentType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-[#5B6875] font-mono">
                            OCR: {doc.ocrMethod || 'Manual'} • Confidence:{' '}
                            {doc.ocrConfidence === null || doc.ocrConfidence === undefined
                              ? 'N/A'
                              : `${doc.ocrConfidence.toFixed(1)}%`}{' '}
                            • Rule Status: <strong className="text-[#142B45]">{doc.verificationStatus}</strong>
                            {doc.detectedDocumentType ? ` • Detected: ${doc.detectedDocumentType.replace(/_/g, ' ')}` : ''}
                          </div>
                          {doc.verificationExplanation && (
                            <p className="mt-1 text-[11px] text-[#17202B] font-medium">{doc.verificationExplanation}</p>
                          )}
                        </div>
                        <a
                          href={fileUrl(application.id, doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-sm border border-[#17202B] bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#142B45] hover:bg-[#EAF0F5] shadow-[1px_1px_0px_#17202B]"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#E98232]" /> Open Source Document
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Field Comparisons Table */}
              <section className="rounded-sm border-2 border-[#17202B] bg-white shadow-[2px_2px_0px_#17202B] overflow-hidden">
                <div className="p-3 bg-[#EAF0F5] border-b-2 border-[#17202B]">
                  <h3 className="font-black text-[#142B45] text-xs uppercase tracking-wider">
                    Extracted Field Regulatory Cross-Checks
                  </h3>
                  <p className="text-[10px] text-[#5B6875]">
                    Unextracted values are flagged as pending officer inspection. Discrepancies require explicit review note.
                  </p>
                </div>
                {workbench.comparisons.length ? (
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Document / Parameter</th>
                          <th>Application Declared</th>
                          <th>OCR Extracted</th>
                          <th>Scrutiny Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workbench.comparisons.map((comparison: ScrutinyComparison) => (
                          <tr key={`${comparison.documentId}-${comparison.fieldName}`}>
                            <td>
                              <div className="font-bold text-[#142B45]">{comparison.label}</div>
                              <div className="text-[10px] text-[#5B6875] font-mono">{comparison.documentType.replace(/_/g, ' ')}</div>
                            </td>
                            <td className="font-mono font-bold text-[#17202B]">{comparison.applicationValue || 'Not declared'}</td>
                            <td className="font-mono font-bold text-[#17202B]">{comparison.documentValue || 'Not extracted'}</td>
                            <td>
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded-sm border text-[10px] font-black uppercase font-mono ${
                                  comparison.result.includes('MATCH')
                                    ? 'bg-[#EBF6F0] text-[#13603E] border-[#18794E]'
                                    : comparison.result === 'CONFLICT'
                                    ? 'bg-[#FDF2F2] text-[#C5221F] border-[#C5221F]'
                                    : comparison.result === 'NOT_EXTRACTED'
                                    ? 'bg-[#FFF7ED] text-[#B45309] border-[#B45309]'
                                    : 'bg-[#FAF9F6] text-[#5B6875] border-[#CBD5E1]'
                                }`}
                              >
                                {comparison.result.replace(/_/g, ' ')}
                              </span>
                              <div className="mt-0.5 text-[11px] text-[#5B6875] leading-snug">{comparison.explanation}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-4 text-[#5B6875] italic">No cross-field comparisons available for this file.</p>
                )}
              </section>

              {/* Findings & Officer Decisions */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#17202B] pb-1">
                  <div>
                    <h3 className="font-black text-[#142B45] text-xs uppercase tracking-wider">
                      Regulatory Scrutiny Findings ({findings.length})
                    </h3>
                    <p className="text-[10px] text-[#5B6875]">Select a discrepancy below to record officer evaluation.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#C5221F] bg-[#FDF2F2] border border-[#C5221F] px-2 py-0.5 rounded-sm">
                    BLOCKING UNRESOLVED: {blocking.length}
                  </span>
                </div>

                {!workbench.latestRun ? (
                  <p className="rounded-sm border-2 border-dashed border-[#17202B] p-4 text-[#5B6875] font-medium">
                    No scrutiny run exists. Execute verification rules before entering regulatory decision.
                  </p>
                ) : findings.length === 0 ? (
                  <p className="rounded-sm border-2 border-[#18794E] bg-[#EBF6F0] p-4 text-[#13603E] font-bold shadow-[2px_2px_0px_#18794E]">
                    No discrepancies detected by automated rules. Complete manual scrutiny verification below.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {findings.map((finding) => (
                      <button
                        key={finding.id}
                        type="button"
                        onClick={() => {
                          setSelectedFinding(finding);
                          setReviewNote(finding.officerNotes || '');
                          setError(null);
                        }}
                        className={`w-full text-left rounded-sm p-3 transition border-2 ${
                          severityStyles[finding.severity]
                        } ${selectedFinding?.id === finding.id ? 'ring-2 ring-[#142B45] border-[#142B45]' : ''}`}
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <strong className="uppercase font-mono text-[11px]">
                            [{finding.severity}] {finding.fieldName}
                          </strong>
                          <span className="font-mono text-[10px] uppercase bg-white/80 px-1.5 py-0.2 rounded-sm border border-current">
                            {findingStateLabel[finding.reviewState]}
                          </span>
                        </div>
                        <div className="mt-1 font-medium text-xs">{finding.reason}</div>
                        {finding.applicationValue && (
                          <div className="mt-1 text-[10px] font-mono opacity-90">
                            Declared: &ldquo;{finding.applicationValue}&rdquo; • Extracted: &ldquo;
                            {finding.documentValue || 'Not extracted'}&rdquo;
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Finding Detail Inspection Drawer Box */}
                {selectedFinding && (
                  <div className="rounded-sm border-2 border-[#142B45] bg-[#EAF0F5] p-4 space-y-3 shadow-[2px_2px_0px_#142B45]">
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-[#142B45] text-xs uppercase tracking-wider font-mono">
                        Evaluation Desk • {selectedFinding.findingType.replace(/_/g, ' ')}
                      </strong>
                      <button
                        onClick={() => setSelectedFinding(null)}
                        aria-label="Close finding detail"
                        className="text-[#142B45] hover:text-black"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedFinding.documentId && (
                      <a
                        href={fileUrl(application.id, selectedFinding.documentId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#142B45] font-bold underline hover:text-[#E98232]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Original Document {selectedFinding.evidencePage ? `(Page ${selectedFinding.evidencePage})` : ''}</span>
                      </a>
                    )}

                    {selectedFinding.evidence && (
                      <blockquote className="border-l-4 border-[#142B45] bg-white p-2.5 text-[#17202B] rounded-sm font-mono text-[11px] shadow-sm">
                        <div className="text-[10px] font-black uppercase text-[#5B6875] mb-1">
                          OCR Excerpt Expose
                          {selectedFinding.evidencePage ? ` • Page ${selectedFinding.evidencePage}` : ''}
                          {selectedFinding.ocrConfidence !== null ? ` • ${selectedFinding.ocrConfidence.toFixed(1)}% Confidence` : ''}
                        </div>
                        {selectedFinding.evidence}
                      </blockquote>
                    )}

                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-sm border border-[#17202B]">
                        <span className="text-[10px] font-bold text-[#5B6875] uppercase block">Declared in Application:</span>
                        <span className="font-mono font-bold text-[#17202B]">{selectedFinding.applicationValue || 'N/A'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-sm border border-[#17202B]">
                        <span className="text-[10px] font-bold text-[#5B6875] uppercase block">Document Evidence:</span>
                        <span className="font-mono font-bold text-[#17202B]">{selectedFinding.documentValue || 'Not extracted'}</span>
                      </div>
                    </div>

                    <p className="text-[#17202B] font-medium text-xs">
                      <strong>Handbook Recommended Action:</strong> {selectedFinding.recommendedAction}
                    </p>

                    <div>
                      <label className="block font-black text-xs uppercase text-[#142B45] mb-1">
                        Officer Finding Verification Note * (Minimum 5 characters)
                      </label>
                      <textarea
                        rows={2}
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        placeholder="State technical basis for confirming, dismissing, or resolving this finding..."
                        className="w-full rounded-sm border-2 border-[#17202B] bg-white p-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#E98232]"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busy}
                        onClick={() => saveFindingReview('CONFIRMED')}
                        className="px-3 py-1.5 rounded-sm bg-[#B45309] hover:bg-[#8C3D0E] text-white border border-[#17202B] font-bold uppercase tracking-wider text-xs shadow-[1px_1px_0px_#17202B] disabled:opacity-50"
                      >
                        Confirm Finding
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => saveFindingReview('DISMISSED')}
                        className="px-3 py-1.5 rounded-sm bg-[#5B6875] hover:bg-[#2E3A47] text-white border border-[#17202B] font-bold uppercase tracking-wider text-xs shadow-[1px_1px_0px_#17202B] disabled:opacity-50"
                      >
                        Dismiss as False Positive
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => saveFindingReview('RESOLVED')}
                        className="px-3 py-1.5 rounded-sm bg-[#18794E] hover:bg-[#13603E] text-white border border-[#17202B] font-bold uppercase tracking-wider text-xs shadow-[1px_1px_0px_#17202B] disabled:opacity-50"
                      >
                        Mark Finding Resolved
                      </button>
                    </div>

                    {selectedFinding.overrideReason && (
                      <p className="text-[#C5221F] font-bold font-mono text-[11px] bg-white p-2 border border-[#C5221F] rounded-sm">
                        OVERRIDE BY {selectedFinding.overrideByName}: {selectedFinding.overrideReason}
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Scrutiny & Decision History */}
              <section className="rounded-sm border-2 border-[#17202B] bg-white p-4 shadow-[2px_2px_0px_#17202B]">
                <h3 className="font-black text-[#142B45] text-xs uppercase tracking-wider">
                  Audit History of Regulatory Decisions
                </h3>
                {workbench.application.scrutinyRuns.length === 0 && workbench.application.officerDecisions.length === 0 ? (
                  <p className="mt-2 text-[#5B6875] italic">No previous scrutiny or decision history recorded.</p>
                ) : (
                  <div className="mt-2 space-y-2 font-mono text-[11px]">
                    {workbench.application.scrutinyRuns.map((run) => (
                      <div key={run.id} className="border-l-4 border-[#142B45] pl-2 py-0.5">
                        <strong className="text-[#142B45]">Analysis Run:</strong> {new Date(run.createdAt).toLocaleString()} • Officer: {run.officerName} • Findings: {run.findings.length}
                      </div>
                    ))}
                    {workbench.application.officerDecisions.map((item) => (
                      <div key={item.id} className="border-l-4 border-[#18794E] pl-2 py-0.5">
                        <strong className="text-[#18794E] uppercase">{item.decision.replace(/_/g, ' ')}:</strong> {new Date(item.createdAt).toLocaleString()} • Officer: {item.officerName} • Remarks: {item.remarks}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Officer Decision Form */}
              <form onSubmit={saveDecision} className="rounded-sm border-2 border-[#17202B] bg-white p-4 space-y-3 shadow-[2px_2px_0px_#17202B]">
                <h3 className="font-black text-[#142B45] text-xs uppercase tracking-wider">
                  Record Officer Statutory Decision
                </h3>

                {blocking.length > 0 && (
                  <div className="flex items-center gap-2 text-[#C5221F] bg-[#FDF2F2] p-2.5 rounded-sm border border-[#C5221F] font-bold">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>Statutory approval blocked by {blocking.length} unresolved discrepancy finding(s). Resolve or record deficiency notice.</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 pt-1">
                  {(['APPROVE', 'REQUEST_CORRECTION', 'REJECT'] as const).map((choice) => (
                    <label key={choice} className="inline-flex items-center gap-2 font-black uppercase text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === choice}
                        onChange={() => setDecision(choice)}
                        disabled={application.isDemo}
                        className="w-4 h-4 text-[#142B45] border-2 border-[#17202B]"
                      />
                      <span>{choice.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>

                {decision !== 'APPROVE' && (
                  <div className="space-y-1.5 p-3 bg-[#FAF9F6] border border-[#17202B] rounded-sm">
                    <div className="font-black text-xs uppercase text-[#142B45]">Associate Relevant Discrepancies *</div>
                    {findings
                      .filter((finding) => finding.reviewState !== 'DISMISSED')
                      .map((finding) => (
                        <label key={finding.id} className="flex items-start gap-2 text-[#17202B] text-xs cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={affectedFindingIds.includes(finding.id)}
                            onChange={() => toggleId(affectedFindingIds, setAffectedFindingIds, finding.id)}
                            className="mt-0.5 w-4 h-4 text-[#142B45] border-2 border-[#17202B]"
                          />
                          <span>
                            <strong>[{finding.severity}] {finding.fieldName}</strong> — {finding.reason}
                          </span>
                        </label>
                      ))}
                  </div>
                )}

                {canOverride && decision === 'APPROVE' && blocking.length > 0 && (
                  <div className="rounded-sm border-2 border-[#B45309] bg-[#FFF7ED] p-3 space-y-2">
                    <strong className="text-xs uppercase font-black text-[#B45309]">System Administrator Statutory Override Desk</strong>
                    {blocking.map((finding) => (
                      <label key={finding.id} className="flex gap-2 text-xs font-bold text-[#17202B]">
                        <input
                          type="checkbox"
                          checked={overrideFindingIds.includes(finding.id)}
                          onChange={() => toggleId(overrideFindingIds, setOverrideFindingIds, finding.id)}
                        />
                        <span>Override [{finding.severity}]: {finding.fieldName}</span>
                      </label>
                    ))}
                    {overrideFindingIds.length > 0 && (
                      <textarea
                        required
                        minLength={10}
                        rows={2}
                        value={overrideReason}
                        onChange={(event) => setOverrideReason(event.target.value)}
                        placeholder="Provide formal statutory justification for overriding each selected discrepancy (minimum 10 characters)..."
                        className="w-full rounded-sm border-2 border-[#B45309] bg-white p-2 text-xs font-medium"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-black text-xs uppercase text-[#142B45] mb-1">
                    Officer Decision Remarks * (Minimum 10 characters)
                  </label>
                  <textarea
                    required
                    minLength={10}
                    maxLength={4000}
                    rows={3}
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    className="w-full rounded-sm border-2 border-[#17202B] p-2.5 text-xs font-medium bg-[#FAF9F6] focus:bg-white focus:outline-none"
                    placeholder="Record the factual basis, handbook clauses, and inspected evidence for this regulatory determination..."
                  />
                </div>

                <div className="flex items-start gap-2 text-[10px] text-[#5B6875] font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#B45309]" />
                  <span>
                    Officer decisions are cryptographically recorded in the permanent regulatory audit trail. Automated verification assists human officers; statutory decisions remain strictly human-in-the-loop per AICTE mandate.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={busy || application.isDemo || !workbench.latestRun}
                    className="inline-flex gap-2 items-center px-4 py-2 rounded-sm bg-[#142B45] hover:bg-[#0A1B38] text-white border-2 border-[#17202B] font-black uppercase tracking-wider text-xs shadow-[2px_2px_0px_#17202B] disabled:opacity-50 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#18794E]" />
                    <span>Save Formal Regulatory Decision</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </main>
      </section>
    </div>
  );
};
