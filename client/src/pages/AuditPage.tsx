import React, { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry } from '@saksham/shared';
import { fetchAuditLogs } from '../services/auditService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import {
  Lock,
  Search,
  ArrowRight,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs({ limit: 100 });
      setAuditLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesEntity = selectedEntity === 'ALL' || log.entityType === selectedEntity;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      log.actionTitle.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q);
    return matchesEntity && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Integrity Notice */}
      <div className="bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#142B45] text-white px-2 py-0.5 rounded-sm">
              FORENSIC LEDGER
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
              TAMPER-EVIDENT REGULATORY AUDIT
            </span>
          </div>
          <h3 className="font-mono font-bold text-slate-900 text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#142B45]" />
            Immutable Forensic Regulatory Audit Trail
          </h3>
          <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
            Every administrative intervention, checklist evaluation, committee dispatch, and stage progression is cryptographically signed and stored in append-only audit structures.
          </p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border-2 border-[#17202B] rounded-sm font-mono font-bold text-xs uppercase shadow-[1px_1px_0px_#17202B]">
            Tamper-Evident Active
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-[#17202B] rounded-sm p-3 shadow-[2px_2px_0px_#17202B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="font-mono font-bold text-slate-700 uppercase">FILTER ENTITY:</span>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="border-2 border-[#17202B] rounded-sm py-1.5 px-2.5 font-mono text-xs font-bold bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#142B45]"
          >
            <option value="ALL">All Entities ({auditLogs.length})</option>
            <option value="APPLICATION">Application</option>
            <option value="EVC">EVC Inspection</option>
            <option value="COMPLIANCE">Compliance Item</option>
            <option value="RULE">Regulatory Rule</option>
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search action code, actor, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono border-2 border-[#17202B] rounded-sm py-1.5 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-[#142B45] bg-[#FAF9F6] focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live tamper-evident audit ledger from PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAuditData} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No Audit Logs Found"
          message="No audit trail entries match your specified filter criteria."
        />
      ) : (
        <div className="bg-white border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp & IP</th>
                  <th>Authorized Actor</th>
                  <th>Action Code & Title</th>
                  <th>Entity Affected</th>
                  <th>Details & Rationale</th>
                  <th>State Transition</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] font-mono text-slate-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        IP: {log.ipAddressMasked}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[11px] text-[#142B45] font-mono font-semibold">
                        {log.actorRole.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm bg-[#FAF9F6] border border-[#17202B] text-slate-800 block w-max mb-1">
                        {log.actionCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{log.actionTitle}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-[#142B45]">
                        {log.entityId}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 uppercase block font-semibold">{log.entityType}</span>
                    </td>
                    <td className="text-xs text-slate-700 max-w-[300px] leading-relaxed">
                      {log.details}
                    </td>
                    <td>
                      {log.previousState && log.newState ? (
                        <div className="text-[11px] font-mono space-y-1">
                          <span className="text-slate-400 line-through block truncate max-w-[150px]">
                            {log.previousState}
                          </span>
                          <span className="text-emerald-800 font-bold block flex items-center gap-1 truncate max-w-[150px]">
                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            {log.newState}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
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
