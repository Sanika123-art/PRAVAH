import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GeometricMark } from '../../components/common/GeometricMark';
import { IndiaFlag } from '../../components/common/GovtEmblem';
import { registerInstitution, fetchDevEmails } from '../../services/authService';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export const InstitutionSignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    institutionName: '',
    trustName: '',
    state: 'Maharashtra',
    district: '',
    permanentInstituteId: '',
    representativeName: '',
    email: '',
    mobilePhone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ email: string; message: string } | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!formData.acceptedTerms) {
      setErrorMessage('Please accept the AICTE regulatory declarations to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerInstitution({
        institutionName: formData.institutionName.trim(),
        trustName: formData.trustName.trim(),
        state: formData.state,
        district: formData.district.trim() || undefined,
        permanentInstituteId: formData.permanentInstituteId.trim() || undefined,
        representativeName: formData.representativeName.trim(),
        email: formData.email.trim(),
        mobilePhone: formData.mobilePhone.trim() || undefined,
        password: formData.password,
      });

      setSuccessInfo({ email: res.email, message: res.message });

      // In development, retrieve token from dev outbox for instant verification convenience
      const outbox = await fetchDevEmails();
      const match = outbox.find((item) => item.to.toLowerCase() === res.email.toLowerCase());
      if (match && match.token) {
        setDevToken(match.token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check form inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#17202B] flex flex-col justify-between selection:bg-[#142B45] selection:text-white">
      {/* 1. Indian National Government Accent Ribbon */}
      <div className="gov-accent-stripe" aria-hidden="true" />

      {/* 2. Top Header Bar */}
      <div className="bg-[#0A1B38] text-white text-[11px] py-1.5 px-4 sm:px-8 border-b-2 border-[#17202B] flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <IndiaFlag width={20} height={13} />
          <span className="font-bold tracking-wide">AICTE Official Registration Portal</span>
        </div>
        <span className="font-mono text-[10px] text-[#E98232] font-bold">
          SIH PS 26262 • Bit2Bramha
        </span>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8 sm:mx-auto sm:w-full sm:max-w-2xl flex-1 flex flex-col justify-center">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <GeometricMark size={48} />
          </div>
          <h1 className="text-2xl font-black text-[#142B45] tracking-tight">
            PRAVAH
          </h1>
          <p className="text-xs font-black text-[#B45309] uppercase tracking-widest font-mono mt-0.5">
            INSTITUTIONAL REPRESENTATIVE ONBOARDING
          </p>
        </div>

        {/* Success View */}
        {successInfo ? (
          <div className="bg-white p-6 sm:p-8 rounded-sm border-2 border-[#17202B] shadow-[4px_4px_0px_#17202B] text-center space-y-4">
            <div className="w-14 h-14 bg-[#EBF6F0] text-[#18794E] border-2 border-[#18794E] rounded-sm flex items-center justify-center mx-auto shadow-[2px_2px_0px_#18794E]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-[#142B45] uppercase">
              Registration Dossier Received
            </h2>
            <p className="text-xs text-[#5B6875] max-w-md mx-auto leading-relaxed">
              A regulatory verification dispatch has been sent to <strong>{successInfo.email}</strong>. Please confirm the link to activate your institution credentials.
            </p>

            {devToken && (
              <div className="p-4 bg-[#FFF7ED] border-2 border-[#B45309] rounded-sm text-left text-xs space-y-2 shadow-[2px_2px_0px_#B45309]">
                <div className="font-black text-[#B45309] uppercase flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Prototype Local Verification Dispatch</span>
                </div>
                <p className="text-[#5B6875] text-[11px]">
                  Local demonstration test token captured from outbox service:
                </p>
                <div className="font-mono bg-white p-2 rounded-sm border border-[#17202B] break-all text-[11px] font-bold text-[#142B45]">
                  {devToken}
                </div>
                <Link
                  to={`/institution/verify-email?token=${devToken}&email=${encodeURIComponent(successInfo.email)}`}
                  className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-[#B45309] underline hover:text-[#8C3D0E]"
                >
                  <span>Verify Email Address Now &rarr;</span>
                </Link>
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <Link
                to="/login"
                className="px-5 py-2 rounded-sm bg-[#142B45] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] hover:bg-[#0A1B38]"
              >
                Return to Portal Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-white p-6 sm:p-8 rounded-sm border-2 border-[#17202B] shadow-[4px_4px_0px_#17202B]">
            <div className="mb-5 pb-3 border-b-2 border-[#17202B]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#B45309]">REGULATORY FORM REG-01</span>
              <h2 className="text-base sm:text-lg font-black text-[#142B45]">
                Register Authorized Institutional Representative
              </h2>
              <p className="text-xs text-[#5B6875] mt-0.5 font-medium">
                Authorized Heads of Institutions, Vice-Chancellors, Principals, and Registrars
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-sm bg-[#FDF2F2] border-2 border-[#C5221F] text-[#C5221F] text-xs font-bold flex items-start space-x-2 shadow-[2px_2px_0px_#C5221F]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-mono">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Official Name of Institution *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder="e.g. Pune Institute of Advanced Technology"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                    />
                    <Building2 className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Sponsoring Trust / Society / Company (Section 8) *
                  </label>
                  <input
                    type="text"
                    required
                    name="trustName"
                    value={formData.trustName}
                    onChange={handleChange}
                    placeholder="e.g. Vidya Vikas Educational Charitable Trust"
                    className="w-full px-3 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    State / UT *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Telangana">Telangana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Permanent Institute ID (PID, if existing)
                  </label>
                  <input
                    type="text"
                    name="permanentInstituteId"
                    value={formData.permanentInstituteId}
                    onChange={handleChange}
                    placeholder="e.g. 1-4829104 (leave blank if new)"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t-2 border-[#CBD5E1]">
                  <span className="text-[10px] font-mono font-black text-[#5B6875] uppercase tracking-wider">
                    AUTHORIZED REPRESENTATIVE DETAILS
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Representative Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      name="representativeName"
                      value={formData.representativeName}
                      onChange={handleChange}
                      placeholder="e.g. Dr. Sunil Kulkarni"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                    />
                    <User className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Contact Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="mobilePhone"
                      value={formData.mobilePhone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Official Institutional Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="principal@college.edu.in"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Password (min 8 chars) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#5B6875] hover:text-[#17202B]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2 text-xs text-[#17202B] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 border-2 border-[#17202B] text-[#142B45]"
                  />
                  <span className="leading-relaxed">
                    I hereby certify that I am the authorized representative of the applicant institution and agree to adhere to the statutory provisions of the AICTE Act 1987 and Approval Process Handbook regulations.
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-sm bg-[#142B45] hover:bg-[#0A1B38] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering Institution...</span>
                  ) : (
                    <span>Complete Institutional Registration</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-[#E98232]" />
                </button>
              </div>
            </form>

            <div className="mt-5 text-center text-xs text-[#5B6875]">
              Already registered?{' '}
              <Link to="/login" className="text-[#B45309] hover:underline font-bold">
                Sign in to Portal
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer className="py-3 px-4 text-center text-xs text-[#5B6875] border-t-2 border-[#17202B] bg-white font-mono">
        PRAVAH AICTE Portal • Secure Institutional Registration Subsystem • SIH PS 26262
      </footer>
    </div>
  );
};
