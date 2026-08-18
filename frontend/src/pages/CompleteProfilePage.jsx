import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { Phone, MapPin, CheckCircle } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import { useUserStore } from '../store/useUserStore';
import { userApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

function CompleteProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const setUser = useUserStore((state) => state.setUser);
  const login = useUserStore((state) => state.login);
  const existingStoreUser = useUserStore((state) => state.user);

  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // If user already has phone in store or on backend, redirect away
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadCurrentProfile() {
      try {
        const res = await userApi.getMe();
        if (isMounted && res && res.data && res.data.user) {
          const dbUser = res.data.user;
          const phone = dbUser.phoneNumber || dbUser.mobile;
          if (phone) {
            login(dbUser);
            const redirectPath = location.state?.from || '/home';
            navigate(redirectPath, { replace: true });
            return;
          }
          if (dbUser.city) {
            setCity(dbUser.city);
          }
        }
      } catch (err) {
        // Backend user might not exist yet or first sight
      } finally {
        if (isMounted) setFetchingProfile(false);
      }
    }

    loadCurrentProfile();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, navigate, login, location.state]);

  const handleMobileChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mobile || mobile.length !== 10) {
      toast.error(t('auth.validMobile') || 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const res = await userApi.completeProfile({
        phoneNumber: mobile,
        city: city.trim(),
      });

      const updatedUser = res.data?.user || {
        name: clerkUser?.fullName || clerkUser?.firstName || 'User',
        email: clerkUser?.primaryEmailAddress?.emailAddress || '',
        mobile,
        phoneNumber: mobile,
        city: city.trim(),
      };

      login(updatedUser);
      toast.success('Profile completed successfully!');

      const redirectPath = location.state?.from || '/home';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Failed to complete profile:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to complete profile. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || fetchingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sage border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <AuthHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-sage">
            <CheckCircle size={24} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Complete Your Profile
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Welcome, {clerkUser?.firstName || 'there'}! Please provide your mobile number to get started on Broker Streets.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.mobileNumber') || 'Mobile Number'} *
              </label>
              <div className="relative flex items-center">
                <Phone size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={mobile}
                  onChange={handleMobileChange}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                  placeholder={t('auth.placeholderMobile') || 'Enter 10-digit mobile'}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.city') || 'City'} <span className="text-slate-400 font-normal">({t('common.optional') || 'Optional'})</span>
              </label>
              <div className="relative flex items-center">
                <MapPin size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                  placeholder="Enter your city (or leave blank to auto-detect)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sage/20 transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Continue to Broker Streets'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CompleteProfilePage;
