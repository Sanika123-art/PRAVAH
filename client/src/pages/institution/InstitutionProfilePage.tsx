import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInstitutionProfile, updateInstitutionProfile } from '../../services/institutionService';
import { Institution } from '@saksham/shared';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Save,
  AlertCircle,
} from 'lucide-react';

export const InstitutionProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<Institution | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const inst = await getInstitutionProfile();
        setProfile(inst);
        setContactEmail(inst.contactEmail || '');
        setContactPhone(inst.contactPhone || '');
        setAddress(inst.address || '');
        setDistrict(inst.district || '');
        setPincode(inst.pincode || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await updateInstitutionProfile({
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        district: district.trim(),
        pincode: pincode.trim(),
      });
      setProfile(updated);
      setSuccessMsg('Institution contact details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update institution profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading institution profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-[#17202B] p-4 rounded-sm shadow-[2px_2px_0px_#17202B]">
        <div>
          <h1 className="text-xl font-black text-[#142B45] uppercase tracking-wide">Institution Profile & Central Directory Record</h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Authoritative institutional record, permanent identification coordinates, and verified regulatory representative particulars
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-sm bg-emerald-50 border-2 border-[#18794E] text-emerald-950 text-xs flex items-center space-x-2 shadow-[2px_2px_0px_#18794E]">
          <CheckCircle2 className="w-4 h-4 text-[#18794E] flex-shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-sm bg-rose-50 border-2 border-rose-700 text-rose-950 text-xs flex items-center space-x-2 shadow-[2px_2px_0px_#b91c1c]">
          <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Identity Cards */}
      <div className="bg-white p-6 border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b-2 border-[#17202B]">
          <div className="w-10 h-10 rounded-sm border-2 border-[#17202B] bg-[#EAF0F5] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#142B45]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">{profile?.name}</h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs font-mono font-black text-[#142B45]">
                PID: {profile?.permanentInstituteId}
              </span>
              <span className="px-2 py-0.5 border border-[#18794E] bg-emerald-100 text-emerald-950 rounded-sm text-[10px] font-mono font-bold uppercase">
                {profile?.isVerified ? 'VERIFIED INSTITUTION' : 'PENDING AUTHORIZATION'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
            <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Sponsoring Trust / Society:</span>
            <div className="font-bold text-[#17202B] mt-0.5">{profile?.trustName}</div>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
            <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Institution Category:</span>
            <div className="font-bold text-[#17202B] mt-0.5">{profile?.institutionType?.replace(/_/g, ' ')}</div>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
            <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Regional Bureau Jurisdiction:</span>
            <div className="font-bold text-[#17202B] mt-0.5">{profile?.region?.replace(/_/g, ' ')}</div>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
            <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Authoritative Representative:</span>
            <div className="font-bold text-[#17202B] mt-0.5">{currentUser?.fullName} ({currentUser?.email})</div>
          </div>
        </div>
      </div>

      {/* Editable Contact Form */}
      <div className="bg-white p-6 border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B]">
        <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide mb-4 pb-2 border-b-2 border-[#17202B]">
          Official Communication Particulars
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                Official Institutional Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                Official Contact Phone / Landline
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 20 25678900"
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                Campus Postal Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Survey No. 42, Knowledge Park, Technology Corridor"
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                District / City
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Pune"
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#17202B] mb-1">
                Postal PIN Code
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="411007"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-300 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="gov-btn-primary py-2 px-5 text-xs font-bold disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
