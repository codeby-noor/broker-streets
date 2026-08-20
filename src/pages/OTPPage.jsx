import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import useCountdown from '../hooks/useCountdown';
import { useUserStore } from '../store/useUserStore';
import { findUserByMobile, readPendingOtpMobile, STORAGE_KEYS, writePendingOtpMobile } from '../utils/storage';
import { getDebugOtpForMobile, normalizeMobile, resendOTP, verifyOTP } from '../utils/otpService';
import { useLanguage } from '../i18n/LanguageContext';

function OTPPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const [verifying, setVerifying] = useState(false);
  const [devOtp, setDevOtp] = useState(() => {
    const initialPhone = location.state?.phone || readPendingOtpMobile();
    return initialPhone ? getDebugOtpForMobile(initialPhone) : null;
  });
  const pendingPhone = readPendingOtpMobile();
  const phone = location.state?.phone || pendingPhone;
  const user = location.state?.user || (phone ? findUserByMobile(phone) : null);

  const login = useUserStore((state) => state.login);
  const setUser = useUserStore((state) => state.setUser);

  const { seconds, reset, isComplete } = useCountdown(300);

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);

  const code = useMemo(() => digits.join(''), [digits]);

  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (phone) {
      setDevOtp(getDebugOtpForMobile(phone));
    }
  }, [phone]);

  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => d === '');
    const idx = firstEmpty === -1 ? digits.length - 1 : firstEmpty;
    inputsRef.current[idx]?.focus();
  }, []);

  const updateDigit = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();

      setDigits((current) => {
        const copy = [...current];
        copy[index - 1] = '';
        return copy;
      });
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
    const values = paste.replace(/\D/g, '').slice(0, 6).split('');

    if (!values.length) return;

    const next = [...digits];
    values.forEach((digit, index) => {
      next[index] = digit;
    });

    setDigits(next);
    inputsRef.current[Math.min(values.length - 1, 5)]?.focus();
  };

  const verifyAndProceed = () => {
    if (code.length !== 6) {
      toast.error(t('auth.otpRequired'));
      return;
    }

    setVerifying(true);
    const verification = verifyOTP({ mobile: phone, otp: code });

    if (!verification.success) {
      setVerifying(false);
      toast.error(verification.message);
      return;
    }

    setDevOtp(null);

    const authenticatedUser = user || { mobile: phone };
    const normalizedMobile = normalizeMobile(authenticatedUser.mobile || phone || '');
    setUser(authenticatedUser);
    login(authenticatedUser);
    localStorage.setItem(STORAGE_KEYS.currentUserMobile, normalizedMobile);
    localStorage.setItem(STORAGE_KEYS.currentUserId, authenticatedUser.id || '');
    writePendingOtpMobile('');

    toast.success(t('auth.verifySuccess'));
    navigate('/home');
  };

  const onSubmit = (e) => {
    e.preventDefault();
    verifyAndProceed();
  };

  const resendOTPHandler = () => {
    if (!isComplete) return;

    reset();
    setDigits(['', '', '', '', '', '']);
    const result = resendOTP(phone);
    if (result.success && result.otp) {
      setDevOtp(result.otp);
    }
    writePendingOtpMobile(phone);
    inputsRef.current[0]?.focus();
    toast.success(t('auth.resendGenerated'));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 dark:bg-dark-bg dark:text-dark-text">
      <AuthHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-8 dark:border-dark-border dark:bg-dark-card">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-sage dark:bg-sage/20 dark:text-sage">
            <ShieldCheck size={24} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-dark-text">
              {t('auth.verifyAccount')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-dark-muted">
              {t('auth.verifyDescription')}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-dark-text">
              {t('auth.otpSentTo')} <span className="font-bold text-slate-900 dark:text-dark-text">+91 {phone}</span>
            </p>
          </div>

          {devOtp ? (
            <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              <p className="font-bold">{t('auth.developmentOtp')}: <span className="font-mono text-sm tracking-widest">{devOtp}</span></p>
              <p className="mt-0.5 text-slate-600 dark:text-amber-200/70">{t('auth.useOtpToComplete')}</p>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  value={digit}
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => updateDigit(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 text-center text-lg font-bold text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:focus:bg-dark-card"
                />
              ))}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
              <button
                type="button"
                disabled={!isComplete}
                onClick={resendOTPHandler}
                className="font-bold text-sage hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-sage"
              >
                {t('auth.resendOtp')}
              </button>

              <span className="font-medium text-slate-500 dark:text-dark-muted">
                {isComplete ? t('auth.readyToResend') : `${t('auth.resendIn')} ${seconds}s`}
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="submit"
                disabled={verifying}
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sage/20 transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
              >
                {verifying ? t('auth.verifying') : t('auth.verify')}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-bg"
              >
                <ArrowLeft size={16} />
                {t('common.back')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default OTPPage;
