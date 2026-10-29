import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application, UserRole } from '@saksham/shared';
import { fetchApplications } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  GitPullRequest,
  Users,
  ShieldCheck,
  Clock,
  History,
  Scale,
  ArrowRight,
  X,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [apps, setApps] = useState<Application[]>([]);
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  // Handle global Esc and Ctrl+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchApplications({ search: query.trim() || undefined, limit: 5 })
        .then((res) => setApps(res.data))
        .catch(() => setApps([]));
    }
  }, [isOpen, query]);

  if (!isOpen) return null;

  const filteredApps = apps;

  const quickRoutes = [
    { label: 'Scrutiny & Stage Pendency Queue', path: '/workflow-queue', icon: GitPullRequest, hint: 'QUEUE' },
    { label: 'EVC Committee & Inspections', path: '/evc', icon: Users, hint: '48H SLA' },
    { label: 'Time-Bound Undertakings', path: '/compliance', icon: ShieldCheck, hint: 'COMPLIANCE' },
    { label: 'Document Validity & Lease Expiry', path: '/document-validity', icon: Clock, hint: 'VALIDITY' },
    { label: 'Forensic Audit Trail', path: '/audit', icon: History, hint: 'AUDIT' },
    { label: 'Regulatory Rules Register', path: '/admin/rules', icon: Scale, hint: 'APH RULES' },
  ].filter((r) => query === '' || r.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelectRoute = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-sm shadow-[4px_4px_0px_#17202B] max-w-2xl w-full border-2 border-[#17202B] overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b-2 border-[#17202B] bg-[#FAF9F6]">
          <Search className="w-5 h-5 text-[#142B45] mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Application No, Institute, Stage Queue, or jump to regulatory desk..."
            className="w-full bg-transparent text-sm text-[#17202B] font-bold placeholder-[#5B6875] focus:outline-none"
          />
          <div className="flex items-center space-x-2 flex-shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#EAF0F5] border border-[#17202B] rounded-sm text-[#17202B]">
              ESC
            </kbd>
            <button onClick={onClose} className="p-1 text-[#17202B] hover:bg-[#EAF0F5] rounded-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Route Jumps */}
          <div>
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#5B6875]">
              Statutory Desks & Portals
            </div>
            <div className="space-y-1">
              {quickRoutes.map((route) => {
                const Icon = route.icon;
                return (
                  <div
                    key={route.path}
                    onClick={() => handleSelectRoute(route.path)}
                    className="flex items-center justify-between px-3 py-2 rounded-sm border border-transparent hover:border-[#17202B] hover:bg-[#EAF0F5] cursor-pointer text-[#17202B] transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-[#142B45]" />
                      <span className="font-bold text-xs">{route.label}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-white border border-[#CBD5E1] text-[#142B45]">
                      {route.hint}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Applications Matching Query */}
          {filteredApps.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#5B6875] border-t border-[#CBD5E1] pt-2">
                Matching Applications ({filteredApps.length})
              </div>
              <div className="space-y-1">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => {
                      navigate(`/applications?search=${encodeURIComponent(app.applicationNumber)}`);
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-sm border border-transparent hover:border-[#17202B] hover:bg-[#FAF9F6] cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#142B45] text-xs">
                          {app.applicationNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#EAF0F5] border border-[#CBD5E1] text-[#142B45] font-bold uppercase font-mono">
                          {app.currentStage}
                        </span>
                      </div>
                      <p className="font-bold text-[#17202B] text-xs truncate mt-0.5">
                        {app.instituteName}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#17202B] flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Officer Switch Persona */}
          <div className="border-t border-[#CBD5E1] pt-2">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#5B6875]">
              Quick Switch Officer Role Persona
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-2">
              <button
                onClick={() => handleSelectRole('SCRUTINY_OFFICER')}
                className="text-left px-2.5 py-1.5 rounded-sm border border-[#17202B] bg-white hover:bg-[#FAF9F6] text-[11px] font-bold text-[#17202B] shadow-[1px_1px_0px_#17202B]"
              >
                [SCRUTINY] Scrutiny Officer Desk
              </button>
              <button
                onClick={() => handleSelectRole('REGIONAL_OFFICER')}
                className="text-left px-2.5 py-1.5 rounded-sm border border-[#17202B] bg-white hover:bg-[#FAF9F6] text-[11px] font-bold text-[#17202B] shadow-[1px_1px_0px_#17202B]"
              >
                [RO] Regional Jurisdiction Officer
              </button>
              <button
                onClick={() => handleSelectRole('EVC_EXPERT')}
                className="text-left px-2.5 py-1.5 rounded-sm border border-[#17202B] bg-white hover:bg-[#FAF9F6] text-[11px] font-bold text-[#17202B] shadow-[1px_1px_0px_#17202B]"
              >
                [EVC] Expert Visit Convener
              </button>
              <button
                onClick={() => handleSelectRole('MEMBER_SECRETARY')}
                className="text-left px-2.5 py-1.5 rounded-sm border border-[#17202B] bg-white hover:bg-[#FAF9F6] text-[11px] font-bold text-[#17202B] shadow-[1px_1px_0px_#17202B]"
              >
                [COUNCIL] Member Secretary Desk
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#FAF9F6] border-t-2 border-[#17202B] flex items-center justify-between text-[11px] text-[#5B6875] font-mono">
          <span>Navigate with Arrows or Click</span>
          <span>PRAVAH Unified Command Console</span>
        </div>
      </div>
    </div>
  );
};
