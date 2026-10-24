import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GeometricMark } from '../components/common/GeometricMark';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
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
  HelpCircle,
} from 'lucide-react';

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

      // Resolve intended redirect: Institution users go to /institution/dashboard
      const fromPath = (location.state as any)?.from?.pathname;
      if (fromPath && fromPath !== '/login') {
        navigate(fromPath, { replace: true });
      } else if (user.role === 'INSTITUTION_USER') {
        navigate('/institution/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-gov-navy-800 selection:text-white">
      {/* Prototype Environment Notice */}
      <div className="bg-amber-50 border-b border-amber-200 py-1.5 px-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-amber-900 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>SAKSHAM Prototype Environment — SIH Problem Statement 26262</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* SAKSHAM Brand Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <GeometricMark size={52} />
            </div>
            <h1 className="text-2xl font-black text-gov-navy-950 tracking-tight">
              SAKSHAM
            </h1>
            <p className="text-xs font-bold text-gov-navy-800 uppercase tracking-widest mt-0.5">
              AICTE Approval Workflow & Compliance Management System
            </p>
            <p className="text-xs text-slate-600 italic mt-1 font-serif">
              “Intelligent Scrutiny. Automated Workflows. Transparent Compliance.”
            </p>
          </div>

          {/* Portal Selector Toggle */}
          <div className="bg-slate-200/80 p-1 rounded-xl grid grid-cols-2 gap-1 mb-5 border border-slate-300">
            <button
              type="button"
              onClick={() => handlePortalSwitch('INSTITUTION')}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'INSTITUTION'
                  ? 'bg-white text-gov-navy-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Institution Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch('OFFICER')}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'OFFICER'
                  ? 'bg-white text-gov-navy-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>AICTE Officer Portal</span>
            </button>
          </div>

          {/* Central Sign-in Card */}
          <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 border border-slate-200 rounded-2xl sm:px-10">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                {activePortal === 'INSTITUTION' ? 'Sign in to Institution Portal' : 'AICTE Officer Authorization'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activePortal === 'INSTITUTION'
                  ? 'Manage university/polytechnic approval applications and compliance'
                  : 'Scrutiny officers, regional bureaus, EVC panels, and secretariat'}
              </p>
            </div>

            {/* Error Message */}
            {activeError && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">{activeError}</span>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activePortal === 'INSTITUTION' ? 'Official Institutional Email' : 'Officer Email / NIC User ID'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder={activePortal === 'INSTITUTION' ? 'director@college.edu.in' : 'officer@aicte.gov.in'}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600 focus:border-transparent transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password / Digital Token
                  </label>
                  {activePortal === 'INSTITUTION' && (
                    <Link
                      to="/institution/forgot-password"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600 focus:border-transparent transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
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
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-gov-navy-950 hover:bg-gov-navy-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-navy-900 shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1.5">
                      <span>Sign In Securely</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Institution Registration Link */}
            {activePortal === 'INSTITUTION' && (
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600 mb-2">
                  New institution representative or unassociated PID?
                </p>
                <Link
                  to="/institution/signup"
                  className="inline-flex items-center justify-center space-x-1.5 w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Register Institutional Representative</span>
                </Link>
              </div>
            )}

            {/* Demo Quick-Fill Presets for Seamless SIH Demo */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Prototype Demo Credentials
                </span>
                <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  Argon2id Hash Verified
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {activePortal === 'INSTITUTION' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('INSTITUTION_USER')}
                      className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition text-[11px]"
                    >
                      <div className="font-semibold text-slate-800">Apex Institute</div>
                      <div className="text-slate-500 text-[10px]">director@apextech.ac.in</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailOrUsername('principal@sahyadri.ac.in');
                        setPassword('AicteDev@2026!');
                      }}
                      className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition text-[11px]"
                    >
                      <div className="font-semibold text-slate-800">Sahyadri College</div>
                      <div className="text-slate-500 text-[10px]">principal@sahyadri.ac.in</div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('SCRUTINY_OFFICER')}
                      className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                    >
                      <div className="font-semibold text-slate-800">Dr. R.K. Sharma</div>
                      <div className="text-slate-500 text-[10px]">Scrutiny Officer</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('REGIONAL_OFFICER')}
                      className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                    >
                      <div className="font-semibold text-slate-800">Dr. Neelesh Verma</div>
                      <div className="text-slate-500 text-[10px]">Regional Officer (CRO)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('EVC_EXPERT')}
                      className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                    >
                      <div className="font-semibold text-slate-800">Prof. C.M. Rao</div>
                      <div className="text-slate-500 text-[10px]">EVC Committee</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('MEMBER_SECRETARY')}
                      className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                    >
                      <div className="font-semibold text-slate-800">Member Secretary</div>
                      <div className="text-slate-500 text-[10px]">National Bureau</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>
          SAKSHAM Approval & Compliance Workflow Platform • All AICTE statutory powers remain vested in authorized committee authorities.
        </p>
      </footer>
    </div>
  );
};
