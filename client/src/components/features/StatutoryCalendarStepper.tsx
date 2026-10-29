import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Scale,
  X,
} from 'lucide-react';

interface CalendarStage {
  id: string;
  stageNumber: number;
  titleEn: string;
  titleHi: string;
  cutoffDate: string;
  status: 'COMPLETED' | 'ACTIVE' | 'UPCOMING';
  daysLeft?: number;
  courtMandateRef: string;
  description: string;
}

export const StatutoryCalendarStepper: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<CalendarStage | null>(null);

  const stages: CalendarStage[] = [
    {
      id: 'stg-1',
      stageNumber: 1,
      titleEn: 'Application Ingestion',
      titleHi: 'आवेदन प्राप्ति',
      cutoffDate: 'March 15',
      status: 'COMPLETED',
      courtMandateRef: 'APH Ch. I Sec 1.2 / Parshvanath Precedent',
      description: 'Online registration, institutional fee submission, and automated digital document ingestion.',
    },
    {
      id: 'stg-2',
      stageNumber: 2,
      titleEn: 'Scrutiny Committee',
      titleHi: 'संवीक्षा समिति',
      cutoffDate: 'April 10',
      status: 'ACTIVE',
      daysLeft: 7,
      courtMandateRef: 'Supreme Court Mandate (Para 42) & APH Sec 1.3',
      description: 'Document verification by 3-member expert scrutiny committee. Maximum 7 days turnaround per file.',
    },
    {
      id: 'stg-3',
      stageNumber: 3,
      titleEn: 'Re-Scrutiny Window',
      titleHi: 'पुनः संवीक्षा',
      cutoffDate: 'April 25',
      status: 'UPCOMING',
      courtMandateRef: 'APH Ch. II Sec 2.7',
      description: '10-day statutory opportunity for institutions to upload rectifications for non-critical deficiencies.',
    },
    {
      id: 'stg-4',
      stageNumber: 4,
      titleEn: 'EVC Inspections',
      titleHi: 'विशेषज्ञ समिति दौरा',
      cutoffDate: 'May 10',
      status: 'UPCOMING',
      courtMandateRef: 'APH Ch. I Sec 1.5 (48h Reporting Rule)',
      description: 'Physical campus inspection of land, buildings, laboratories, computing power, and faculty roster.',
    },
    {
      id: 'stg-5',
      stageNumber: 5,
      titleEn: 'Hearing (SHC)',
      titleHi: 'स्थायी सुनवाई समिति',
      cutoffDate: 'May 20',
      status: 'UPCOMING',
      courtMandateRef: 'AICTE Act Sec 10(k) & APH Ch. VIII',
      description: 'Formal quasi-judicial hearing for institutions with contested or serious infrastructural deficiencies.',
    },
    {
      id: 'stg-6',
      stageNumber: 6,
      titleEn: 'Appeals (SAC)',
      titleHi: 'स्थायी अपील समिति',
      cutoffDate: 'May 30',
      status: 'UPCOMING',
      courtMandateRef: 'APH Ch. VIII Sec 8.4',
      description: 'High-level appellate committee chaired by retired High Court Judge for final administrative redress.',
    },
    {
      id: 'stg-7',
      stageNumber: 7,
      titleEn: 'Final EoA Issuance',
      titleHi: 'अनुमोदन पत्र जारी',
      cutoffDate: 'June 10',
      status: 'UPCOMING',
      courtMandateRef: 'Supreme Court Strict Cut-off Precedent',
      description: 'Digital cryptographic issuance of Extension of Approval (EoA) letters for 2026–27 academic cycle.',
    },
  ];

  return (
    <div className="bg-white border-2 border-[#17202B] rounded-sm p-4 sm:p-5 shadow-[2px_2px_0px_#17202B] space-y-4">
      {/* Header with Supreme Court / APH Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#17202B] gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-sm bg-[#142B45] text-white border border-[#17202B]">
            <Scale className="w-4 h-4 text-[#E98232]" />
          </div>
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-[#142B45]">
              Supreme Court Statutory Academic Calendar (2026–2027)
            </h3>
            <p className="text-[11px] text-[#5B6875] font-medium">
              Time-bound regulatory milestones mandated by Apex Court order in <em>Parshvanath Charitable Trust vs. AICTE</em>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#EBF6F0] text-[#13603E] border border-[#18794E] font-bold text-[10px] uppercase">
            <span className="w-2 h-2 rounded-none bg-[#18794E]"></span> Completed
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#FFF7ED] text-[#B45309] border border-[#B45309] font-bold text-[10px] uppercase">
            <span className="w-2 h-2 rounded-none bg-[#E98232] animate-pulse"></span> Current Active
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#FAF9F6] text-[#5B6875] border border-[#CBD5E1] font-bold text-[10px] uppercase">
            <span className="w-2 h-2 rounded-none bg-[#CBD5E1]"></span> Upcoming
          </span>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {stages.map((stg) => {
          const isCompleted = stg.status === 'COMPLETED';
          const isActive = stg.status === 'ACTIVE';

          return (
            <div
              key={stg.id}
              onClick={() => setSelectedStage(stg)}
              className={`p-3 rounded-sm border-2 cursor-pointer transition flex flex-col justify-between ${
                isActive
                  ? 'bg-[#FFF7ED] border-[#B45309] shadow-[2px_2px_0px_#B45309]'
                  : isCompleted
                  ? 'bg-[#EBF6F0] border-[#18794E] shadow-[1px_1px_0px_#18794E] hover:bg-[#D1FAE5]'
                  : 'bg-[#FAF9F6] border-[#CBD5E1] hover:border-[#17202B] hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-sm border ${
                      isActive
                        ? 'bg-[#B45309] text-white border-[#8C3D0E]'
                        : isCompleted
                        ? 'bg-[#18794E] text-white border-[#0F4E32]'
                        : 'bg-white text-[#5B6875] border-[#CBD5E1]'
                    }`}
                  >
                    Phase {stg.stageNumber}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#18794E]" />
                  ) : isActive ? (
                    <Clock className="w-3.5 h-3.5 text-[#B45309] animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-none bg-[#CBD5E1]"></span>
                  )}
                </div>

                <p className="font-bold text-xs text-[#17202B] leading-tight">{stg.titleEn}</p>
                <p className="text-[10px] text-[#5B6875]">{stg.titleHi}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#CBD5E1] flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-[#142B45]">{stg.cutoffDate}</span>
                {isActive && (
                  <span className="font-black text-[#B45309] text-[9px] bg-[#FEF3C7] px-1 py-0.2 border border-[#B45309] uppercase">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog for Stage Details */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-[4px_4px_0px_#17202B] max-w-lg w-full p-6 border-2 border-[#17202B] space-y-4">
            <div className="flex items-start justify-between border-b-2 border-[#17202B] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B45309] bg-[#FFF7ED] px-2 py-0.5 rounded-sm border border-[#B45309]">
                  Phase {selectedStage.stageNumber} Milestone Details
                </span>
                <h3 className="text-base font-black text-[#142B45] mt-1">
                  {selectedStage.titleEn} ({selectedStage.titleHi})
                </h3>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="p-1 border border-[#17202B] rounded-sm text-[#17202B] hover:bg-[#EAF0F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FAF9F6] p-3 rounded-sm border border-[#17202B] flex items-center justify-between">
                <span className="text-[#5B6875] font-bold uppercase text-[10px]">Statutory Cutoff Deadline:</span>
                <span className="font-black text-[#142B45] font-mono text-sm">
                  {selectedStage.cutoffDate}, 2026 (23:59 IST)
                </span>
              </div>

              <div>
                <span className="font-black text-xs uppercase text-[#142B45] block mb-1">Legal / Handbook Citation:</span>
                <p className="font-mono text-[#17202B] bg-[#EAF0F5] p-2 rounded-sm border border-[#17202B] text-[11px]">
                  {selectedStage.courtMandateRef}
                </p>
              </div>

              <div>
                <span className="font-black text-xs uppercase text-[#142B45] block mb-1">Regulatory Scope & SLA:</span>
                <p className="text-[#5B6875] leading-relaxed font-medium">{selectedStage.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-[#17202B] flex justify-end">
              <button
                onClick={() => setSelectedStage(null)}
                className="px-4 py-1.5 bg-[#142B45] text-white rounded-sm text-xs font-bold uppercase tracking-wider border border-[#17202B] shadow-[1px_1px_0px_#17202B]"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
