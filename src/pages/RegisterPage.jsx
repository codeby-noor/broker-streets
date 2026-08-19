import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { User, Phone, Mail, MapPin, UserPlus } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import { useUserStore } from '../store/useUserStore';
import { readUsers, writeUsers, STORAGE_KEYS, writePendingOtpMobile } from '../utils/storage';
import { sendOTP } from '../utils/otpService';
import { useLanguage } from '../i18n/LanguageContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const setUser = useUserStore((state) => state.setUser);
  const [submitting, setSubmitting] = useState(false);
  const { handleSubmit, register, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      city: '',
    },
  });

  const onSubmit = (data) => {
    const normalizedMobile = String(data.mobile || '').replace(/\D/g, '');
    const existingUsers = readUsers();
    const duplicate = Array.isArray(existingUsers)
      ? existingUsers.find((user) => String(user.mobile || '') === normalizedMobile)
      : null;

    if (duplicate) {
      toast.error(t('auth.duplicateMobile'));
      return;
    }

    const userRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
      name: data.name,
      mobile: normalizedMobile,
      whatsapp: '',
      email: data.email || '',
      city: data.city,
      state: 'Gujarat',
      district: '',
      subDistrict: '',
      profileImage: '',
      createdAt: new Date().toISOString(),
    };

    writeUsers([...(Array.isArray(existingUsers) ? existingUsers : []), userRecord]);

    setSubmitting(true);
    const otpResult = sendOTP(normalizedMobile);

    if (!otpResult.success) {
      setSubmitting(false);
      toast.error(otpResult.message);
      return;
    }

    writePendingOtpMobile(normalizedMobile);
    setSubmitting(false);

    toast.success(t('auth.registrationSuccessful'));

    navigate('/otp', {
      state: { phone: normalizedMobile, user: userRecord },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <AuthHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-sage">
            <UserPlus size={24} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t('auth.registerHeading')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              {t('auth.registerDescription')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.fullName')} *
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  {...register('name', { required: t('auth.fullNameRequired') })}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.mobileNumber')} *
              </label>
              <div className="relative flex items-center">
                <Phone size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  {...register('mobile', {
                    required: t('auth.mobileRequired'),
                    pattern: { value: /^[0-9]{10}$/, message: t('auth.validMobile') },
                  })}
                  onChange={(event) => {
                    const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 10);
                    event.target.value = digits;
                    register('mobile').onChange({ target: { name: 'mobile', value: digits } });
                  }}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                />
              </div>
              {errors.mobile && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.mobile.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.emailAddress')} ({t('common.optional')})
              </label>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="email"
                  {...register('email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.validEmail') },
                  })}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.city')} *
              </label>
              <div className="relative flex items-center">
                <MapPin size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  {...register('city', { required: t('auth.cityRequired') })}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                />
              </div>
              {errors.city && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.city.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sage/20 transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
            >
              {submitting ? t('auth.registering') : t('auth.registerButton')}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-sage hover:underline"
            >
              {t('auth.alreadyHave')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
