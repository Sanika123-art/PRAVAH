import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GeometricMark } from '../components/common/GeometricMark';
import { CouncilEmblem, IndiaFlag } from '../components/common/GovtEmblem';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
import { ensureCsrfToken } from '../services/apiClient';
import { UserRole } from '@saksham/shared';
import {
  Building2,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  UserPlus,
  FileCheck,
  Landmark,
  Scale,
} from 'lucide-react';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected entry portal view (Institution vs Officer)
  const [activePortal, setActivePortal] = useState<'INSTITUTION' | 'OFFICER'>('INSTITUTION');
  const [emailOrUsername, setEmailOrUsername] = useState('director@apextech.ac.in');
  const [password, setPassword] = useState('AicteDev@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    ensureCsrfToken();
  }, []);

  const handlePortalSwitch = (portal: 'INSTITUTION' | 'OFFICER') => {
    setActivePortal(portal);
    clearError();
    setLocalError(null);

    if (portal === 'INSTITUTION') {
      setEmailOrUsername('director@apextech.ac.in');
      setPassword('AicteDev@2026!');
    } else {
      setEmailOrUsername('rk.sharma@aicte.gov.in');
      setPassword('AicteDev@2026!');
    }
  };

  const handleQuickFill = (role: UserRole) => {
    const persona = PRESET_USERS[role];
    if (persona) {
      setEmailOrUsername(persona.username);
      setPassword('AicteDev@2026!');
      clearError();
      setLocalError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setLocalError('Please enter your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const user = await login(emailOrUsername.trim(), password);

      const fromPath = (location.state as any)?.from?.pathname;
      if (user.role === 'INSTITUTION_USER') {
        if (fromPath && fromPath.startsWith('/institution')) {
          navigate(fromPath, { replace: true });
        } else {
          navigate('/institution/dashboard', { replace: true });
        }
      } else {
        if (fromPath && !fromPath.startsWith('/institution') && fromPath !== '/login') {
          navigate(fromPath, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#17202B] selection:bg-[#142B45] selection:text-white">
      {/* 1. Indian National Government Accent Ribbon */}
      <div className="gov-accent-stripe" aria-hidden="true" />

      {/* 2. Top Sovereign Authority Bar */}
      <div className="bg-[#0A1B38] text-white text-[11px] py-1.5 px-4 sm:px-8 border-b-2 border-[#17202B] flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-2.5">
          <IndiaFlag width={20} height={13} />
          <span className="font-bold tracking-wide">भारत सरकार | Government of India</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">शिक्षा मंत्रालय (Ministry of Education)</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300">
          <span className="font-mono text-[10px] bg-[#142B45] text-[#E98232] border border-[#E98232] px-2 py-0.5 rounded-sm font-bold uppercase">
            SIH PS 26262 • Bit2Bramha
          </span>
          <span className="hidden sm:inline font-mono">Academic Cycle: 2026–2027</span>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1.1fr_1fr]">
        {/* ------------------------- Official Hero / Identity Panel ------------------------- */}
        <section className="lp-hero p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
          {/* Blueprint Drafting Grid & Subtle Saffron CAD Sweep Line */}
          <div className="lp-blueprint-grid" aria-hidden="true" />
          <div className="lp-cad-trace" aria-hidden="true" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="lp-emblem-reveal flex-shrink-0">
                <CouncilEmblem size={56} className="border border-[#17202B]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#E98232]">
                  अखिल भारतीय तकनीकी शिक्षा परिषद
                </p>
                <p className="text-sm font-display font-bold text-white tracking-tight">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </p>
                <p className="text-[11px] text-slate-300 font-medium">Statutory Regulatory Body, Government of India</p>
              </div>
            </div>

            <div className="border-t-2 border-[#1E3A5F] pt-6 max-w-xl">
              <div className="inline-block bg-[#0A1B38] text-[#E98232] border border-[#E98232] text-xs font-mono font-black uppercase px-2.5 py-1 rounded-sm mb-3">
                SYSTEM IDENTIFIER: PRAVAH
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight leading-tight">
                AICTE Approval Workflow Automation &amp; Compliance Monitoring System
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                Unified institutional approval portal governing technical education establishments across all 8 AICTE regional jurisdictions in accordance with the Approval Process Handbook (APH 2024–27).
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                <span className="lp-chip">
                  <FileCheck className="w-3.5 h-3.5 text-[#E98232]" />
                  Automated Evidence Cross-Check
                </span>
                <span className="lp-chip">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#18794E]" />
                  Cryptographic Audit Trail
                </span>
                <span className="lp-chip">
                  <Landmark className="w-3.5 h-3.5 text-slate-300" />
                  APH 2024–27 Compliance Norms
                </span>
                <span className="lp-chip">
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                  Supreme Court SLA Mandates
                </span>
              </div>

              {/* Three-Stage Statutory Workflow Motif (Illustrative UI) */}
              <div className="workflow-motif" aria-label="Statutory approval lifecycle overview">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-[#E98232] tracking-wider mb-2">
                  <span>Statutory Approval Lifecycle</span>
                  <span className="text-[10px] text-slate-400">APH 2024–27 Stages</span>
                </div>
                <div className="relative flex items-center justify-between mt-3 px-2">
                  <div className="workflow-track" aria-hidden="true">
                    <div className="workflow-track-fill" />
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <div className="workflow-step-marker">01</div>
                    <span className="text-[11px] font-bold text-white mt-1.5">Application</span>
                    <span className="text-[9px] font-mono text-slate-300">Digital Submission</span>
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <div className="workflow-step-marker">02</div>
                    <span className="text-[11px] font-bold text-white mt-1.5">Scrutiny</span>
                    <span className="text-[9px] font-mono text-slate-300">Norms Verification</span>
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <div className="workflow-step-marker">03</div>
                    <span className="text-[11px] font-bold text-white mt-1.5">Compliance</span>
                    <span className="text-[9px] font-mono text-slate-300">Regional Council</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#1E3A5F] text-[11px] text-slate-400 font-mono leading-relaxed relative z-10">
            Statutory decision authority remains strictly vested in the designated Scrutiny Officers, Regional Committees, and Member Secretary. Autonomous approval without human regulatory sign-off is prohibited.
          </div>
        </section>

        {/* --------------------------- Sign-in Panel --------------------------- */}
        <main className="flex flex-col justify-center py-10 px-4 sm:px-8 lg:px-12 bg-[#FAF9F6]">
          <div className="w-full max-w-md mx-auto space-y-4">
            {/* Portal Selector Toggle */}
            <div
              className="bg-white p-1 rounded-sm grid grid-cols-2 gap-1 border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B]"
              role="tablist"
              aria-label="Select portal desk"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activePortal === 'INSTITUTION'}
                onClick={() => handlePortalSwitch('INSTITUTION')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-sm text-xs font-black uppercase tracking-wider transition ${
                  activePortal === 'INSTITUTION'
                    ? 'bg-[#142B45] text-white border border-[#0A1B38] shadow-[1px_1px_0px_#17202B]'
                    : 'text-[#17202B] hover:bg-[#FAF9F6]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Institution Desk</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePortal === 'OFFICER'}
                onClick={() => handlePortalSwitch('OFFICER')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-sm text-xs font-black uppercase tracking-wider transition ${
                  activePortal === 'OFFICER'
                    ? 'bg-[#142B45] text-white border border-[#0A1B38] shadow-[1px_1px_0px_#17202B]'
                    : 'text-[#17202B] hover:bg-[#FAF9F6]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AICTE Officer Desk</span>
              </button>
            </div>

            {/* Central Sign-in Card */}
            <div className="lp-card lp-card-enter p-6 sm:p-8">
              <div className="mb-5 pb-3 border-b-2 border-[#17202B]">
                <div className="text-[10px] font-mono font-bold uppercase text-[#B45309] tracking-wider">
                  SECURE AUTHENTICATION GATEWAY
                </div>
                <h2 className="text-base sm:text-lg font-display font-bold text-[#142B45] mt-0.5">
                  {activePortal === 'INSTITUTION' ? 'Institution Representative Sign In' : 'AICTE Officer Regulatory Authorization'}
                </h2>
                <p className="text-xs text-[#5B6875] mt-1 font-medium">
                  {activePortal === 'INSTITUTION'
                    ? 'Manage institutional affiliation, approval applications, and compliance filings'
                    : 'Authorized scrutiny desk, regional jurisdiction officers, EVC, and secretariat'}
                </p>
              </div>

              {/* Error Message */}
              {activeError && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-sm bg-[#FDF2F2] border-2 border-[#C5221F] text-[#C5221F] text-xs font-bold flex items-start space-x-2 shadow-[2px_2px_0px_#C5221F]"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 font-mono">{activeError}</div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="login-identifier" className="block text-[11px] font-black uppercase text-[#142B45] mb-1 tracking-wider">
                    {activePortal === 'INSTITUTION' ? 'Official Institutional Email *' : 'Officer Email / NIC ID *'}
                  </label>
                  <div className="relative">
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder={activePortal === 'INSTITUTION' ? 'director@apextech.ac.in' : 'officer@aicte.gov.in'}
                      className="lp-input w-full pl-9 pr-3 py-2 text-xs font-medium text-[#17202B]"
                    />
                    <Mail className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="login-password" className="block text-[11px] font-black uppercase text-[#142B45] tracking-wider">
                      Password / Digital Credential *
                    </label>
                    {activePortal === 'INSTITUTION' && (
                      <Link
                        to="/institution/forgot-password"
                        className="text-xs text-[#B45309] font-bold hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="lp-input w-full pl-9 pr-10 py-2 text-xs font-medium text-[#17202B]"
                    />
                    <Lock className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#5B6875] hover:text-[#17202B] focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center py-2.5 px-4 bg-[#142B45] hover:bg-[#0A1B38] text-white rounded-sm text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#17202B] active:translate-x-[1px] active:translate-y-[1px] transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Authenticating Against Central Directory...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <span>Authenticate &amp; Enter Portal</span>
                        <ArrowRight className="w-4 h-4 text-[#E98232]" />
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Institution Registration Link */}
              {activePortal === 'INSTITUTION' && (
                <div className="mt-5 pt-4 border-t-2 border-[#17202B] text-center">
                  <p className="text-xs text-[#5B6875] font-medium mb-2">
                    New institution representative or unassigned Permanent Institute ID (PID)?
                  </p>
                  <Link
                    to="/institution/signup"
                    className="inline-flex items-center justify-center space-x-2 w-full py-2 px-3 border-2 border-[#17202B] rounded-sm text-xs font-black uppercase tracking-wider text-[#142B45] bg-[#FAF9F6] hover:bg-white shadow-[2px_2px_0px_#17202B] transition"
                  >
                    <UserPlus className="w-4 h-4 text-[#E98232]" />
                    <span>Register Institutional Representative</span>
                  </Link>
                </div>
              )}

              {/* Demo Credentials for SIH Evaluation */}
              <div className="mt-5 pt-4 border-t-2 border-[#17202B]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-[#5B6875] tracking-wider">
                    Prototype Evaluation Presets
                  </span>
                  <span className="text-[10px] text-[#13603E] bg-[#EBF6F0] border border-[#18794E] px-1.5 py-0.5 rounded-sm font-mono font-bold">
                    Pass: AicteDev@2026!
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {activePortal === 'INSTITUTION' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('INSTITUTION_USER')}
                        className="text-left p-2 rounded-sm border border-[#17202B] bg-[#FAF9F6] hover:bg-white text-[11px] shadow-[1px_1px_0px_#17202B]"
                      >
                        <div className="font-bold text-[#142B45]">Apex Institute</div>
                        <div className="text-[#5B6875] text-[10px] font-mono truncate">director@apextech.ac.in</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOrUsername('principal@sahyadri.ac.in');
                          setPassword('AicteDev@2026!');
                        }}
                        className="text-left p-2 rounded-sm border border-[#17202B] bg-[#FAF9F6] hover:bg-white text-[11px] shadow-[1px_1px_0px_#17202B]"
                      >
                        <div className="font-bold text-[#142B45]">Sahyadri College</div>
                        <div className="text-[#5B6875] text-[10px] font-mono truncate">principal@sahyadri.ac.in</div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('SCRUTINY_OFFICER')}
                        className="text-left p-2 rounded-sm border border-[#17202B] bg-[#FAF9F6] hover:bg-white text-[11px] shadow-[1px_1px_0px_#17202B]"
                      >
                        <div className="font-bold text-[#142B45]">Dr. R.K. Sharma</div>
                        <div className="text-[#5B6875] text-[10px] font-mono truncate">rk.sharma@aicte.gov.in (Scrutiny)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('REGIONAL_OFFICER')}
                        className="text-left p-2 rounded-sm border border-[#17202B] bg-[#FAF9F6] hover:bg-white text-[11px] shadow-[1px_1px_0px_#17202B]"
                      >
                        <div className="font-bold text-[#142B45]">Dr. Neelesh Verma</div>
                        <div className="text-[#5B6875] text-[10px] font-mono truncate">neelesh.verma@aicte.gov.in (RO)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('EVC_EXPERT')}
                        className="text-left p-2 rounded-sm border border-[#17202B] bg-[#FAF9F6] hover:bg-white text-[11px] shadow-[1px_1px_0px_#17202B]"
                      >
                        <div className="font-bold text-[#142B45]">Prof. C.M. Rao</div>
                        <div className="text-[#5B6875] text-[10px] font-mono truncate">cm.rao@aicte.gov.in (EVC)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('MEMBER_SECRETARY')}
                        className="text-left p-2 rounded-sm border border-[#17202B] bg-[#FAF9F6] hover:bg-white text-[11px] shadow-[1px_1px_0px_#17202B]"
                      >
                        <div className="font-bold text-[#142B45]">Prof. Rajendra Prasad</div>
                        <div className="text-[#5B6875] text-[10px] font-mono truncate">rajendra.prasad@aicte.gov.in</div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-3 px-4 text-center text-xs text-[#5B6875] border-t-2 border-[#17202B] bg-white font-mono">
        <p>
          PRAVAH Approval &amp; Compliance Workflow Platform • AICTE Statutory Authority Reserved • SIH PS 26262 • Team Bit2Bramha
        </p>
      </footer>
    </div>
  );
};