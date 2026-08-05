import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LargeButton from '../components/LargeButton';
import { findUserByMobile, writePendingOtpMobile } from '../utils/storage';
import { normalizeMobile, sendOTP } from '../utils/otpService';

function LoginPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedMobile = normalizeMobile(mobile);

    if (!normalizedMobile) {
      toast.error('Please enter your mobile number');
      return;
    }

    const user = findUserByMobile(normalizedMobile);

    if (!user) {
      toast.error('No account found. Please register first.');
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
    toast.success('OTP sent successfully');
    navigate('/otp', {
      state: {
        phone: normalizedMobile,
        user,
      },
    });
  };

  return (
    <div className="mx-auto max-w-xl rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">Login</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your registered mobile number to continue to Broker Streets.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-primary"
            placeholder="Enter 10-digit mobile"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LargeButton type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Login'}</LargeButton>
          <button type="button" onClick={() => navigate('/register')} className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 hover:bg-slate-50">
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
