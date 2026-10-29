import React from 'react';
import { Region, Application } from '@saksham/shared';
import { Building2, Check } from 'lucide-react';

interface RegionalOffice {
  code: Region;
  shortName: string;
  headquarters: string;
  nameEn: string;
  states: string;
}

const REGIONAL_OFFICES: RegionalOffice[] = [
  {
    code: 'NORTH_WEST',
    shortName: 'NWRO',
    headquarters: 'Chandigarh',
    nameEn: 'North-Western Regional Office',
    states: 'Punjab, Haryana, HP, J&K, Ladakh, Chandigarh',
  },
  {
    code: 'WESTERN',
    shortName: 'WRO',
    headquarters: 'Mumbai',
    nameEn: 'Western Regional Office',
    states: 'Maharashtra, Goa',
  },
  {
    code: 'CENTRAL',
    shortName: 'CRO',
    headquarters: 'Bhopal',
    nameEn: 'Central Regional Office',
    states: 'Madhya Pradesh, Chhattisgarh, Gujarat',
  },
  {
    code: 'SOUTH_WEST',
    shortName: 'SWRO',
    headquarters: 'Bengaluru',
    nameEn: 'South-Western Regional Office',
    states: 'Karnataka, Kerala, Lakshadweep',
  },
  {
    code: 'SOUTH_CENTRAL',
    shortName: 'SCRO',
    headquarters: 'Hyderabad',
    nameEn: 'South-Central Regional Office',
    states: 'Andhra Pradesh, Telangana',
  },
  {
    code: 'SOUTHERN',
    shortName: 'SRO',
    headquarters: 'Chennai',
    nameEn: 'Southern Regional Office',
    states: 'Tamil Nadu, Puducherry',
  },
  {
    code: 'NORTHERN',
    shortName: 'NRO',
    headquarters: 'Kanpur',
    nameEn: 'Northern Regional Office',
    states: 'Uttar Pradesh, Uttarakhand',
  },
  {
    code: 'EASTERN',
    shortName: 'ERO',
    headquarters: 'Kolkata',
    nameEn: 'Eastern Regional Office',
    states: 'West Bengal, Odisha, Bihar, Jharkhand, North-East',
  },
];

interface RegionalJurisdictionHubProps {
  selectedRegion: Region | 'ALL';
  onSelectRegion: (region: Region | 'ALL') => void;
  applications?: Application[];
}

export const RegionalJurisdictionHub: React.FC<RegionalJurisdictionHubProps> = ({
  selectedRegion,
  onSelectRegion,
  applications = [],
}) => {
  return (
    <div className="bg-white rounded-sm border-2 border-[#17202B] p-4 sm:p-5 shadow-[2px_2px_0px_#17202B] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#17202B] gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-[#142B45] text-white rounded-sm border border-[#17202B]">
            <Building2 className="w-4 h-4 text-[#E98232]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#142B45] uppercase tracking-wider">
              AICTE Regional Jurisdictions Hub (8 Regional Offices)
            </h3>
            <p className="text-[11px] text-[#5B6875] font-medium">
              Filter statutory queue workload, jurisdictional pendency, and scrutiny allocations by regional desk.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectRegion('ALL')}
          className={`px-3 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider border-2 transition flex items-center gap-1.5 ${
            selectedRegion === 'ALL'
              ? 'bg-[#142B45] text-white border-[#0A1B38] shadow-[2px_2px_0px_#17202B]'
              : 'bg-[#FAF9F6] text-[#17202B] border-[#17202B] hover:bg-[#EAF0F5]'
          }`}
        >
          <span>All Regions (National Scope)</span>
          {selectedRegion === 'ALL' && <Check className="w-3.5 h-3.5 text-[#E98232]" />}
        </button>
      </div>

      {/* 8 Regional Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {REGIONAL_OFFICES.map((ro) => {
          const count = applications.filter((a) => a.region === ro.code).length;
          const overdueCount = applications.filter(
            (a) => a.region === ro.code && (a.priority === 'CRITICAL_OVERDUE' || a.stageAgeingDays > 7)
          ).length;
          const isSelected = selectedRegion === ro.code;

          return (
            <div
              key={ro.code}
              onClick={() => onSelectRegion(isSelected ? 'ALL' : ro.code)}
              className={`p-3 rounded-sm border-2 cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#142B45] text-white border-[#0A1B38] shadow-[3px_3px_0px_#17202B]'
                  : 'bg-[#FAF9F6] border-[#CBD5E1] hover:border-[#17202B] hover:bg-white text-[#17202B]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono font-black text-[10px] px-1.5 py-0.2 rounded-sm border uppercase ${
                      isSelected
                        ? 'bg-[#E98232] text-white border-[#B45309]'
                        : 'bg-white text-[#142B45] border-[#CBD5E1]'
                    }`}
                  >
                    {ro.shortName}
                  </span>
                  {overdueCount > 0 && (
                    <span
                      className="w-2 h-2 rounded-none bg-[#C5221F] animate-pulse"
                      title={`${overdueCount} overdue files`}
                    ></span>
                  )}
                </div>

                <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-[#17202B]'}`}>
                  {ro.headquarters}
                </p>
                <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-[#5B6875]'}`}>
                  {ro.nameEn.split(' ')[0]}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#CBD5E1]/60 flex items-center justify-between text-xs font-mono">
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#E98232]' : 'text-[#142B45]'}`}>
                  {count} Files
                </span>
                {overdueCount > 0 && (
                  <span className="text-[10px] font-black text-[#C5221F]">
                    +{overdueCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
