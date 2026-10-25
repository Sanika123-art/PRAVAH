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
  CRITICAL: 'border-rose-300 bg-rose-50 text-rose-900',
  HIGH: 'border-orange-300 bg-orange-50 text-orange-900',
  MEDIUM: 'border-amber-300 bg-amber-50 text-amber-900',
  LOW: 'border-slate-300 bg-slate-50 text-slate-700',
};

const findingStateLabel: Record<ScrutinyFinding['reviewState'], string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DISMISSED: 'Dismissed',
  RESOLVED: 'Resolved',
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="scrutiny-title" className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col border border-slate-200">
        <header className="bg-[#0A1B38] text-white p-5 flex items-start justify-between rounded-t-xl">
          <div>
            <div className="flex gap-2 items-center text-[11px] uppercase tracking-wider font-bold text-amber-300">
              <FileCheck className="w-4 h-4" /> Officer Scrutiny Workbench
              {application.isDemo && <span className="rounded bg-amber-200 px-2 py-0.5 text-amber-950">DEMO · READ ONLY</span>}
            </div>
            <h2 id="scrutiny-title" className="mt-1 text-lg font-extrabold">{application.instituteName}</h2>
            <p className="text-xs text-slate-300 font-mono">{application.applicationNumber} · PID {application.permanentInstituteId} · {application.region.replace(/_/g, ' ')}</p>
          </div>
          <button onClick={onClose} aria-label="Close scrutiny workbench" className="p-1 text-slate-300 hover:text-white"><X className="w-5 h-5" /></button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {error && <div role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-rose-800">{error}</div>}
          {success && <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">{success}</div>}
          {!workbench && !error ? <div className="p-10 text-center text-slate-500"><Clock className="w-5 h-5 animate-spin inline mr-2" />Loading actual application data...</div> : null}
          {workbench && (
            <>
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
                  <div key={label} className="p-3 rounded border border-slate-200 bg-slate-50">
                    <div className="text-[10px] uppercase text-slate-500">{label}</div><div className="mt-1 font-bold text-slate-900">{value || 'Not recorded'}</div>
                  </div>
                ))}
              </section>

              <section className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
                  <div><h3 className="font-bold text-slate-900">Application documents ({documents.length})</h3><p className="text-[10px] text-slate-500">OCR and deterministic rules assist review; they do not establish authenticity.</p></div>
                  <button disabled={busy || application.isDemo} onClick={runAnalysis} className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded bg-gov-navy-900 text-white font-bold disabled:opacity-50">
                    {busy ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Analyze / re-run
                  </button>
                </div>
                {documents.length === 0 ? <p className="p-4 text-slate-500">No documents are uploaded.</p> : (
                  <div className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{doc.title} <span className="font-mono text-[10px] text-slate-500">· {doc.documentType.replace(/_/g, ' ')}</span></div>
                          <div className="mt-1 text-[10px] text-slate-500">OCR: {doc.ocrMethod || 'Not recorded'} · confidence: {doc.ocrConfidence === null || doc.ocrConfidence === undefined ? 'Unavailable' : `${doc.ocrConfidence.toFixed(1)}%`} · rule result: <strong>{doc.verificationStatus}</strong>{doc.detectedDocumentType ? ` · detected ${doc.detectedDocumentType.replace(/_/g, ' ')}` : ''}</div>
                          {doc.verificationExplanation && <p className="mt-1 text-[10px] text-slate-600">{doc.verificationExplanation}</p>}
                        </div>
                        <a href={fileUrl(application.id, doc.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50"><ExternalLink className="w-3.5 h-3.5" /> Open original</a>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 bg-slate-50 border-b"><h3 className="font-bold text-slate-900">Field comparisons</h3><p className="text-[10px] text-slate-500">Unextracted values are unknown, not assumed to be absent. Fuzzy differences never auto-pass.</p></div>
                {workbench.comparisons.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left">
                  <thead className="bg-white text-[10px] uppercase text-slate-500"><tr><th className="p-2">Document / field</th><th className="p-2">Application value</th><th className="p-2">OCR value</th><th className="p-2">Comparison</th></tr></thead>
                  <tbody>{workbench.comparisons.map((comparison: ScrutinyComparison) => (
                    <tr key={`${comparison.documentId}-${comparison.fieldName}`} className="border-t border-slate-100 align-top">
                      <td className="p-2"><div className="font-semibold">{comparison.label}</div><div className="text-[10px] text-slate-500">{comparison.documentType.replace(/_/g, ' ')}</div></td>
                      <td className="p-2">{comparison.applicationValue || 'Not provided'}</td><td className="p-2">{comparison.documentValue || 'Not extracted'}</td>
                      <td className="p-2"><span className={`font-bold ${comparison.result.includes('MATCH') ? 'text-emerald-700' : comparison.result === 'CONFLICT' ? 'text-rose-700' : comparison.result === 'NOT_EXTRACTED' ? 'text-amber-700' : 'text-slate-600'}`}>{comparison.result.replace(/_/g, ' ')}</span><div className="mt-0.5 text-[10px] text-slate-600">{comparison.explanation}</div></td>
                    </tr>
                  ))}</tbody>
                </table></div> : <p className="p-4 text-slate-500">No configured application fields could be compared yet.</p>}
              </section>

              <section className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="font-bold text-slate-900">Current findings ({findings.length})</h3><p className="text-[10px] text-slate-500">Open a finding to inspect its evidence and record an officer review.</p></div>
                  <span className="text-[10px] text-slate-600">Blocking unresolved: <strong>{blocking.length}</strong></span>
                </div>
                {!workbench.latestRun ? <p className="rounded border border-dashed border-slate-300 p-4 text-slate-600">No scrutiny run exists. Run OCR/rule analysis before recording a decision.</p> : findings.length === 0 ? <p className="rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">No automated discrepancies were generated. Officers must still complete their independent review.</p> : (
                  <div className="space-y-2">{findings.map((finding) => (
                    <button key={finding.id} type="button" onClick={() => { setSelectedFinding(finding); setReviewNote(finding.officerNotes || ''); setError(null); }} className={`w-full text-left rounded-lg border p-3 ${severityStyles[finding.severity]} ${selectedFinding?.id === finding.id ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex flex-wrap justify-between gap-2"><strong>{finding.severity} · {finding.fieldName}</strong><span>{findingStateLabel[finding.reviewState]}</span></div>
                      <div className="mt-1">{finding.reason}</div>
                      {finding.applicationValue && <div className="mt-1 text-[10px]">Application: “{finding.applicationValue}” · Document: “{finding.documentValue || 'Not extracted'}”</div>}
                    </button>
                  ))}</div>
                )}
                {selectedFinding && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex justify-between gap-2"><strong className="text-slate-900">Finding detail · {selectedFinding.findingType.replace(/_/g, ' ')}</strong><button onClick={() => setSelectedFinding(null)} aria-label="Close finding detail"><X className="w-4 h-4" /></button></div>
                    {selectedFinding.documentId && <a href={fileUrl(application.id, selectedFinding.documentId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-800 underline"><ExternalLink className="w-3.5 h-3.5" /> Open associated original document {selectedFinding.evidencePage ? `(page ${selectedFinding.evidencePage})` : ''}</a>}
                    {selectedFinding.evidence && <blockquote className="border-l-2 border-blue-400 bg-white p-2 text-slate-700"><div className="text-[10px] font-bold text-slate-500">OCR excerpt{selectedFinding.evidencePage ? ` · page ${selectedFinding.evidencePage}` : ''}{selectedFinding.ocrConfidence !== null ? ` · ${selectedFinding.ocrConfidence.toFixed(1)}% confidence` : ''}</div>{selectedFinding.evidence}</blockquote>}
                    <div className="grid sm:grid-cols-2 gap-2"><div className="bg-white p-2 rounded border">Application value: <strong>{selectedFinding.applicationValue || 'Not applicable / unavailable'}</strong></div><div className="bg-white p-2 rounded border">Document value: <strong>{selectedFinding.documentValue || 'Not extracted'}</strong></div></div>
                    <p className="text-slate-700">Recommended action: {selectedFinding.recommendedAction}</p>
                    <label className="block font-semibold">Officer note (required, at least 5 characters)
                      <textarea rows={2} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 bg-white p-2 font-normal" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button disabled={busy} onClick={() => saveFindingReview('CONFIRMED')} className="px-3 py-1.5 rounded bg-orange-700 text-white font-bold disabled:opacity-50">Confirm finding</button>
                      <button disabled={busy} onClick={() => saveFindingReview('DISMISSED')} className="px-3 py-1.5 rounded bg-slate-700 text-white font-bold disabled:opacity-50">Dismiss as false positive</button>
                      <button disabled={busy} onClick={() => saveFindingReview('RESOLVED')} className="px-3 py-1.5 rounded bg-emerald-700 text-white font-bold disabled:opacity-50">Mark resolved</button>
                    </div>
                    {selectedFinding.overrideReason && <p className="text-rose-800">Override by {selectedFinding.overrideByName} · {selectedFinding.overrideReason}</p>}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">Scrutiny history</h3>
                {workbench.application.scrutinyRuns.length === 0 && workbench.application.officerDecisions.length === 0 ? <p className="mt-2 text-slate-500">No previous scrutiny or decision history.</p> : <div className="mt-2 space-y-2">
                  {workbench.application.scrutinyRuns.map((run) => <div key={run.id} className="border-l-2 border-blue-400 pl-2"><strong>Analysis run</strong> · {new Date(run.createdAt).toLocaleString()} · {run.officerName} · {run.findings.length} findings</div>)}
                  {workbench.application.officerDecisions.map((item) => <div key={item.id} className="border-l-2 border-emerald-400 pl-2"><strong>{item.decision.replace(/_/g, ' ')}</strong> · {new Date(item.createdAt).toLocaleString()} · {item.officerName} · {item.remarks}</div>)}
                </div>}
              </section>

              <form onSubmit={saveDecision} className="rounded-lg border border-slate-300 p-4 space-y-3">
                <h3 className="font-bold text-slate-900">Officer decision</h3>
                {blocking.length > 0 && <div className="flex items-center gap-2 text-rose-800"><ShieldAlert className="w-4 h-4" /> Approval blocked by unresolved material findings. Resolve, dismiss with reason, or use a permitted admin override.</div>}
                {(['APPROVE', 'REQUEST_CORRECTION', 'REJECT'] as const).map((choice) => (
                  <label key={choice} className="mr-4 inline-flex items-center gap-1.5 font-semibold"><input type="radio" name="decision" checked={decision === choice} onChange={() => setDecision(choice)} disabled={application.isDemo} />{choice.replace(/_/g, ' ')}</label>
                ))}
                {decision !== 'APPROVE' && <div className="space-y-1"><div className="font-semibold">Select supporting findings / documents *</div>{findings.filter((finding) => finding.reviewState !== 'DISMISSED').map((finding) => <label key={finding.id} className="flex items-start gap-2 text-slate-700"><input type="checkbox" checked={affectedFindingIds.includes(finding.id)} onChange={() => toggleId(affectedFindingIds, setAffectedFindingIds, finding.id)} />{finding.severity} · {finding.fieldName} — {finding.reason}</label>)}</div>}
                {canOverride && decision === 'APPROVE' && blocking.length > 0 && <div className="rounded bg-amber-50 p-3 space-y-2"><strong>System administrator blocking-finding override</strong>{blocking.map((finding) => <label key={finding.id} className="flex gap-2"><input type="checkbox" checked={overrideFindingIds.includes(finding.id)} onChange={() => toggleId(overrideFindingIds, setOverrideFindingIds, finding.id)} />Override {finding.severity}: {finding.fieldName}</label>)}{overrideFindingIds.length > 0 && <textarea required minLength={10} rows={2} value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Specific justification for each selected override (minimum 10 characters)" className="w-full rounded border border-amber-300 bg-white p-2" />}</div>}
                <label className="block font-semibold">Final remarks * (minimum 10 characters)
                  <textarea required minLength={10} maxLength={4000} rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2 font-normal" placeholder="Record the factual basis and relevant documents/findings for this decision." />
                </label>
                <div className="flex items-start gap-2 text-[10px] text-slate-500"><AlertTriangle className="w-3.5 h-3.5 mt-0.5" />An officer's decision is persisted separately from OCR. Approval advances to EVC scheduling; OCR does not approve the institution.</div>
                <div className="flex justify-end">
                  <button type="submit" disabled={busy || application.isDemo || !workbench.latestRun} className="inline-flex gap-1.5 items-center px-4 py-2 rounded bg-gov-navy-900 text-white font-bold disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />Save officer decision</button>
                </div>
              </form>
            </>
          )}
        </main>
      </section>
    </div>
  );
};
