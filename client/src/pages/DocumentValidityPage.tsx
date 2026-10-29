import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentValidityItem,
  DocumentType,
} from '@saksham/shared';
import { fetchDocumentValidityItems } from '../services/documentService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { ValidityBadge } from '../components/ui/StatusBadge';
import {
  Clock,
  Building,
  Flame,
  Award,
  Landmark,
  Search,
} from 'lucide-react';

export const DocumentValidityPage: React.FC = () => {
  const [selectedDocType, setSelectedDocType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentValidityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadDocumentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocumentValidityItems();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load document validity records from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocumentData();
  }, [loadDocumentData]);

  const filteredDocs = documents.filter((doc) => {
    const matchesType = selectedDocType === 'ALL' || doc.documentType === selectedDocType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      doc.instituteName.toLowerCase().includes(q) ||
      doc.documentIdentifier.toLowerCase().includes(q) ||
      doc.issuingAuthority.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const getDocTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'FIRE_SAFETY_NOC':
        return <Flame className="w-4 h-4 text-orange-600" />;
      case 'LAND_LEASE':
        return <Building className="w-4 h-4 text-gov-navy-700" />;
      case 'NBA_ACCREDITATION':
        return <Award className="w-4 h-4 text-blue-600" />;
      case 'BUILDING_OCCUPANCY':
        return <Building className="w-4 h-4 text-emerald-600" />;
      case 'FDR_ENDOWMENT':
        return <Landmark className="w-4 h-4 text-purple-600" />;
    }
  };

  const handleInspect = (doc: DocumentValidityItem) => {
    setNoticeMessage(`Notice: Full document certificate preview for ${doc.documentIdentifier} (${doc.documentType}) is staged for Phase 3 document repository.`);
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {noticeMessage && (
        <div className="p-3 bg-amber-100 border-2 border-[#17202B] rounded-sm text-slate-900 text-xs font-mono font-medium flex items-center justify-between shadow-[2px_2px_0px_#17202B] animate-in fade-in">
          <span>{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="font-bold underline ml-3 text-[#142B45] hover:text-[#E98232]">
            [DISMISS]
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#142B45] text-white px-2 py-0.5 rounded-sm">
              REGULATORY RADAR
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
              APH LIFECYCLE AUDITING
            </span>
          </div>
          <h3 className="font-mono font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#142B45]" />
            Statutory Document Expiry & Land Lease Validity Auditing
          </h3>
          <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
            Continuous compliance monitoring for mandatory institutional instruments. Per AICTE APH norms, land leases must maintain valid tenure &ge; 30 years, and Fire NOCs require perpetual active certification.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2.5 py-1 rounded-sm bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs">
            180d Early Warning
          </span>
          <span className="px-2.5 py-1 rounded-sm bg-rose-100 text-rose-900 border border-rose-300 font-mono font-bold text-xs">
            90d Critical Escalation
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border-2 border-[#17202B] rounded-sm p-3 shadow-[2px_2px_0px_#17202B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'ALL', label: `ALL INSTRUMENTS (${documents.length})` },
            { id: 'LAND_LEASE', label: 'LAND LEASES' },
            { id: 'FIRE_SAFETY_NOC', label: 'FIRE NOCS' },
            { id: 'NBA_ACCREDITATION', label: 'NBA ACCREDITATIONS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDocType(tab.id)}
              className={`px-3 py-1.5 rounded-sm font-mono text-xs font-bold uppercase transition-all ${
                selectedDocType === tab.id
                  ? 'bg-[#142B45] text-white border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B]'
                  : 'bg-[#FAF9F6] text-slate-700 border border-[#17202B] hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search document ID, institute..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono border-2 border-[#17202B] rounded-sm py-1.5 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-[#142B45] bg-[#FAF9F6] focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live document instruments from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadDocumentData} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          message="No statutory documents match the specified filter or query."
        />
      ) : (
        <div className="bg-white border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document Type & Identifier</th>
                  <th>Institution Name</th>
                  <th>Issuing Authority</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Days to Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center space-x-2">
                        {getDocTypeIcon(doc.documentType)}
                        <span className="font-bold font-mono text-xs text-slate-900 uppercase">
                          {doc.documentType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-[#142B45] font-semibold mt-0.5">
                        {doc.documentIdentifier}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-900 max-w-[220px] truncate">
                        {doc.instituteName}
                      </div>
                    </td>
                    <td className="text-xs text-slate-600 max-w-[180px] truncate">
                      {doc.issuingAuthority}
                    </td>
                    <td className="text-xs font-mono text-slate-700">
                      {new Date(doc.issueDate).toLocaleDateString()}
                    </td>
                    <td className="text-xs font-mono font-bold text-slate-900">
                      {new Date(doc.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-sm border ${
                          doc.daysToExpiry < 0
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : doc.daysToExpiry <= 60
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        }`}
                      >
                        {doc.daysToExpiry < 0
                          ? `Expired (${Math.abs(doc.daysToExpiry)}d)`
                          : `${doc.daysToExpiry} Days`}
                      </span>
                    </td>
                    <td>
                      <ValidityBadge status={doc.validityStatus} days={doc.daysToExpiry} />
                    </td>
                    <td>
                      <button
                        onClick={() => handleInspect(doc)}
                        className="px-2.5 py-1 text-xs font-mono font-bold text-[#142B45] bg-[#FAF9F6] hover:bg-slate-200 rounded-sm border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B] uppercase"
                      >
                        Inspect
                      </button>
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
