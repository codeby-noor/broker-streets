import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LargeButton from '../components/LargeButton';
import logo from '../assets/images/logo.png';
import { toast } from 'react-toastify';
import useCountdown from '../hooks/useCountdown';
import { useUserStore } from '../store/useUserStore';
import { findUserByMobile, readPendingOtpMobile, STORAGE_KEYS, writePendingOtpMobile } from '../utils/storage';
import { getDebugOtpForMobile, normalizeMobile, resendOTP, verifyOTP } from '../utils/otpService';

function OTPPage() {
  const navigate = useNavigate();
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

    const paste =
      (e.clipboardData || window.clipboardData).getData('text') || '';

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
      toast.error('Please enter the 6-digit code');
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

    toast.success('Login Successful');

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
    toast.success('A new OTP has been generated. Use the displayed code to verify.');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto mb-6 h-14 w-14 overflow-hidden rounded-3xl bg-slate-100">
          <img src={logo} alt="Broker Streets logo" className="h-full w-full object-contain" />
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="text-3xl font-semibold text-slate-900">Verify your account</h1>
          <p className="mx-auto max-w-xs text-sm leading-6 text-slate-600 sm:mx-0">
            Enter the 6-digit code sent to your mobile number.
          </p>
          <p className="text-sm text-slate-600">
            OTP sent to <span className="font-semibold text-slate-900">+91 {phone}</span>
          </p>
        </div>

      {devOtp ? (
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 shadow-sm sm:px-5 sm:py-4" role="status" aria-live="polite">
          <p className="font-semibold text-slate-900">Development OTP: <span className="font-mono text-base tracking-[0.2em] sm:text-lg">{devOtp}</span></p>
          <p className="mt-1 text-sm text-slate-600">Use this OTP to complete verification.</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-6 gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              value={digit}
              maxLength={1}
              inputMode="numeric"
              onChange={(e) =>
                updateDigit(index, e.target.value.replace(/\D/g, ''))
              }
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="min-h-[56px] min-w-[48px] rounded-3xl border border-slate-200 bg-slate-50 text-center text-2xl font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={!isComplete}
            onClick={resendOTPHandler}
            className="font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resend OTP
          </button>

          <p className="text-center sm:text-left">
            {isComplete ? 'Ready to resend' : `Resend in ${seconds}s`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <LargeButton type="submit" disabled={verifying}>
            {verifying ? 'Verifying...' : 'Verify'}
          </LargeButton>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50 sm:w-auto"
          >
            Back
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default OTPPage;
