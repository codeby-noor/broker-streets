import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LargeButton from '../components/LargeButton';
import { toast } from 'react-toastify';
import useCountdown from '../hooks/useCountdown';
import { useUserStore } from '../store/useUserStore';
import { findUserByMobile, readPendingOtpMobile, STORAGE_KEYS, writePendingOtpMobile } from '../utils/storage';
import { getOtpSessionKey, normalizeMobile, resendOTP, verifyOTP } from '../utils/otpService';

function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [verifying, setVerifying] = useState(false);
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
    resendOTP(phone);
    writePendingOtpMobile(phone);
    inputsRef.current[0]?.focus();
    toast.info('A new OTP has been sent');
  };

  return (
    <div className="mx-auto max-w-xl rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">
        OTP Verification
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        Verify your mobile number
      </p>
      <p className="mt-2 text-sm text-slate-600">
        OTP sent to +91{' '}
        <span className="font-semibold text-slate-900">
          {phone}
        </span>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-6 gap-3">
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
              className="h-16 rounded-3xl border border-slate-200 bg-slate-50 text-center text-2xl font-semibold text-slate-900 outline-none focus:border-primary"
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <button
            type="button"
            disabled={!isComplete}
            onClick={resendOTPHandler}
            className="font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resend OTP
          </button>

          <p>
            {isComplete
              ? 'Ready to resend'
              : `Resend in ${seconds}s`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <LargeButton type="submit" disabled={verifying}>
            {verifying ? 'Verifying...' : 'Verify'}
          </LargeButton>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}

export default OTPPage;
