import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LargeButton from '../components/LargeButton';
import logo from '../assets/images/logo.png';
import { findUserByMobile, writePendingOtpMobile } from '../utils/storage';
import { normalizeMobile, sendOTP } from '../utils/otpService';
import { useLanguage } from '../i18n/LanguageContext';

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedMobile = normalizeMobile(mobile);

    if (!normalizedMobile) {
      toast.error(t('auth.enterMobile'));
      return;
    }

    const user = findUserByMobile(normalizedMobile);

    if (!user) {
      toast.error(t('auth.accountNotFound'));
      return;
    }

    setLoading(true);
    const otpResult = sendOTP(normalizedMobile);

    if (!otpResult.success) {
      setLoading(false);
      toast.error(otpResult.message);
      return;
    }

    writePendingOtpMobile(normalizedMobile);
    setLoading(false);
    toast.success(t('auth.otpSent'));
    navigate('/otp', {
      state: {
        phone: normalizedMobile,
        user,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-md flex-col gap-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto h-14 w-14 overflow-hidden rounded-3xl bg-slate-100">
          <img src={logo} alt="Broker Streets logo" className="h-full w-full object-contain" />
        </div>
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">{t('auth.loginHeading')}</h1>
          <p className="mx-auto max-w-xs text-sm leading-6 text-slate-600">{t('auth.loginDescription')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">{t('auth.mobileNumber')}</label>
            <input
              type="tel"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              className="w-full min-h-[56px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder={t('auth.placeholderMobile')}
            />
          </div>
          <div className="space-y-3">
            <LargeButton type="submit" disabled={loading}>{loading ? t('auth.sendingOtp') : t('auth.loginButton')}</LargeButton>
            <button type="button" onClick={() => navigate('/register')} className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50">
              {t('auth.createAccount')}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-slate-500">
          {t('auth.noAccount')} <button type="button" onClick={() => navigate('/register')} className="font-semibold text-primary underline-offset-4 hover:underline">{t('auth.createOneNow')}</button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
