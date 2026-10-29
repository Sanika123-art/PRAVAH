import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInstitutionApplications } from '../../services/institutionService';
import { Application } from '@saksham/shared';
import { StageBadge } from '../../components/ui/StatusBadge';
import {
  Search,
  Plus,
  ArrowRight,
  AlertTriangle,
  Building2,
} from 'lucide-react';

export const InstitutionApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const data = await getInstitutionApplications();
        setApplications(data);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  const filtered = applications.filter((app) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || app.category === categoryFilter;

    let matchStatus = true;
    if (statusFilter === 'DRAFT') {
      matchStatus = !!app.isDraft;
    } else if (statusFilter === 'SUBMITTED') {
      matchStatus = !app.isDraft && app.currentStage === 'SUBMITTED';
    } else if (statusFilter === 'SCRUTINY') {
      matchStatus = !app.isDraft && (app.currentStage === 'SCRUTINY' || app.currentStage === 'RE_SCRUTINY');
    } else if (statusFilter === 'EVC') {
      matchStatus = !app.isDraft && (app.currentStage === 'EVC_SCHEDULED' || app.currentStage === 'EVC_COMPLETED');
    }

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b-2 border-[#17202B]">
        <div>
          <h1 className="text-xl font-black text-[#142B45] uppercase tracking-tight">Institutional Applications Register</h1>
          <p className="text-xs text-[#5B6875] font-medium mt-0.5">
            Authoritative regulatory registry of your institution&apos;s AICTE approval filings (APH 2024–27)
          </p>
        </div>
        <Link
          to="/institution/applications/new"
          className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-sm bg-[#E98232] hover:bg-[#D16E20] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#17202B] active:translate-x-[1px] active:translate-y-[1px] transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Application Ref or Category..."
            className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="NEW_INSTITUTE">New Institute</option>
            <option value="EOA_EXISTING">Extension of Approval (EoA)</option>
            <option value="INTAKE_INCREASE">Intake Increase</option>
            <option value="SUPERNUMERARY_SEATS">Supernumerary Seats</option>
            <option value="CLOSURE">Progressive Closure</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Drafts (Unsubmitted)</option>
            <option value="SUBMITTED">Submitted to Queue</option>
            <option value="SCRUTINY">Under Scrutiny</option>
            <option value="EVC">EVC Inspection</option>
          </select>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white rounded-sm border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#5B6875] font-bold font-mono">
            Loading applications register...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-[#5B6875] mx-auto mb-2" />
            <h3 className="text-sm font-black uppercase text-[#17202B]">No applications match criteria</h3>
            <p className="text-xs text-[#5B6875] mt-1 font-medium">Try modifying your search query or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application Reference</th>
                  <th>Category</th>
                  <th>Academic Cycle</th>
                  <th>Approval Stage</th>
                  <th>Intake Capacity</th>
                  <th>Last Regulatory Update</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#142B45]">{app.applicationNumber}</span>
                        {app.isDeficient && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-sm text-[10px] font-black uppercase bg-[#FDF2F2] text-[#C5221F] border border-[#C5221F]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Deficiency</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-bold text-[#17202B]">
                      {app.category.replace(/_/g, ' ')}
                    </td>
                    <td className="font-mono text-[#5B6875]">
                      {app.academicCycle || '2026-27'}
                    </td>
                    <td>
                      {app.isDraft ? (
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase bg-[#FAF9F6] text-[#5B6875] border border-[#CBD5E1]">
                          Draft (Unsubmitted)
                        </span>
                      ) : (
                        <StageBadge stage={app.currentStage} />
                      )}
                    </td>
                    <td className="font-mono font-bold text-[#17202B]">
                      {app.requestedIntake} seats
                    </td>
                    <td className="font-mono text-[#5B6875]">
                      {new Date(app.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/institution/applications/${app.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-[#142B45] hover:text-white hover:bg-[#142B45] bg-[#FAF9F6] px-3 py-1.5 rounded-sm border-2 border-[#17202B] shadow-[1px_1px_0px_#17202B] transition"
                      >
                        <span>{app.isDraft ? 'Edit Draft' : 'Inspect Dossier'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#E98232]" />
                      </Link>
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
