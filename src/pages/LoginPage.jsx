import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Phone, LogIn } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import { findUserByMobile, writePendingOtpMobile } from '../utils/storage';
import { normalizeMobile, sendOTP } from '../utils/otpService';
import { useLanguage } from '../i18n/LanguageContext';

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMobileChange = (event) => {
    const sanitized = event.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(sanitized);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const sanitizedMobile = mobile.replace(/\D/g, '').slice(0, 10);

    if (!sanitizedMobile || sanitizedMobile.length !== 10) {
      toast.error(t('auth.validMobile'));
      return;
    }

    const normalizedMobile = normalizeMobile(sanitizedMobile);

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
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <AuthHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-sage">
            <LogIn size={24} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t('auth.loginHeading')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              {t('auth.loginDescription')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.mobileNumber')}
              </label>
              <div className="relative flex items-center">
                <Phone size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={handleMobileChange}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                  placeholder={t('auth.placeholderMobile')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sage/20 transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
            >
              {loading ? t('auth.sendingOtp') : t('auth.loginButton')}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
            {t('auth.noAccount')}{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-bold text-sage underline-offset-4 hover:underline"
            >
              {t('auth.createOneNow')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
