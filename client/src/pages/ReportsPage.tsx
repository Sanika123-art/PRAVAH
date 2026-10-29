import React, { useState, useEffect, useCallback } from 'react';
import { Application, DashboardMetrics } from '@saksham/shared';
import { fetchDashboardMetrics } from '../services/metricsService';
import { fetchApplications } from '../services/applicationService';
import { LoadingState, ErrorState } from '../components/common/StateFeedback';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Download,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, appsRes] = await Promise.all([
        fetchDashboardMetrics(),
        fetchApplications({ limit: 100 }),
      ]);
      setMetrics(metricsData);
      setApplications(appsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report analytics from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

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

  // Prepare regional breakdown data across all 8 AICTE Regional Offices
  const regionalData = [
    { region: 'NWRO', count: applications.filter((a) => a.region === 'NORTH_WEST').length },
    { region: 'WRO', count: applications.filter((a) => a.region === 'WESTERN').length },
    { region: 'SRO', count: applications.filter((a) => a.region === 'SOUTHERN').length },
    { region: 'SWRO', count: applications.filter((a) => a.region === 'SOUTH_WEST').length },
    { region: 'SCRO', count: applications.filter((a) => a.region === 'SOUTH_CENTRAL').length },
    { region: 'NRO', count: applications.filter((a) => a.region === 'NORTHERN').length },
    { region: 'CRO', count: applications.filter((a) => a.region === 'CENTRAL').length },
    { region: 'ERO', count: applications.filter((a) => a.region === 'EASTERN').length },
  ];

  // Prepare stage distribution data for Pie Chart
  const stagePieData = [
    { name: 'Scrutiny Desk', value: safeMetrics.stageDistribution.SCRUTINY + safeMetrics.stageDistribution.RE_SCRUTINY, color: '#142B45' },
    { name: 'EVC Inspections', value: safeMetrics.stageDistribution.EVC_SCHEDULED + safeMetrics.stageDistribution.EVC_COMPLETED, color: '#E98232' },
    { name: 'Hearings (SHC/SAC)', value: safeMetrics.stageDistribution.SHC_HEARING + safeMetrics.stageDistribution.SAC_APPEAL, color: '#4B5563' },
    { name: 'Approvals Granted', value: safeMetrics.stageDistribution.APPROVED_CONDITIONAL + safeMetrics.stageDistribution.APPROVAL_GRANTED, color: '#18794E' },
    { name: 'Initial Ingestion', value: safeMetrics.stageDistribution.SUBMITTED, color: '#94A3B8' },
  ];

  const handleExportCSV = () => {
    const headers = ['Regional Office', 'Application Count'];
    const rows = regionalData.map((r) => [r.region, r.count.toString()]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PRAVAH_Regional_Workload_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Action Header */}
      <div className="bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#142B45] text-white px-2 py-0.5 rounded-sm">
              EXECUTIVE DESK
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
              STATUTORY SLA & AGEING AUDIT
            </span>
          </div>
          <h3 className="font-mono font-bold text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#142B45]" />
            Consolidated Regulatory Analytics & SLA Ageing
          </h3>
          <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
            Official operational reporting for AICTE Executive Committee and Regional Directors. Real-time metrics computed across the active 2026–27 approval cycle.
          </p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#142B45] text-white hover:bg-[#1f3f65] rounded-sm font-mono text-xs font-bold uppercase flex items-center gap-2 border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] transition-all"
          >
            <Download className="w-4 h-4" /> Export Workload (CSV)
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Aggregating live regulatory analytics from PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReportsData} />
      ) : (
        <>
          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Workload Distribution (Bar Chart) */}
            <div className="bg-white border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#17202B] pb-2">
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Regional Application Load (8 AICTE Jurisdictions)
                  </h4>
                  <p className="font-mono text-[11px] text-slate-500">Official distribution across jurisdictional offices</p>
                </div>
                <span className="font-mono text-xs font-bold text-white bg-[#142B45] px-2 py-0.5 rounded-sm border border-[#17202B]">
                  Total: {safeMetrics.totalApplications}
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#CBD5E1" />
                    <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#17202B', fontFamily: 'monospace' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#17202B', fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#142B45',
                        color: '#FFF',
                        borderRadius: '2px',
                        border: '2px solid #17202B',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="count" name="Applications" fill="#142B45" stroke="#17202B" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Allocation Breakdown (Pie Chart) */}
            <div className="bg-white border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#17202B] pb-2">
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Stage-Wise Processing Pipeline
                  </h4>
                  <p className="font-mono text-[11px] text-slate-500">Proportion of files currently in evaluation</p>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-300">
                  LIVE PIPELINE
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stagePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#17202B"
                      strokeWidth={1.5}
                    >
                      {stagePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#142B45',
                        color: '#FFF',
                        borderRadius: '2px',
                        border: '2px solid #17202B',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                      }}
                    />
                    <Legend
                      formatter={(value) => <span className="font-mono text-[11px] text-slate-800 font-bold">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary KPI Matrix */}
          <div className="bg-white border-2 border-[#17202B] rounded-sm p-4 shadow-[2px_2px_0px_#17202B]">
            <h4 className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 border-b-2 border-[#17202B] pb-2">
              Regulatory Bottleneck & Turnaround Diagnostics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="font-mono text-[11px] text-slate-600 block uppercase font-bold">Average Queue Ageing</span>
                <span className="text-xl font-mono font-bold text-slate-900 block my-0.5">{safeMetrics.averageAgeingDays} Days</span>
                <span className="font-mono text-[10px] text-slate-500 block">APH Norm: &le; 30 Days</span>
              </div>
              <div className="p-3 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="font-mono text-[11px] text-slate-600 block uppercase font-bold">Overdue Scrutiny Tasks</span>
                <span className="text-xl font-mono font-bold text-rose-700 block my-0.5">{safeMetrics.overdueTasksCount} Files</span>
                <span className="font-mono text-[10px] text-rose-600 block font-semibold">Exceeding 7d SLA</span>
              </div>
              <div className="p-3 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="font-mono text-[11px] text-slate-600 block uppercase font-bold">Delayed EVC Reports</span>
                <span className="text-xl font-mono font-bold text-amber-700 block my-0.5">{safeMetrics.evcOverdueReportsCount} Reports</span>
                <span className="font-mono text-[10px] text-amber-700 block font-semibold">Exceeding 48h limit</span>
              </div>
              <div className="p-3 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B]">
                <span className="font-mono text-[11px] text-slate-600 block uppercase font-bold">Critical Document Risks</span>
                <span className="text-xl font-mono font-bold text-slate-900 block my-0.5">{safeMetrics.documentValidityExpiredCount} Lapsed</span>
                <span className="font-mono text-[10px] text-slate-600 block font-semibold">Immediate Notice Required</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
