import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  gujaratStateOptions,
  gujaratDistricts,
  gujaratSubDistricts,
} from '../utils/data';
import LargeButton from '../components/LargeButton';
import { toast } from 'react-toastify';
import { useUserStore } from '../store/useUserStore';

function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);
  const { control, handleSubmit, watch, register, formState: { errors } } = useForm({
    defaultValues: {
  name: '',
  mobile: '',
  email: '',
  state: 'Gujarat',
  district: '',
  subDistrict: '',
}
  });

 const district = watch('district');
  const onSubmit = (data) => {
  setUser(data);

  localStorage.setItem('currentUserMobile', data.mobile);

  toast.success('Registration successful');

  navigate('/otp', {
    state: { phone: data.mobile },
  });
};

  return (
    <div className="mx-auto max-w-2xl rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Register</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your details to start buying or selling property.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/login')}
          className="inline-flex items-center justify-center self-start rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
        >
          Admin Login
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Full Name</label>
          <input
            type="text"
            {...register('name', { required: 'Full Name is required' })}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-primary"
          />
          {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Mobile Number</label>
          <input
            type="tel"
            {...register('mobile', { required: 'Mobile is required', pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit mobile number' } })}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-primary"
          />
          {errors.mobile && <p className="mt-2 text-sm text-red-600">{errors.mobile.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Email Address (optional)</label>
          <input
            type="email"
            {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } })}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-primary"
          />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">State</label>
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-primary"
                >{gujaratStateOptions.map((state) => (
  <option key={state.value} value={state.value}>
    {state.label}
  </option>
))}
                
                </select>
              )}
            />
          </div>
          <div>
  <label className="mb-2 block text-sm font-semibold text-slate-800">
    District
  </label>

  <Controller
    control={control}
    name="district"
    render={({ field }) => (
      <select
        {...field}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-primary"
      >
        <option value="">Select District</option>

        {gujaratDistricts.map((district) => (
          <option key={district} value={district}>
            {district}
          </option>
        ))}
      </select>
    )}
  />
</div>
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-800">
    Sub District / Taluka
  </label>

  <Controller
    control={control}
    name="subDistrict"
    render={({ field }) => (
      <select
        {...field}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-primary"
      >
        <option value="">Select Taluka</option>

        {(gujaratSubDistricts[district] || []).map((taluka) => (
          <option key={taluka} value={taluka}>
            {taluka}
          </option>
        ))}
      </select>
    )}
  />
</div>
          
        </div>
        <LargeButton type="submit">Register</LargeButton>
      </form>
    </div>
  );
}

export default RegisterPage;
