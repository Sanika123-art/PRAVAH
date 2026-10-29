import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GeometricMark } from '../../components/common/GeometricMark';
import { IndiaFlag } from '../../components/common/GovtEmblem';
import { verifyEmail } from '../../services/authService';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (tokenToUse: string) => {
    if (!tokenToUse.trim()) {
      setErrorMessage('Verification token is missing.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await verifyEmail(tokenToUse.trim());
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Email verification failed. The link may have expired.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

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
            INSTITUTIONAL EMAIL VERIFICATION
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-sm border-2 border-[#17202B] shadow-[4px_4px_0px_#17202B] text-center space-y-4">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-[#EBF6F0] text-[#18794E] border-2 border-[#18794E] rounded-sm flex items-center justify-center mx-auto shadow-[2px_2px_0px_#18794E]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-[#142B45] uppercase">
                Email Address Verified!
              </h2>
              <p className="text-xs text-[#5B6875] leading-relaxed">
                Your institutional representative credentials have been authenticated. You may now sign in to the PRAVAH Institution Desk.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-sm bg-[#142B45] hover:bg-[#0A1B38] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] transition"
                >
                  <span>Sign In to Institution Portal</span>
                  <ArrowRight className="w-4 h-4 text-[#E98232]" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#EAF0F5] text-[#142B45] border-2 border-[#17202B] rounded-sm flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0px_#17202B]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-base font-black text-[#142B45] uppercase">
                  Verify Representative Account
                </h2>
                {emailFromUrl && (
                  <p className="text-xs text-[#5B6875] mt-1 font-mono">
                    Verifying email: <strong>{emailFromUrl}</strong>
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-sm bg-[#FDF2F2] border-2 border-[#C5221F] text-[#C5221F] text-xs font-bold flex items-start space-x-2 shadow-[2px_2px_0px_#C5221F]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-mono">{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-[#142B45]">
                  Verification Token *
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste verification token here..."
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerify(token)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-sm bg-[#142B45] hover:bg-[#0A1B38] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] transition disabled:opacity-50"
                >
                  {isVerifying ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <span>Authenticate Verification Token</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-[#E98232]" />
                </button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-bold text-[#B45309] hover:underline">
                  Return to Portal Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="py-3 px-4 text-center text-xs text-[#5B6875] border-t-2 border-[#17202B] bg-white font-mono">
        PRAVAH AICTE Portal • Cryptographic Representative Authentication Subsystem
      </footer>
    </div>
  );
};
