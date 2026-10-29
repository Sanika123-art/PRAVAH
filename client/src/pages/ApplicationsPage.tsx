import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Application } from '@saksham/shared';
import { fetchApplications } from '../services/applicationService';
import { StageBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { ApplicationDetailDrawer } from '../components/ui/ApplicationDetailDrawer';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import {
  Search,
  Download,
  RotateCcw,
  Building,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [recordType, setRecordType] = useState<'ALL' | 'REAL' | 'DEMO'>('ALL');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchApplications({
        search: searchQuery || undefined,
        stage: selectedStage,
        region: selectedRegion,
        category: selectedCategory,
        priority: selectedPriority,
        recordType,
      });
      setApplications(response.data);
      setTotalCount(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications from database.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStage, selectedRegion, selectedCategory, selectedPriority, recordType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStage('ALL');
    setSelectedRegion('ALL');
    setSelectedCategory('ALL');
    setSelectedPriority('ALL');
    setRecordType('ALL');
  };

  const handleExportCsv = () => {
    if (applications.length === 0) return;
    const headers = ['Application Number', 'PID', 'Institute Name', 'State', 'Region', 'Category', 'Stage', 'Priority', 'Approved Intake', 'Requested Intake'];
    const rows = applications.map((a) => [
      a.applicationNumber,
      a.permanentInstituteId,
      `"${a.instituteName.replace(/"/g, '""')}"`,
      a.state,
      a.region,
      a.category,
      a.currentStage,
      a.priority,
      a.approvedIntake,
      a.requestedIntake,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PRAVAH_Applications_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Controls & Multi-Parameter Filter Ribbon */}
      <div className="bg-white rounded-sm border-2 border-[#17202B] p-4 shadow-[2px_2px_0px_#17202B] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by ID, Institute Name, PID, or State..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold border-2 border-[#17202B] rounded-sm py-2 pl-8 pr-3 text-[#17202B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B45] bg-[#FAF9F6]"
            />
            <Search className="w-3.5 h-3.5 text-[#5B6875] absolute left-2.5 top-2.5" />
          </div>

          {/* Quick Stats & Action Buttons */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-1">
            <span className="text-xs text-[#5B6875] font-mono hidden sm:inline mr-2">
              Showing <strong>{applications.length}</strong> of {totalCount} PostgreSQL Records
            </span>
            <button
              onClick={resetFilters}
              className="gov-btn-secondary py-1.5 px-3 text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Filters
            </button>
            <button
              onClick={handleExportCsv}
              disabled={applications.length === 0}
              className="gov-btn-saffron py-1.5 px-3.5 text-xs font-black shadow-[2px_2px_0px_#17202B] disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t-2 border-[#17202B] text-xs">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#5B6875] mb-1">Approval Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full border-2 border-[#17202B] rounded-sm py-1.5 px-2 text-xs font-semibold bg-[#FAF9F6] text-[#17202B] focus:ring-2 focus:ring-[#142B45]"
            >
              <option value="ALL">All Stages</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="SCRUTINY">Under Scrutiny</option>
              <option value="RE_SCRUTINY">Re-Scrutiny</option>
              <option value="EVC_SCHEDULED">EVC Scheduled</option>
              <option value="EVC_COMPLETED">EVC Completed</option>
              <option value="SHC_HEARING">SHC Hearing</option>
              <option value="SAC_APPEAL">SAC Appeal</option>
              <option value="APPROVED_CONDITIONAL">Approved Conditional</option>
              <option value="APPROVAL_GRANTED">Approval Granted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#5B6875] mb-1">AICTE Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full border-2 border-[#17202B] rounded-sm py-1.5 px-2 text-xs font-semibold bg-[#FAF9F6] text-[#17202B] focus:ring-2 focus:ring-[#142B45]"
            >
              <option value="ALL">All Regions</option>
              <option value="NORTHERN">Northern (NRO)</option>
              <option value="NORTH_WEST">North West (NWRO)</option>
              <option value="WESTERN">Western (WRO)</option>
              <option value="CENTRAL">Central (CRO)</option>
              <option value="SOUTH_WEST">South West (SWRO)</option>
              <option value="SOUTHERN">Southern (SRO)</option>
              <option value="EASTERN">Eastern (ERO)</option>
              <option value="SOUTH_CENTRAL">South Central (SCRO - Hyderabad)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#5B6875] mb-1">Application Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-[#17202B] rounded-sm py-1.5 px-2 text-xs font-semibold bg-[#FAF9F6] text-[#17202B] focus:ring-2 focus:ring-[#142B45]"
            >
              <option value="ALL">All Categories</option>
              <option value="NEW_INSTITUTE">New Technical Institution</option>
              <option value="EOA_EXISTING">Extension of Approval (EoA)</option>
              <option value="INTAKE_INCREASE">Increase in Approved Intake</option>
              <option value="SUPERNUMERARY_SEATS">Supernumerary Seats (FN/OCI)</option>
              <option value="CHANGE_OF_SITE">Change of Site / Location</option>
              <option value="WOMEN_TO_COED">Women to Co-Ed Conversion</option>
              <option value="CLOSURE">Closure of Program/Institute</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#5B6875] mb-1">Priority / Urgency</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full border-2 border-[#17202B] rounded-sm py-1.5 px-2 text-xs font-semibold bg-[#FAF9F6] text-[#17202B] focus:ring-2 focus:ring-[#142B45]"
            >
              <option value="ALL">All Priorities</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="CRITICAL_OVERDUE">Critical / SLA Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#5B6875] mb-1">Record Source</label>
            <select
              value={recordType}
              onChange={(event) => setRecordType(event.target.value as 'ALL' | 'REAL' | 'DEMO')}
              className="w-full border-2 border-[#17202B] rounded-sm py-1.5 px-2 text-xs font-semibold bg-[#FAF9F6] text-[#17202B] focus:ring-2 focus:ring-[#142B45]"
            >
              <option value="ALL">Real and Demo</option>
              <option value="REAL">Real Submissions</option>
              <option value="DEMO">Read-Only Demo Records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] overflow-hidden">
        {loading ? (
          <LoadingState message="Fetching live records from PRAVAH PostgreSQL service..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : applications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application No.</th>
                  <th>Permanent ID</th>
                  <th>Institution Name & Location</th>
                  <th>Category</th>
                  <th>Stage</th>
                  <th>Priority</th>
                  <th>Assigned Officer</th>
                  <th>Ageing</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="font-mono text-xs font-black text-[#142B45]">
                      {app.applicationNumber}
                    </td>
                    <td className="font-mono text-xs text-[#5B6875]">
                      {app.permanentInstituteId}
                    </td>
                    <td>
                      <div className="font-bold text-xs text-[#17202B] max-w-[280px] truncate" title={app.instituteName}>
                        {app.instituteName}
                        {app.isDemo && <span className="ml-2 rounded-sm border border-amber-600 bg-amber-100 px-1.5 py-0.5 text-[9px] font-mono font-black text-amber-950 uppercase">DEMO</span>}
                      </div>
                      <div className="text-[11px] text-[#5B6875] font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{app.state}</span>
                        <span>•</span>
                        <span className="font-bold text-[#142B45]">{app.region}</span>
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
                    <td className="text-xs text-[#5B6875] font-mono">
                      {app.assignedOfficer}
                    </td>
                    <td>
                      <div className="font-mono text-xs font-bold text-[#17202B]">
                        {app.stageAgeingDays}d
                      </div>
                      <div className="text-[10px] text-[#5B6875] font-mono">
                        Total: {app.totalAgeingDays}d
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="gov-btn-secondary py-1 px-3 text-xs font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Register Footer */}
        <div className="p-3 bg-[#FAF9F6] border-t-2 border-[#17202B] flex items-center justify-between text-xs text-[#17202B] font-mono">
          <span>Showing <strong>{applications.length}</strong> of <strong>{totalCount}</strong> database records</span>
          <span className="text-[11px] text-[#5B6875]">PostgreSQL Backed • AICTE Regulatory Processing Standard APH 2024–27</span>
        </div>
      </div>

      {/* Flyout Drawer */}
      <ApplicationDetailDrawer
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />
    </div>
  );
};
