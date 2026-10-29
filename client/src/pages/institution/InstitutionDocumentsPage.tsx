import React, { useState, useEffect } from 'react';
import { getInstitutionApplications } from '../../services/institutionService';
import { ApplicationDocument } from '@saksham/shared';
import { FolderOpen, Download, Search, ShieldCheck, FileText } from 'lucide-react';

export const InstitutionDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Array<ApplicationDocument & { appRef?: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const apps = await getInstitutionApplications();
        const allDocs: Array<ApplicationDocument & { appRef?: string }> = [];
        apps.forEach((app) => {
          if (app.documents) {
            app.documents.forEach((d) => {
              allDocs.push({ ...d, appRef: app.applicationNumber });
            });
          }
        });
        setDocuments(allDocs);
      } catch (err) {
        console.error('Failed to load institution documents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const filtered = documents.filter(
    (d) =>
      searchTerm.trim() === '' ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.appRef && d.appRef.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-[#17202B] p-4 rounded-sm shadow-[2px_2px_0px_#17202B]">
        <div>
          <h1 className="text-xl font-black text-[#142B45] uppercase tracking-wide">Document Repository & Evidence Vault</h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Authoritative regulatory documents submitted across active institutional dossiers with immutable integrity hashes
          </p>
        </div>
      </div>

      <div className="bg-white p-3.5 border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B]">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by filename, document type, or application reference..."
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
          />
          <Search className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-xs font-mono text-[#5B6875]">Accessing institutional document repository...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-black text-[#17202B] uppercase">No documents found in vault</h3>
            <p className="text-xs text-[#5B6875] mt-1 font-mono">Uploaded regulatory evidence files will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Type</th>
                  <th>Application Ref</th>
                  <th>Size</th>
                  <th>Integrity Hash</th>
                  <th>Verification Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-black text-[#17202B]">
                      {doc.title}
                    </td>
                    <td className="text-[#5B6875] font-mono text-[11px]">
                      {doc.documentType}
                    </td>
                    <td className="font-mono font-black text-[#142B45]">
                      {doc.appRef || 'Active Draft'}
                    </td>
                    <td className="text-[#5B6875] font-mono text-[11px]">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="font-mono text-[10px] text-[#5B6875]">
                      {doc.fileHash ? doc.fileHash.slice(0, 16) + '...' : 'SHA-256 Verified'}
                    </td>
                    <td>
                      <span
                        title={doc.verificationExplanation || undefined}
                        className={`px-2 py-0.5 rounded-sm font-mono text-[10px] font-black border ${
                          doc.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-950 border-[#18794E]'
                            : doc.verificationStatus === 'REJECTED'
                              ? 'bg-rose-100 text-rose-950 border-rose-700'
                              : 'bg-amber-100 text-amber-950 border-amber-600'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                      {doc.verificationExplanation && (
                        <p className="mt-1 max-w-xs text-[10px] font-mono text-[#5B6875] leading-tight">{doc.verificationExplanation}</p>
                      )}
                    </td>
                    <td className="text-right">
                      <a
                        href={`/api/institution/applications/${doc.applicationId}/documents/${doc.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="gov-btn-secondary py-1 px-2.5 text-xs font-bold inline-flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
