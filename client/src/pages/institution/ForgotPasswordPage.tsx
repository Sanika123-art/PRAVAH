import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GeometricMark } from '../../components/common/GeometricMark';
import { IndiaFlag } from '../../components/common/GovtEmblem';
import { forgotPassword, fetchDevEmails } from '../../services/authService';
import { CheckCircle2, AlertCircle, ArrowRight, KeyRound, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);

      const outbox = await fetchDevEmails();
      const match = outbox.find((item) => item.to.toLowerCase() === email.trim().toLowerCase());
      if (match && match.token) {
        setDevResetToken(match.token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#17202B] flex flex-col justify-between selection:bg-[#142B45] selection:text-white">
      {/* 1. National Accent Ribbon */}
      <div className="gov-accent-stripe" aria-hidden="true" />

      {/* 2. Top Header Bar */}
      <div className="bg-[#0A1B38] text-white text-[11px] py-1.5 px-4 sm:px-8 border-b-2 border-[#17202B] flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <IndiaFlag width={20} height={13} />
          <span className="font-bold tracking-wide">AICTE National Approval Portal</span>
        </div>
        <span className="font-mono text-[10px] text-[#E98232] font-bold">
          SIH PS 26262 • Bit2Bramha
        </span>
      </div>

      <div className="py-12 px-4 sm:px-6 lg:px-8 sm:mx-auto sm:w-full sm:max-w-md flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <GeometricMark size={48} />
          </div>
          <h1 className="text-2xl font-black text-[#142B45] tracking-tight">
            PRAVAH
          </h1>
          <p className="text-xs font-black text-[#B45309] uppercase tracking-widest font-mono mt-0.5">
            INSTITUTIONAL PASSWORD RECOVERY
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-sm border-2 border-[#17202B] shadow-[4px_4px_0px_#17202B]">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-[#EBF6F0] text-[#18794E] border-2 border-[#18794E] rounded-sm flex items-center justify-center mx-auto shadow-[2px_2px_0px_#18794E]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-base font-black text-[#142B45] uppercase">
                Reset Dispatch Transmitted
              </h2>
              <p className="text-xs text-[#5B6875] leading-relaxed">
                If <strong>{email}</strong> is registered with an authorized institution dossier, reset instructions have been dispatched.
              </p>

              {devResetToken && (
                <div className="p-3 bg-[#FFF7ED] border-2 border-[#B45309] rounded-sm text-left text-xs space-y-1.5 shadow-[2px_2px_0px_#B45309]">
                  <div className="font-black text-[#B45309] uppercase text-[10px]">
                    Local Prototype Reset Token
                  </div>
                  <div className="font-mono bg-white p-2 rounded-sm border border-[#17202B] break-all text-[11px] font-bold text-[#142B45]">
                    {devResetToken}
                  </div>
                  <Link
                    to={`/institution/reset-password?token=${devResetToken}`}
                    className="inline-block text-xs font-black uppercase text-[#B45309] underline hover:text-[#8C3D0E]"
                  >
                    Click to Reset Password Directly &rarr;
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-4 rounded-sm bg-[#142B45] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] hover:bg-[#0A1B38]"
                >
                  Return to Portal Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4 pb-2 border-b-2 border-[#17202B]">
                <h2 className="text-base font-black text-[#142B45]">
                  Password Reset Request
                </h2>
                <p className="text-xs text-[#5B6875] mt-0.5 font-medium">
                  Enter your registered institutional representative email address
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-sm bg-[#FDF2F2] border-2 border-[#C5221F] text-[#C5221F] text-xs font-bold flex items-start space-x-2 shadow-[2px_2px_0px_#C5221F]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-mono">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase text-[#142B45] mb-1">
                  Registered Institutional Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@apextech.ac.in"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-[#5B6875] absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-sm bg-[#142B45] hover:bg-[#0A1B38] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Dispatching Token...</span>
                  ) : (
                    <span>Transmit Password Reset Link</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-[#E98232]" />
                </button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-bold text-[#B45309] hover:underline">
                  Return to Portal Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="py-3 px-4 text-center text-xs text-[#5B6875] border-t-2 border-[#17202B] bg-white font-mono">
        PRAVAH AICTE Portal • Secure Institutional Password Recovery Subsystem
      </footer>
    </div>
  );
};
