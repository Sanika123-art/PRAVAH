import React, { useState, useEffect, useCallback } from 'react';
import { RegulatoryRule } from '@saksham/shared';
import { fetchRegulatoryRules } from '../services/rulesService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AdminRulesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRulesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRegulatoryRules();
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load regulatory rules from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRulesData();
  }, [loadRulesData]);

  const filteredRules = rules.filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.applicationCategory === selectedCategory;
    const matchesVer = selectedVerification === 'ALL' || r.verificationStatus === selectedVerification;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      r.ruleCode.toLowerCase().includes(q) ||
      r.requirementTitle.toLowerCase().includes(q) ||
      r.sourceTitle.toLowerCase().includes(q) ||
      r.chapterSectionPage.toLowerCase().includes(q);
    return matchesCat && matchesVer && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Statutory Register Banner */}
      <div className="bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#142B45] text-white px-2 py-0.5 rounded-sm">
              REGULATORY REGISTER
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
              VERSIONED STATUTORY CITATIONS & SLAs
            </span>
          </div>
          <h3 className="font-mono font-bold text-slate-900 text-base flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#142B45]" />
            Regulatory Rules Engine & Versioned Statutory Register
          </h3>
          <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
            Official citations derived directly from the AICTE Approval Process Handbook (APH) 2024–25 to 2026–27. Business rules, turnaround SLAs, and escalation thresholds are dynamically parameter-controlled to eliminate hard-coded unverified regulatory assumptions. PRAVAH assists the approval workflow and does not independently grant statutory approvals.
          </p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="px-3 py-1 bg-[#142B45] text-white border-2 border-[#17202B] rounded-sm font-mono font-bold text-xs uppercase shadow-[1px_1px_0px_#17202B]">
            APH 2024–27 Edition
          </span>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white border-2 border-[#17202B] rounded-sm p-3 shadow-[2px_2px_0px_#17202B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border-2 border-[#17202B] rounded-sm py-1.5 px-2.5 font-mono text-xs font-bold bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#142B45]"
          >
            <option value="ALL">All Application Categories</option>
            <option value="NEW_INSTITUTE">New Technical Institution</option>
            <option value="EOA_EXISTING">Extension of Approval (EoA)</option>
            <option value="INTAKE_INCREASE">Increase in Approved Intake</option>
            <option value="SUPERNUMERARY_SEATS">Supernumerary Seats</option>
            <option value="CHANGE_OF_SITE">Change of Site</option>
          </select>

          <select
            value={selectedVerification}
            onChange={(e) => setSelectedVerification(e.target.value)}
            className="border-2 border-[#17202B] rounded-sm py-1.5 px-2.5 font-mono text-xs font-bold bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#142B45]"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="VERIFIED">Verified (Official Published Handbook)</option>
            <option value="PENDING_VERIFICATION">Pending Verification (Unverified Draft)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search rule code or citation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono border-2 border-[#17202B] rounded-sm py-1.5 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-[#142B45] bg-[#FAF9F6] focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading regulatory rules and verification matrices from PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRulesData} />
      ) : filteredRules.length === 0 ? (
        <EmptyState
          title="No Rules Found"
          message="No regulatory rules match the specified category or query."
        />
      ) : (
        <div className="bg-white border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rule Code</th>
                  <th>Application Category</th>
                  <th>Requirement or Transition</th>
                  <th>Responsible Role</th>
                  <th>Statutory Citation (APH)</th>
                  <th>SLA & Escalation</th>
                  <th>Verification Status</th>
                  <th>Operational Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-xs font-bold text-[#142B45]">
                      {rule.ruleCode}
                    </td>
                    <td className="text-xs font-medium text-slate-900 font-mono">
                      {rule.applicationCategory.replace(/_/g, ' ')}
                    </td>
                    <td>
                      <div className="font-bold text-xs text-slate-900">{rule.requirementTitle}</div>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-sm bg-[#FAF9F6] border border-[#17202B] text-slate-800">
                        {rule.responsibleRole.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-900">{rule.sourceTitle}</div>
                      <div className="text-[11px] text-[#142B45] font-mono font-bold mt-0.5">
                        {rule.chapterSectionPage}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Ver: {rule.sourceVersion}</div>
                    </td>
                    <td>
                      <div className="text-xs font-mono font-bold text-slate-900">SLA: {rule.slaDays}d</div>
                      <div className="text-[11px] font-mono text-slate-600">Alert: {rule.escalationIntervalDays}d</div>
                    </td>
                    <td>
                      {rule.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-slate-700 max-w-[240px] leading-relaxed">
                      {rule.notes}
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
