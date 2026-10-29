import React, { useState, useEffect } from 'react';
import { getInstitutionCompliance, submitComplianceEvidence } from '../../services/institutionService';
import { ComplianceItem } from '@saksham/shared';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';

export const InstitutionCompliancePage: React.FC = () => {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<ComplianceItem | null>(null);
  const [documentRef, setDocumentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCompliance = async () => {
    setIsLoading(true);
    try {
      const data = await getInstitutionCompliance();
      setItems(data);
    } catch (err) {
      console.error('Failed to load compliance items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  const handleOpenModal = (item: ComplianceItem) => {
    setActiveItem(item);
    setDocumentRef(item.submittedDocumentRef || '');
    setSuccessMsg(null);
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !documentRef.trim()) return;

    setIsSubmitting(true);
    try {
      await submitComplianceEvidence(activeItem.id, documentRef.trim());
      setSuccessMsg('Compliance evidence submitted successfully. Awaiting scrutiny verification.');
      await fetchCompliance();
      setTimeout(() => {
        setActiveItem(null);
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit evidence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-[#17202B] p-4 rounded-sm shadow-[2px_2px_0px_#17202B]">
        <div>
          <h1 className="text-xl font-black text-[#142B45] uppercase tracking-wide">Statutory Compliance & Legal Undertakings</h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Conditional undertakings, time-bound NOC covenants, and legal verifications registered against AICTE institutional approvals
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-xs font-mono text-[#5B6875]">Accessing institutional statutory undertakings...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-[#18794E] mx-auto mb-2" />
            <h3 className="text-sm font-black text-[#17202B] uppercase">Zero Outstanding Conditions</h3>
            <p className="text-xs text-[#5B6875] mt-1 font-mono">Your institution currently maintains clean statutory standing with zero pending conditions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Undertaking Type & Description</th>
                  <th>Application Ref</th>
                  <th>Statutory Due Date</th>
                  <th>Compliance Status</th>
                  <th>Evidence Reference</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-black text-[#17202B] uppercase text-xs">{item.undertakingType}</div>
                      <div className="text-[11px] text-[#5B6875] font-mono mt-0.5 max-w-sm line-clamp-1">
                        {item.description}
                      </div>
                    </td>
                    <td className="font-mono font-black text-[#142B45]">
                      {item.applicationNumber}
                    </td>
                    <td>
                      <div className="font-mono font-bold text-[#17202B]">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </div>
                      {item.isOverdue && (
                        <span className="text-[10px] font-mono font-black text-rose-950 bg-rose-100 px-1.5 py-0.5 rounded-sm border border-rose-600 mt-1 inline-block uppercase">
                          OVERDUE ({item.daysRemaining} DAYS)
                        </span>
                      )}
                    </td>
                    <td>
                      {item.status === 'VERIFIED_SATISFACTORY' ? (
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-black border border-[#18794E] bg-emerald-100 text-emerald-950 uppercase">
                          Verified Satisfactory
                        </span>
                      ) : item.status === 'UNDER_REVIEW' ? (
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-black border border-[#142B45] bg-[#EAF0F5] text-[#142B45] uppercase">
                          Evidence Under Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-black border border-amber-600 bg-amber-100 text-amber-950 uppercase">
                          Pending Submission
                        </span>
                      )}
                    </td>
                    <td className="text-[#5B6875] font-mono text-[11px]">
                      {item.submittedDocumentRef || '—'}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="gov-btn-primary py-1 px-3 text-xs font-bold"
                      >
                        {item.submittedDocumentRef ? 'Update Evidence' : 'Submit Evidence'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Evidence Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-[#17202B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6 shadow-[4px_4px_0px_#17202B] border-2 border-[#17202B] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-[#17202B]">
              <h3 className="text-sm font-black text-[#142B45] uppercase tracking-wide">
                Submit Compliance Evidence
              </h3>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="text-[#5B6875] hover:text-[#17202B] p-1 border border-transparent hover:border-[#17202B] rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-50 border-2 border-[#18794E] rounded-sm text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#18794E] mx-auto" />
                <div className="text-xs font-black text-emerald-950 uppercase">{successMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitEvidence} className="space-y-4">
                <div className="p-3 bg-[#FAF9F6] rounded-sm text-xs border-2 border-[#17202B]">
                  <div className="font-black text-[#17202B] uppercase">{activeItem.undertakingType}</div>
                  <p className="text-[#5B6875] font-mono mt-1 text-[11px] leading-relaxed">{activeItem.description}</p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                    Document Filename / Verified Storage Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="e.g. Fire_Safety_NOC_Renewal_2026.pdf"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
                  />
                  <p className="text-[10px] font-mono text-[#5B6875] mt-1">
                    Enter the name or reference of the registered certificate addressing this undertaking.
                  </p>
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t border-slate-300">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="gov-btn-secondary py-1.5 px-4 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !documentRef.trim()}
                    className="gov-btn-primary py-1.5 px-4 text-xs font-bold disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>{isSubmitting ? 'Submitting...' : 'Commit Evidence'}</span>
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
