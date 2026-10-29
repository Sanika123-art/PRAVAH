import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application, DashboardMetrics, AuditLogEntry, Region } from '@saksham/shared';
import { fetchDashboardMetrics } from '../services/metricsService';
import { fetchApplications } from '../services/applicationService';
import { fetchAuditLogs } from '../services/auditService';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { StatCard } from '../components/ui/StatCard';
import { StageBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { ApplicationDetailDrawer } from '../components/ui/ApplicationDetailDrawer';
import {
  FileText,
  Clock,
  GitPullRequest,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  Building,
  ArrowRight,
  BookOpen,
  Scale,
  Sparkles,
} from 'lucide-react';
import { StatutoryCalendarStepper } from '../components/features/StatutoryCalendarStepper';
import { RegionalJurisdictionHub } from '../components/features/RegionalJurisdictionHub';
import { ScrutinyEvaluationModal } from '../components/features/ScrutinyEvaluationModal';
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>('ALL');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [evaluatingApplication, setEvaluatingApplication] = useState<Application | null>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canViewAudit = currentUser?.role === 'MEMBER_SECRETARY' || currentUser?.role === 'SYSTEM_ADMIN';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, appsRes, auditLogs] = await Promise.all([
        fetchDashboardMetrics(),
        fetchApplications({ limit: 100 }),
        canViewAudit ? fetchAuditLogs({ limit: 4 }).catch(() => []) : Promise.resolve([]),
      ]);
      setMetrics(metricsData);
      setApplications(appsRes.data);
      setRecentAuditLogs(auditLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to PRAVAH PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, [canViewAudit]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.instituteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage =
        selectedStageFilter === 'ALL' ||
        (selectedStageFilter === 'SCRUTINY' && (app.currentStage === 'SCRUTINY' || app.currentStage === 'RE_SCRUTINY')) ||
        (selectedStageFilter === 'EVC' && (app.currentStage === 'EVC_SCHEDULED' || app.currentStage === 'EVC_COMPLETED')) ||
        (selectedStageFilter === 'OVERDUE' && (app.priority === 'CRITICAL_OVERDUE' || app.stageAgeingDays > 7)) ||
        app.currentStage === selectedStageFilter;

      const matchesRegion = selectedRegion === 'ALL' || app.region === selectedRegion;

      return matchesSearch && matchesStage && matchesRegion;
    });
  }, [applications, searchQuery, selectedStageFilter, selectedRegion]);

  const safeMetrics: DashboardMetrics = metrics || {
    totalApplications: 0,
    stageDistribution: {
      SUBMITTED: 0,
      SCRUTINY: 0,
      RE_SCRUTINY: 0,
      EVC_SCHEDULED: 0,
      EVC_COMPLETED: 0,
      SHC_HEARING: 0,
      SAC_APPEAL: 0,
      APPROVED_CONDITIONAL: 0,
      APPROVAL_GRANTED: 0,
      REJECTED: 0,
    },
    categoryDistribution: {
      NEW_INSTITUTE: 0,
      EOA_EXISTING: 0,
      INTAKE_INCREASE: 0,
      SUPERNUMERARY_SEATS: 0,
      CHANGE_OF_SITE: 0,
      WOMEN_TO_COED: 0,
      CLOSURE: 0,
    },
    pendingScrutinyCount: 0,
    overdueTasksCount: 0,
    evcScheduledCount: 0,
    evcOverdueReportsCount: 0,
    complianceDueSoonCount: 0,
    complianceOverdueCount: 0,
    documentValidityExpiringSoonCount: 0,
    documentValidityExpiredCount: 0,
    averageAgeingDays: 0,
    criticalAlertCount: 0,
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-150">
      {error && (
        <ErrorState message={error} onRetry={loadDashboardData} />
      )}

      {/* 1. Official Government Hero Banner */}
      <div className="relative overflow-hidden rounded-sm bg-[#142B45] text-white p-6 sm:p-7 shadow-[3px_3px_0px_#17202B] border-2 border-[#17202B]">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-sm bg-[#E98232] text-white border border-[#17202B] text-xs font-mono font-black uppercase tracking-wider shadow-[1px_1px_0px_#17202B]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>AICTE Statutory Approval Cycle 2026–2027</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-white leading-tight">
            Integrated AICTE Approval Workflow Automation & Compliance System
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono max-w-3xl">
            National Regulatory Oversight Portal (SIH Problem Statement 26262 • Team Bit2Bramha). Authoritative regulatory case management for AICTE Scrutiny Officers, Regional Directors, and Expert Visit Committees across 7 Regional Jurisdictions.
          </p>

          {/* Quick CTA Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/workflow-queue')}
              className="gov-btn-saffron py-2 px-4 text-xs font-black shadow-[2px_2px_0px_#17202B]"
            >
              <span>Access Scrutiny Queue</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>

            <button
              onClick={() => navigate('/applications')}
              className="gov-btn-secondary py-2 px-4 text-xs font-bold"
            >
              <FileText className="w-4 h-4 text-[#142B45] mr-1.5" />
              <span>Applications Master Register</span>
            </button>

            <a
              href="https://www.aicte.gov.in/sites/default/files/approval/APH%20Final.pdf"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-sm text-xs font-mono font-bold border border-white/40 flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>APH 2024–27 Handbook (PDF)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Quick Access Services Grid */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-black uppercase tracking-wider text-white bg-[#142B45] px-2.5 py-1 rounded-sm border border-[#17202B]">
            QUICK ACCESS DESKS
          </span>
          <h2 className="text-xs font-bold font-mono text-[#5B6875] uppercase tracking-wider">
            Core Statutory Workflow Processing Centers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Scrutiny */}
          <div
            onClick={() => navigate('/workflow-queue')}
            className="group cursor-pointer rounded-sm bg-[#FAF9F6] hover:bg-white p-4 shadow-[2px_2px_0px_#17202B] border-2 border-[#17202B] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-sm bg-[#142B45] text-white flex items-center justify-center mb-2.5 border border-[#17202B]">
                <GitPullRequest className="w-4 h-4 text-[#E98232]" />
              </div>
              <h3 className="font-black text-xs text-[#142B45] uppercase tracking-wide group-hover:text-[#E98232] transition">
                Scrutiny & Deficiency Desk
              </h3>
              <p className="text-[11px] text-[#5B6875] font-mono mt-1 leading-relaxed">
                Verify institutional compliance against APH Chapter I/II/III norms. 7-day SLA monitoring.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-300 flex items-center justify-between text-xs text-[#142B45] font-mono font-bold">
              <span>{safeMetrics.pendingScrutinyCount} Files in Queue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#E98232]" />
            </div>
          </div>

          {/* Card 2: EVC Inspections */}
          <div
            onClick={() => navigate('/evc')}
            className="group cursor-pointer rounded-sm bg-[#FAF9F6] hover:bg-white p-4 shadow-[2px_2px_0px_#17202B] border-2 border-[#17202B] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-sm bg-[#142B45] text-white flex items-center justify-center mb-2.5 border border-[#17202B]">
                <Users className="w-4 h-4 text-cyan-300" />
              </div>
              <h3 className="font-black text-xs text-[#142B45] uppercase tracking-wide group-hover:text-cyan-700 transition">
                EVC Committee Logistics
              </h3>
              <p className="text-[11px] text-[#5B6875] font-mono mt-1 leading-relaxed">
                Constitute 3-member expert visit committees and enforce 48-hour statutory report upload deadline.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-300 flex items-center justify-between text-xs text-[#142B45] font-mono font-bold">
              <span>{safeMetrics.evcScheduledCount} Active Inspections</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-700" />
            </div>
          </div>

          {/* Card 3: Compliance & Undertakings */}
          <div
            onClick={() => navigate('/compliance')}
            className="group cursor-pointer rounded-sm bg-[#FAF9F6] hover:bg-white p-4 shadow-[2px_2px_0px_#17202B] border-2 border-[#17202B] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-sm bg-[#142B45] text-white flex items-center justify-center mb-2.5 border border-[#17202B]">
                <ShieldCheck className="w-4 h-4 text-[#18794E]" />
              </div>
              <h3 className="font-black text-xs text-[#142B45] uppercase tracking-wide group-hover:text-[#18794E] transition">
                Institutional Undertakings
              </h3>
              <p className="text-[11px] text-[#5B6875] font-mono mt-1 leading-relaxed">
                Track time-bound conditional approvals (30, 60, 90-day grace) with automated multi-tier show-cause notices.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-300 flex items-center justify-between text-xs text-[#142B45] font-mono font-bold">
              <span>{safeMetrics.complianceDueSoonCount} Due Soon</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#18794E]" />
            </div>
          </div>

          {/* Card 4: Document Validity */}
          <div
            onClick={() => navigate('/document-validity')}
            className="group cursor-pointer rounded-sm bg-[#FAF9F6] hover:bg-white p-4 shadow-[2px_2px_0px_#17202B] border-2 border-[#17202B] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-sm bg-[#142B45] text-white flex items-center justify-center mb-2.5 border border-[#17202B]">
                <Clock className="w-4 h-4 text-rose-300" />
              </div>
              <h3 className="font-black text-xs text-[#142B45] uppercase tracking-wide group-hover:text-rose-700 transition">
                Statutory Document Validity
              </h3>
              <p className="text-[11px] text-[#5B6875] font-mono mt-1 leading-relaxed">
                Automated expiry tracking for 30-year land leases, fire NOCs, and NBA accreditations.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-300 flex items-center justify-between text-xs text-[#142B45] font-mono font-bold">
              <span>{safeMetrics.documentValidityExpiredCount} Lapsed / Overdue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-rose-700" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Supreme Court Statutory Approval Process Calendar Stepper */}
      <StatutoryCalendarStepper />

      {/* 4. Statutory SLA Escalation Strip */}
      {safeMetrics.criticalAlertCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-800 rounded-sm p-4 shadow-[2px_2px_0px_#b45309] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-200 border border-amber-700 rounded-sm text-amber-950 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <span className="font-black text-amber-950 uppercase tracking-wide">
                Statutory Pendency Escalation Advisory:
              </span>{' '}
              <span className="text-amber-950 font-mono leading-relaxed">
                {safeMetrics.overdueTasksCount} overdue scrutiny tasks, {safeMetrics.evcOverdueReportsCount} overdue EVC report(s), and {safeMetrics.documentValidityExpiredCount} expired statutory document(s) require intervention.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedStageFilter('OVERDUE')}
            className="gov-btn-destructive py-1.5 px-3.5 text-xs font-bold whitespace-nowrap"
          >
            Filter Overdue Queue
          </button>
        </div>
      )}

      {/* 4. Stage Progression & Workload Pipeline Strip */}
      <div className="bg-white rounded-sm border-2 border-[#17202B] p-5 shadow-[2px_2px_0px_#17202B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#17202B] mb-4 gap-2">
          <div>
            <h3 className="text-xs font-black text-[#142B45] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#142B45]" />
              Stage-Wise Application Pipeline & Workload Breakdown
            </h3>
            <p className="text-[11px] text-[#5B6875] font-mono mt-0.5">
              Real-time distribution of institutional applications across statutory evaluation milestones (APH 2024–27)
            </p>
          </div>
          <button
            onClick={() => navigate('/workflow-queue')}
            className="text-xs text-[#142B45] font-bold hover:underline flex items-center gap-1 self-start sm:self-auto font-mono"
          >
            <span>Stage Pendency Engine</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#E98232]" />
          </button>
        </div>

        {/* Stage Progress Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div
            onClick={() => setSelectedStageFilter('SUBMITTED')}
            className={`p-3 rounded-sm border-2 transition-all cursor-pointer ${
              selectedStageFilter === 'SUBMITTED' ? 'border-[#17202B] bg-[#142B45] text-white shadow-[2px_2px_0px_#17202B]' : 'border-[#17202B] hover:bg-[#FAF9F6] bg-white'
            }`}
          >
            <span className={`text-[10px] font-mono font-bold block uppercase ${selectedStageFilter === 'SUBMITTED' ? 'text-slate-300' : 'text-[#5B6875]'}`}>1. Ingestion</span>
            <span className="text-xl font-mono font-black block mt-0.5">{safeMetrics.stageDistribution.SUBMITTED}</span>
            <span className={`text-[10px] font-mono ${selectedStageFilter === 'SUBMITTED' ? 'text-slate-300' : 'text-[#5B6875]'}`}>Submitted</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('SCRUTINY')}
            className={`p-3 rounded-sm border-2 transition-all cursor-pointer ${
              selectedStageFilter === 'SCRUTINY' ? 'border-[#17202B] bg-[#142B45] text-white shadow-[2px_2px_0px_#17202B]' : 'border-[#17202B] hover:bg-[#FAF9F6] bg-white'
            }`}
          >
            <span className={`text-[10px] font-mono font-bold block uppercase ${selectedStageFilter === 'SCRUTINY' ? 'text-slate-300' : 'text-[#5B6875]'}`}>2. Scrutiny</span>
            <span className="text-xl font-mono font-black block mt-0.5">{safeMetrics.stageDistribution.SCRUTINY}</span>
            <span className={`text-[10px] font-mono ${selectedStageFilter === 'SCRUTINY' ? 'text-slate-300' : 'text-[#5B6875]'}`}>Initial Docs</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('RE_SCRUTINY')}
            className={`p-3 rounded-sm border-2 transition-all cursor-pointer ${
              selectedStageFilter === 'RE_SCRUTINY' ? 'border-[#17202B] bg-[#142B45] text-white shadow-[2px_2px_0px_#17202B]' : 'border-[#17202B] hover:bg-[#FAF9F6] bg-white'
            }`}
          >
            <span className={`text-[10px] font-mono font-bold block uppercase ${selectedStageFilter === 'RE_SCRUTINY' ? 'text-slate-300' : 'text-[#5B6875]'}`}>3. Re-Scrutiny</span>
            <span className="text-xl font-mono font-black block mt-0.5">{safeMetrics.stageDistribution.RE_SCRUTINY}</span>
            <span className={`text-[10px] font-mono ${selectedStageFilter === 'RE_SCRUTINY' ? 'text-slate-300' : 'text-[#5B6875]'}`}>Rectifications</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('EVC')}
            className={`p-3 rounded-sm border-2 transition-all cursor-pointer ${
              selectedStageFilter === 'EVC' ? 'border-[#17202B] bg-[#142B45] text-white shadow-[2px_2px_0px_#17202B]' : 'border-[#17202B] hover:bg-[#FAF9F6] bg-white'
            }`}
          >
            <span className={`text-[10px] font-mono font-bold block uppercase ${selectedStageFilter === 'EVC' ? 'text-slate-300' : 'text-[#5B6875]'}`}>4. EVC Visits</span>
            <span className="text-xl font-mono font-black block mt-0.5">
              {safeMetrics.stageDistribution.EVC_SCHEDULED + safeMetrics.stageDistribution.EVC_COMPLETED}
            </span>
            <span className={`text-[10px] font-mono ${selectedStageFilter === 'EVC' ? 'text-slate-300' : 'text-[#5B6875]'}`}>Inspections</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('SHC_HEARING')}
            className={`p-3 rounded-sm border-2 transition-all cursor-pointer ${
              selectedStageFilter === 'SHC_HEARING' ? 'border-[#17202B] bg-[#142B45] text-white shadow-[2px_2px_0px_#17202B]' : 'border-[#17202B] hover:bg-[#FAF9F6] bg-white'
            }`}
          >
            <span className={`text-[10px] font-mono font-bold block uppercase ${selectedStageFilter === 'SHC_HEARING' ? 'text-slate-300' : 'text-[#5B6875]'}`}>5. Hearing (SHC)</span>
            <span className="text-xl font-mono font-black block mt-0.5">{safeMetrics.stageDistribution.SHC_HEARING}</span>
            <span className={`text-[10px] font-mono ${selectedStageFilter === 'SHC_HEARING' ? 'text-slate-300' : 'text-[#5B6875]'}`}>Contested</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('SAC_APPEAL')}
            className={`p-3 rounded-sm border-2 transition-all cursor-pointer ${
              selectedStageFilter === 'SAC_APPEAL' ? 'border-[#17202B] bg-[#142B45] text-white shadow-[2px_2px_0px_#17202B]' : 'border-[#17202B] hover:bg-[#FAF9F6] bg-white'
            }`}
          >
            <span className={`text-[10px] font-mono font-bold block uppercase ${selectedStageFilter === 'SAC_APPEAL' ? 'text-slate-300' : 'text-[#5B6875]'}`}>6. Appeals (SAC)</span>
            <span className="text-xl font-mono font-black block mt-0.5">{safeMetrics.stageDistribution.SAC_APPEAL}</span>
            <span className={`text-[10px] font-mono ${selectedStageFilter === 'SAC_APPEAL' ? 'text-slate-300' : 'text-[#5B6875]'}`}>Statutory Bench</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('APPROVED_CONDITIONAL')}
            className={`p-3 rounded-sm border-2 transition-all cursor-pointer ${
              selectedStageFilter === 'APPROVED_CONDITIONAL' ? 'border-[#17202B] bg-[#142B45] text-white shadow-[2px_2px_0px_#17202B]' : 'border-[#17202B] hover:bg-[#FAF9F6] bg-white'
            }`}
          >
            <span className={`text-[10px] font-mono font-bold block uppercase ${selectedStageFilter === 'APPROVED_CONDITIONAL' ? 'text-slate-300' : 'text-[#5B6875]'}`}>7. Approvals</span>
            <span className="text-xl font-mono font-black block mt-0.5">
              {safeMetrics.stageDistribution.APPROVED_CONDITIONAL + safeMetrics.stageDistribution.APPROVAL_GRANTED}
            </span>
            <span className={`text-[10px] font-mono ${selectedStageFilter === 'APPROVED_CONDITIONAL' ? 'text-slate-300' : 'text-[#5B6875]'}`}>Conditional / Full</span>
          </div>
        </div>
      </div>

      {/* 5. AICTE Regional Jurisdictions Hub (Interactive 8 Regional Offices) */}
      <RegionalJurisdictionHub
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        applications={applications}
      />

      {/* 6. Main Dual Operational Workload Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column (3 Cols): Expanded Full-Width Workload Register Table */}
        <div className="xl:col-span-3 bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] flex flex-col">
          {/* Table Header Controls */}
          <div className="p-4 border-b-2 border-[#17202B] space-y-3 bg-[#FAF9F6]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[#142B45] uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#142B45]" />
                  Active Applications Master Workload Register
                </h3>
                <p className="text-xs text-[#5B6875] font-mono">
                  Showing {filteredApplications.length} of {safeMetrics.totalApplications} records in active processing
                </p>
              </div>
              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                <button
                  onClick={() => setSelectedStageFilter('ALL')}
                  className={`px-2.5 py-1 rounded-sm text-xs font-mono font-black uppercase border-2 transition ${
                    selectedStageFilter === 'ALL'
                      ? 'bg-[#142B45] text-white border-[#17202B]'
                      : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
                  }`}
                >
                  All ({safeMetrics.totalApplications})
                </button>
                <button
                  onClick={() => setSelectedStageFilter('SCRUTINY')}
                  className={`px-2.5 py-1 rounded-sm text-xs font-mono font-black uppercase border-2 transition ${
                    selectedStageFilter === 'SCRUTINY'
                      ? 'bg-[#142B45] text-white border-[#17202B]'
                      : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
                  }`}
                >
                  Scrutiny ({safeMetrics.pendingScrutinyCount})
                </button>
                <button
                  onClick={() => setSelectedStageFilter('EVC')}
                  className={`px-2.5 py-1 rounded-sm text-xs font-mono font-black uppercase border-2 transition ${
                    selectedStageFilter === 'EVC'
                      ? 'bg-[#142B45] text-white border-[#17202B]'
                      : 'bg-white text-[#17202B] border-[#17202B] hover:bg-slate-100'
                  }`}
                >
                  EVC ({safeMetrics.evcScheduledCount})
                </button>
                <button
                  onClick={() => setSelectedStageFilter('OVERDUE')}
                  className={`px-2.5 py-1 rounded-sm text-xs font-mono font-black uppercase border-2 transition ${
                    selectedStageFilter === 'OVERDUE'
                      ? 'bg-rose-700 text-white border-[#17202B]'
                      : 'bg-white text-rose-800 border-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Overdue ({safeMetrics.overdueTasksCount})
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search register by Application ID, Institute Name, Region, or State..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold border-2 border-[#17202B] rounded-sm py-2 pl-9 pr-3 text-[#17202B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B45] bg-white"
              />
              <Search className="w-4 h-4 text-[#5B6875] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application Number</th>
                  <th>Institution Name & Region</th>
                  <th>Category</th>
                  <th>Current Stage</th>
                  <th>Priority</th>
                  <th>Desk Ageing</th>
                  <th>Assigned Officer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td className="font-mono text-xs font-black text-[#142B45]">
                        {app.applicationNumber}
                        <div className="text-[10px] text-[#5B6875] font-mono">PID: {app.permanentInstituteId}</div>
                      </td>
                      <td>
                        <div className="font-bold text-[#17202B] text-xs truncate max-w-[280px]">
                          {app.instituteName}
                        </div>
                        <div className="text-[11px] text-[#5B6875] font-mono">
                          {app.region} • {app.state}
                        </div>
                      </td>
                      <td className="text-xs text-[#17202B] font-medium">
                        {app.category.replace(/_/g, ' ')}
                      </td>
                      <td>
                        <StageBadge stage={app.currentStage} />
                      </td>
                      <td>
                        <PriorityBadge priority={app.priority} />
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold text-[#17202B]">
                          {app.stageAgeingDays}d
                        </span>
                        <span className="text-[10px] text-[#5B6875] ml-1 font-mono">({app.totalAgeingDays}d)</span>
                      </td>
                      <td className="text-xs text-[#5B6875] font-mono">
                        {app.assignedOfficer}
                      </td>
                      <td>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="gov-btn-secondary py-1 px-2.5 text-xs font-bold"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setEvaluatingApplication(app)}
                            className="gov-btn-primary py-1 px-2.5 text-xs font-bold"
                          >
                            Evaluate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-xs font-mono text-[#5B6875]">
                      No applications match the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 border-t-2 border-[#17202B] bg-[#FAF9F6] flex items-center justify-between text-xs text-[#17202B] font-mono">
            <span>Average Application Review Ageing: <strong className="text-[#142B45]">{safeMetrics.averageAgeingDays} DAYS</strong></span>
            <button
              onClick={() => navigate('/applications')}
              className="font-bold text-[#142B45] hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              Open Full Master Register &rarr;
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Priority Queues & Recent Forensic Activity */}
        <div className="space-y-6">
          {/* Quick Action Queue Shortcuts */}
          <div className="bg-white rounded-sm border-2 border-[#17202B] p-4 shadow-[2px_2px_0px_#17202B] space-y-3">
            <h3 className="text-xs font-black text-[#142B45] uppercase tracking-wider border-b-2 border-[#17202B] pb-2">
              Action Escalations
            </h3>
            <div className="space-y-2">
              <div
                onClick={() => navigate('/evc')}
                className="p-3 rounded-sm border-2 border-[#17202B] hover:bg-[#FAF9F6] cursor-pointer transition flex items-center justify-between shadow-[1px_1px_0px_#17202B]"
              >
                <div>
                  <p className="text-xs font-bold text-[#17202B] uppercase">EVC Inspection Overdue Queue</p>
                  <p className="text-[11px] text-rose-700 font-mono font-bold">1 report exceeding 48h limit</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6875]" />
              </div>

              <div
                onClick={() => navigate('/compliance')}
                className="p-3 rounded-sm border-2 border-[#17202B] hover:bg-[#FAF9F6] cursor-pointer transition flex items-center justify-between shadow-[1px_1px_0px_#17202B]"
              >
                <div>
                  <p className="text-xs font-bold text-[#17202B] uppercase">Time-Bound Undertakings</p>
                  <p className="text-[11px] text-amber-700 font-mono font-bold">2 compliance deadlines due soon</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6875]" />
              </div>

              <div
                onClick={() => navigate('/document-validity')}
                className="p-3 rounded-sm border-2 border-[#17202B] hover:bg-[#FAF9F6] cursor-pointer transition flex items-center justify-between shadow-[1px_1px_0px_#17202B]"
              >
                <div>
                  <p className="text-xs font-bold text-[#17202B] uppercase">Document Expiry Early Warning</p>
                  <p className="text-[11px] text-[#5B6875] font-mono">30-year land leases & Fire NOCs</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6875]" />
              </div>
            </div>
          </div>

          {/* Audit Activity Log (Member Secretary & System Admin only) OR Jurisdiction Card */}
          {canViewAudit ? (
            <div className="bg-white rounded-sm border-2 border-[#17202B] p-4 shadow-[2px_2px_0px_#17202B] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#17202B] pb-2">
                <h3 className="text-xs font-black text-[#142B45] uppercase tracking-wider">
                  Recent Regulatory Activity
                </h3>
                <button
                  onClick={() => navigate('/audit')}
                  className="text-[11px] text-[#142B45] font-mono font-bold hover:underline"
                >
                  Full Trail &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-200 text-xs space-y-2">
                {recentAuditLogs.length === 0 ? (
                  <div className="py-4 text-center text-[#5B6875] text-xs font-mono">No audit events recorded.</div>
                ) : (
                  recentAuditLogs.map((log) => (
                    <div key={log.id} className="pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#17202B]">{log.actionTitle}</span>
                        <span className="font-mono text-[#5B6875]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5B6875] font-mono line-clamp-2">{log.details}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-[#5B6875] font-mono">
                        <span className="font-bold text-[#17202B]">{log.actorName}</span>
                        <span>•</span>
                        <span>{log.ipAddressMasked}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-sm border-2 border-[#17202B] p-4 shadow-[2px_2px_0px_#17202B] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#17202B] pb-2">
                <h3 className="text-xs font-black text-[#142B45] uppercase tracking-wider">
                  Officer Statutory Scope
                </h3>
                <span className="text-[10px] bg-[#EAF0F5] text-[#142B45] border border-[#142B45] px-1.5 py-0.5 rounded-sm font-mono font-bold">
                  RBAC Active
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#5B6875]">Officer:</span>
                  <span className="font-bold text-[#17202B]">{currentUser?.fullName || currentUser?.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#5B6875]">Role:</span>
                  <span className="font-bold text-[#142B45]">{currentUser?.role?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#5B6875]">Jurisdiction:</span>
                  <span className="font-bold text-[#E98232]">{currentUser?.region || 'National Scope'}</span>
                </div>
                <p className="text-[10px] text-[#5B6875] pt-1 leading-relaxed">
                  System audit ledger is restricted to Member Secretary and System Admin per statutory separation of duties.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flyout Application Detail Drawer */}
      <ApplicationDetailDrawer
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onReviewScrutiny={(app) => setEvaluatingApplication(app)}
      />

      {/* Interactive Scrutiny Checklist Evaluation Modal */}
      <ScrutinyEvaluationModal
        application={evaluatingApplication}
        onClose={() => setEvaluatingApplication(null)}
      />
    </div>
  );
};
