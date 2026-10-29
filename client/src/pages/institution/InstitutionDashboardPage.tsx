import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getInstitutionApplications,
  getInstitutionDeficiencies,
  getInstitutionCompliance,
} from '../../services/institutionService';
import { Application, DeficiencyNotice, ComplianceItem } from '@saksham/shared';
import {
  Building2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Plus,
  ArrowRight,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const InstitutionDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [deficiencies, setDeficiencies] = useState<DeficiencyNotice[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [apps, defs, comp] = await Promise.all([
          getInstitutionApplications(),
          getInstitutionDeficiencies(),
          getInstitutionCompliance(),
        ]);
        setApplications(apps);
        setDeficiencies(defs);
        setComplianceItems(comp);
      } catch (err) {
        console.error('Failed to load institution dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const draftApps = applications.filter((a) => a.isDraft);
  const submittedApps = applications.filter((a) => !a.isDraft);
  const pendingDeficiencies = deficiencies.filter((d) => d.status === 'ISSUED_PENDING_RESPONSE');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-white border-2 border-[#17202B] rounded-sm p-6 shadow-[2px_2px_0px_#17202B] animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-white border-2 border-[#17202B] rounded-sm p-6 shadow-[2px_2px_0px_#17202B] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Institution Identity Banner */}
      <div className="bg-[#142B45] text-white border-2 border-[#17202B] rounded-sm p-6 sm:p-7 shadow-[3px_3px_0px_#17202B]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-sm bg-[#0A1B38] border border-[#E98232] text-[10px] font-mono font-bold text-[#E98232] mb-2 uppercase">
              <span className="w-1.5 h-1.5 rounded-none bg-[#E98232]"></span>
              <span>PID: {currentUser?.permanentInstituteId || 'PENDING ASSIGNMENT'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              {currentUser?.institutionName || 'Authorized Institution Profile'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
              Authorized Representative: <strong className="text-white">{currentUser?.fullName}</strong>. Manage AICTE Approval Process Handbook (APH 2024–27) regulatory applications, scrutiny observations, and compliance filings.
            </p>
          </div>

          <Link
            to="/institution/applications/new"
            className="flex-shrink-0 inline-flex items-center space-x-2 px-4 py-2.5 rounded-sm bg-[#E98232] hover:bg-[#D16E20] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#17202B] active:translate-x-[1px] active:translate-y-[1px] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Application</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]">
          <div className="flex items-center justify-between text-[#5B6875] mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Active In-Review</span>
            <FileText className="w-4 h-4 text-[#142B45]" />
          </div>
          <div className="text-2xl font-black text-[#17202B] font-mono">{submittedApps.length}</div>
          <div className="text-[11px] text-[#5B6875] mt-0.5 font-medium">Submitted to AICTE Scrutiny</div>
        </div>

        <div className="bg-white p-4 rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]">
          <div className="flex items-center justify-between text-[#5B6875] mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Draft Applications</span>
            <Clock className="w-4 h-4 text-[#5B6875]" />
          </div>
          <div className="text-2xl font-black text-[#17202B] font-mono">{draftApps.length}</div>
          <div className="text-[11px] text-[#5B6875] mt-0.5 font-medium">Unsubmitted institutional drafts</div>
        </div>

        <div className={`p-4 rounded-sm border-2 shadow-[2px_2px_0px_#17202B] ${
          pendingDeficiencies.length > 0 ? 'bg-[#FFF7ED] border-[#B45309]' : 'bg-white border-[#17202B]'
        }`}>
          <div className="flex items-center justify-between text-[#5B6875] mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#B45309]">Action Required</span>
            <AlertTriangle className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-black text-[#B45309] font-mono">{pendingDeficiencies.length}</div>
          <div className="text-[11px] text-[#B45309] mt-0.5 font-bold">Deficiency notices pending</div>
        </div>

        <div className="bg-white p-4 rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]">
          <div className="flex items-center justify-between text-[#5B6875] mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Compliance Filings</span>
            <ShieldCheck className="w-4 h-4 text-[#18794E]" />
          </div>
          <div className="text-2xl font-black text-[#17202B] font-mono">{complianceItems.length}</div>
          <div className="text-[11px] text-[#5B6875] mt-0.5 font-medium">Active regulatory undertakings</div>
        </div>
      </div>

      {/* Outstanding Deficiency Notices Alert Banner */}
      {pendingDeficiencies.length > 0 && (
        <div className="bg-[#FFF7ED] border-2 border-[#B45309] rounded-sm p-5 shadow-[3px_3px_0px_#B45309] space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-sm font-black text-[#B45309] uppercase tracking-wider">
                AICTE Scrutiny Deficiency Notice Issued ({pendingDeficiencies.length} pending clarification)
              </h2>
              <p className="text-xs text-[#17202B] mt-0.5 font-medium leading-relaxed">
                The regulatory scrutiny committee has identified non-compliances requiring clarification or upload of amended documentation before statutory deadlines.
              </p>
              <div className="mt-3 space-y-2">
                {pendingDeficiencies.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white p-3 rounded-sm border border-[#B45309] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-[1px_1px_0px_#B45309]"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#B45309] bg-[#FFF7ED] px-1.5 py-0.2 border border-[#B45309]">{d.noticeNumber}</span>
                        <span className="text-xs font-black text-[#17202B]">{d.title}</span>
                      </div>
                      <p className="text-[11px] text-[#5B6875] mt-1 leading-relaxed">{d.description}</p>
                    </div>
                    <Link
                      to={`/institution/applications/${d.applicationId}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-sm bg-[#142B45] hover:bg-[#0A1B38] text-white text-xs font-black uppercase tracking-wider border border-[#17202B] shadow-[1px_1px_0px_#17202B] flex-shrink-0"
                    >
                      <span>Submit Clarification &rarr;</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Applications Register + Compliance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications */}
        <div className="lg:col-span-2 bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#17202B]">
            <div>
              <h2 className="text-sm font-black text-[#142B45] uppercase tracking-wider">Institutional Applications Register</h2>
              <p className="text-xs text-[#5B6875]">Statutory processing stage and tracking timeline</p>
            </div>
            <Link
              to="/institution/applications"
              className="text-xs font-black uppercase tracking-wider text-[#142B45] hover:text-[#E98232] flex items-center space-x-1"
            >
              <span>View Full Register</span>
              <ChevronRight className="w-4 h-4 text-[#E98232]" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-[#CBD5E1] rounded-sm">
              <Building2 className="w-10 h-10 text-[#5B6875] mx-auto mb-2" />
              <h3 className="text-xs font-black uppercase text-[#17202B]">No applications created yet</h3>
              <p className="text-xs text-[#5B6875] max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                Initiate your AICTE Approval process for Extension of Approval (EoA), Intake Increase, or New Institute setup.
              </p>
              <Link
                to="/institution/applications/new"
                className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-sm bg-[#E98232] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]"
              >
                <Plus className="w-4 h-4" />
                <span>Start Application</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#CBD5E1]">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#142B45] bg-[#EAF0F5] px-1.5 py-0.2 border border-[#CBD5E1]">
                        {app.applicationNumber}
                      </span>
                      {app.isDraft ? (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-sm bg-[#FAF9F6] text-[#5B6875] border border-[#CBD5E1]">
                          Draft (Unsubmitted)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-sm bg-[#EAF0F5] text-[#142B45] border border-[#142B45]">
                          {app.currentStage.replace(/_/g, ' ')}
                        </span>
                      )}
                      {app.isDeficient && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-sm bg-[#FDF2F2] text-[#C5221F] border border-[#C5221F]">
                          Deficiency Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5B6875] mt-1.5 font-medium">
                      <span>Category: <strong className="text-[#17202B]">{app.category.replace(/_/g, ' ')}</strong></span>
                      <span className="mx-2">•</span>
                      <span>Cycle: {app.academicCycle || '2026-27'}</span>
                      <span className="mx-2">•</span>
                      <span>Intake: {app.requestedIntake} seats</span>
                    </div>
                  </div>

                  <Link
                    to={`/institution/applications/${app.id}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-[#142B45] bg-[#FAF9F6] hover:bg-white px-3 py-1.5 rounded-sm border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B] transition flex-shrink-0"
                  >
                    <span>{app.isDraft ? 'Continue Draft' : 'Track Dossier'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E98232]" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Regulatory Quick Links & Compliance */}
        <div className="space-y-5">
          {/* Statutory Handbook Guide */}
          <div className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] p-5">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#CBD5E1] mb-2.5">
              <BookOpen className="w-4 h-4 text-[#142B45]" />
              <h3 className="text-xs font-black text-[#142B45] uppercase tracking-wider">
                AICTE Regulatory Reference
              </h3>
            </div>
            <p className="text-xs text-[#5B6875] leading-relaxed mb-3 font-medium">
              All applications are scrutinised in accordance with the <strong>Approval Process Handbook (APH 2024–27)</strong>.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-sm bg-[#FAF9F6] border border-[#17202B]">
                <div className="font-bold text-[#142B45]">Chapter I: New Institutions</div>
                <div className="text-[11px] text-[#5B6875] font-mono mt-0.5">Land Title (min 30yr lease), Occupancy, Fire NOC</div>
              </div>
              <div className="p-2.5 rounded-sm bg-[#FAF9F6] border border-[#17202B]">
                <div className="font-bold text-[#142B45]">Chapter II: EoA &amp; Intake Expansion</div>
                <div className="text-[11px] text-[#5B6875] font-mono mt-0.5">NBA Accreditation (min 50% courses), Faculty Cadre</div>
              </div>
            </div>
          </div>

          {/* Compliance Undertakings */}
          <div className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] p-5">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#CBD5E1]">
              <h3 className="text-xs font-black text-[#142B45] uppercase tracking-wider">
                Active Undertakings
              </h3>
              <Link to="/institution/compliance" className="text-xs font-black uppercase text-[#B45309] hover:underline">
                View All
              </Link>
            </div>
            {complianceItems.length === 0 ? (
              <p className="text-xs text-[#5B6875] py-2 italic">No outstanding compliance undertakings.</p>
            ) : (
              <div className="space-y-2">
                {complianceItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2.5 rounded-sm bg-[#FAF9F6] border border-[#17202B]">
                    <div className="text-xs font-bold text-[#17202B]">{item.undertakingType}</div>
                    <div className="text-[11px] text-[#5B6875] font-mono mt-0.5">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
