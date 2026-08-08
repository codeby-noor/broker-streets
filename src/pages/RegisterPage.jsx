import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LargeButton from '../components/LargeButton';
import logo from '../assets/images/logo.png';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useUserStore } from '../store/useUserStore';
import { readUsers, writeUsers, STORAGE_KEYS, writePendingOtpMobile } from '../utils/storage';
import { sendOTP } from '../utils/otpService';

function RegisterPage() {
  const navigate = useNavigate();
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
      toast.error('This mobile number is already registered. Please login.');
      return;
    }

    const userRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
      name: data.name,
      mobile: normalizedMobile,
      whatsapp: '',
      email: data.email || '',
      city: data.city,
      state: 'Gujarat', district: '', subDistrict: '',
      profileImage: '',
      createdAt: new Date().toISOString(),
    };

    writeUsers([...(Array.isArray(existingUsers) ? existingUsers : []), userRecord]);
    setUser(userRecord);
    localStorage.setItem(STORAGE_KEYS.currentUserMobile, normalizedMobile);
    localStorage.setItem(STORAGE_KEYS.currentUserId, userRecord.id);

    setSubmitting(true);
    const otpResult = sendOTP(normalizedMobile);

    if (!otpResult.success) {
      setSubmitting(false);
      toast.error(otpResult.message);
      return;
    }

    writePendingOtpMobile(normalizedMobile);
    setSubmitting(false);

    toast.success('Registration successful');

    navigate('/otp', {
      state: { phone: normalizedMobile, user: userRecord },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:max-w-2xl sm:p-8">
        <div className="mx-auto mb-6 h-14 w-14 overflow-hidden rounded-3xl bg-slate-100">
          <img src={logo} alt="Broker Streets logo" className="h-full w-full object-contain" />
        </div>
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <h1 className="text-3xl font-semibold text-slate-900">Register</h1>
          <p className="mx-auto max-w-xs text-sm leading-6 text-slate-600 sm:mx-0">Enter your details to start buying or selling property.</p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="inline-flex items-center justify-center rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
          >
            Admin Login
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Full Name *</label>
            <input
              type="text"
              {...register('name', { required: 'Full Name is required' })}
              className="w-full min-h-[56px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Mobile Number *</label>
            <input
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              {...register('mobile', { required: 'Mobile is required', pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit mobile number' } })}
              onChange={(event) => {
                const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 10);
                event.target.value = digits;
                const field = event.target.name;
                const next = { target: { name: field, value: digits } };
                register('mobile').onChange(next);
              }}
              className="w-full min-h-[56px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {errors.mobile && <p className="mt-2 text-sm text-red-600">{errors.mobile.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Email Address (Optional)</label>
            <input
              type="email"
              {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } })}
              className="w-full min-h-[56px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">City *</label>
            <input
              type="text"
              {...register('city', { required: 'City is required' })}
              className="w-full min-h-[56px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {errors.city && <p className="mt-2 text-sm text-red-600">{errors.city.message}</p>}
          </div>

          <div className="flex flex-col gap-4 pt-2 text-sm text-slate-600">
            <button type="button" onClick={() => navigate('/login')} className="font-semibold text-primary text-left">Already have an account? Login</button>
            <button type="button" onClick={() => navigate('/admin/login')} className="font-semibold text-primary text-left">Admin Login</button>
          </div>

          <LargeButton type="submit" disabled={submitting}>{submitting ? 'Registering...' : 'Register'}</LargeButton>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
