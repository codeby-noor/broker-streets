import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { Mail, Lock, LogIn } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import { useUserStore } from '../store/useUserStore';
import { userApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const login = useUserStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      navigate('/complete-profile', { replace: true });
    }
  }, [isSignedIn, navigate]);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/complete-profile',
        oidcPrompt: 'select_account',
      });
    } catch (err) {
      console.error('Google Sign-In error:', err);
      toast.error(err.errors?.[0]?.message || 'Failed to sign in with Google.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoaded || !signIn) return;

    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });

        // Check whether user already has a phone number on file
        try {
          const profileRes = await userApi.getMe();
          const dbUser = profileRes?.data?.user;
          const phone = dbUser?.phoneNumber || dbUser?.mobile;

          if (phone) {
            login(dbUser);
            toast.success(t('auth.verifySuccess') || 'Login successful!');
            navigate('/home');
            return;
          }
        } catch (profileErr) {
          // In case user profile is pending completion
        }

        toast.info('Please complete your profile to continue.');
        navigate('/complete-profile');
      } else {
        console.warn('Sign-In status not complete:', result.status);
        toast.info('Additional authentication step required.');
      }
    } catch (err) {
      console.error('Sign-In error:', err);
      const errMsg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Invalid email or password';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <AuthHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-sage">
            <LogIn size={24} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t('auth.loginHeading')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Sign in to your Broker Streets account to manage your property inquiries.
            </p>
          </div>

          {/* Continue with Google */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.emailAddress') || 'Email Address'} *
              </label>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password *
              </label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sage focus:bg-white focus:ring-2 focus:ring-sage/20"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sage/20 transition hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : (t('auth.loginButton') || 'Sign In')}
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
