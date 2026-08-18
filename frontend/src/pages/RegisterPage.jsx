import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { User, Phone, Mail, MapPin, Lock, UserPlus, KeyRound } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import { useUserStore } from '../store/useUserStore';
import { userApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLoaded, signUp, setActive } = useSignUp();
  const login = useUserStore((state) => state.login);

  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState(null);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      password: '',
      city: '',
    },
  });

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      console.error('Google Sign-Up error:', err);
      toast.error(err.errors?.[0]?.message || 'Failed to sign up with Google.');
    }
  };

  const onSubmit = async (data) => {
    if (!isLoaded || !signUp) return;

    const normalizedMobile = String(data.mobile || '').replace(/\D/g, '');
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      toast.error(t('auth.validMobile') || 'Please enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);

    try {
      const nameParts = (data.name || '').trim().split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 1. Create Clerk user with email & password
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName,
        lastName,
      });

      // 2. Prepare email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setFormData({
        ...data,
        mobile: normalizedMobile,
        firstName,
        lastName,
      });
      setPendingVerification(true);
      toast.info('Verification code sent to your email.');
    } catch (err) {
      console.error('Sign-Up error:', err);
      const errMsg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Failed to register';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!isLoaded || !signUp || !verificationCode) return;

    setVerifying(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });

        // Save phone and city to MongoDB via profile endpoint
        try {
          await userApi.completeProfile({
            phoneNumber: formData.mobile,
            city: formData.city || '',
          });
        } catch (apiErr) {
          console.warn('Profile completion API call warning:', apiErr);
        }

        login({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          phoneNumber: formData.mobile,
          city: formData.city || '',
        });

        toast.success(t('auth.registrationSuccessful') || 'Registration successful!');
        navigate('/home');
      } else {
        console.warn('Sign-Up verification status not complete:', completeSignUp.status);
        toast.info('Please complete required verification steps.');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      const errMsg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Invalid verification code';
      toast.error(errMsg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <AuthHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-sage">
            {pendingVerification ? <KeyRound size={24} /> : <UserPlus size={24} />}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {pendingVerification ? 'Verify Your Email' : t('auth.registerHeading')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              {pendingVerification
                ? `Enter the 6-digit verification code sent to ${formData?.email}`
                : t('auth.registerDescription')}
            </p>
          </div>

          {!pendingVerification ? (
            <>
              {/* Continue with Google */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sage/30"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-5 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200" />
                  <span className="absolute bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    or
                  </span>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('auth.fullName')} *
                  </label>
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-3.5 text-slate-400" />
                    <input
                      type="text"
                      {...register('name', { required: t('auth.fullNameRequired') || 'Full Name is required' })}
                      className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                      placeholder="Enter your full name"
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
                      maxLength={10}
                      {...register('mobile', {
                        required: t('auth.mobileRequired') || 'Mobile number is required',
                        pattern: { value: /^[0-9]{10}$/, message: t('auth.validMobile') || 'Enter a valid 10-digit mobile number' },
                      })}
                      className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                      placeholder={t('auth.placeholderMobile') || 'Enter 10-digit mobile'}
                    />
                  </div>
                  {errors.mobile && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.mobile.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('auth.emailAddress')} *
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-3.5 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      {...register('email', {
                        required: 'Email address is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.validEmail') || 'Enter a valid email address' },
                      })}
                      className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                      placeholder="name@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-3.5 text-slate-400" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      })}
                      className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                      placeholder="Create a strong password (min 8 chars)"
                    />
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('auth.city')} <span className="text-slate-400 font-normal">({t('common.optional') || 'Optional'})</span>
                  </label>
                  <div className="relative flex items-center">
                    <MapPin size={18} className="absolute left-3.5 text-slate-400" />
                    <input
                      type="text"
                      {...register('city')}
                      className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                      placeholder="Enter your city"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sage/20 transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
                >
                  {submitting ? (t('auth.registering') || 'Creating account...') : (t('auth.registerButton') || 'Create Account')}
                </button>
              </form>
            </>
          ) : (
            /* Email OTP Verification Form */
            <form onSubmit={handleVerifyEmail} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Verification Code
                </label>
                <div className="relative flex items-center">
                  <KeyRound size={18} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.trim())}
                    className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-center text-lg font-bold tracking-widest text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || verificationCode.length < 4}
                className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sage/20 transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify & Complete Registration'}
              </button>

              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Back to registration form
              </button>
            </form>
          )}

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
