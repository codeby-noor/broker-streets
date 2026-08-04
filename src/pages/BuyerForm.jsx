import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle2, ChevronRight, Home, Sparkles } from 'lucide-react';
import { appendStorageArray, STORAGE_KEYS } from '../utils/storage';
import { useUserStore } from '../store/useUserStore';
import {
  gujaratStateOptions,
  gujaratDistricts,
  gujaratSubDistricts,
} from '../utils/data';
const initialForm = {
  name: '',
  mobile: '',
  whatsapp: '',
  email: '',

  state: 'Gujarat',
  district: '',
  subDistrict: '',

  propertyType: '',
  budget: '',
  requirements: '',
  consent: false,
};
const propertyTypes = ['Apartment', 'Villa', 'Bungalow', 'Commercial', 'Office', 'Shop', 'Plot', 'Farm House'];

function BuyerForm() {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const [form, setForm] = useState({
    ...initialForm,
    name: currentUser?.name || '',
    mobile: currentUser?.mobile || '',
    whatsapp: currentUser?.whatsapp || '',
    email: currentUser?.email || '',
    state: currentUser?.state || 'Gujarat',
    district: currentUser?.district || '',
    subDistrict: currentUser?.subDistrict || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
const [isRecording, setIsRecording] = useState(false);
const [audioUrl, setAudioUrl] = useState('');

const mediaRecorderRef = useRef(null);
const chunksRef = useRef([]);
  const progress = useMemo(() => {
  const requiredFields = [
  'name',
  'mobile',
  'state',
  'district',
  'subDistrict',
  'propertyType',
  'budget',
  'consent',
];
    const completed = requiredFields.filter((field) => {
      const value = form[field];
      return typeof value === 'boolean' ? value : String(value || '').trim();
    }).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [form]);

  const handleChange = (event) => {
  const { name, value, type, checked } = event.target;

  if (name === 'district') {
    setForm((current) => ({
      ...current,
      district: value,
      subDistrict: '',
    }));
  } else {
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  setErrors((current) => ({
    ...current,
    [name]: '',
  }));
};
  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Please share your full name.';
    if (!/^[0-9]{10}$/.test(form.mobile)) nextErrors.mobile = 'A valid 10-digit mobile number is required.';
    if (!form.state.trim()) nextErrors.state = 'Please select your state.';
    if (!form.district) nextErrors.district = 'Please select district.';
if (!form.subDistrict) nextErrors.subDistrict = 'Please select sub district.';
    if (!form.propertyType) nextErrors.propertyType = 'Please choose a property type.';
    if (!form.budget.trim()) nextErrors.budget = 'Budget helps us tailor results.';
    
    if (!form.consent) nextErrors.consent = 'Please confirm that you want to be contacted.';
    return nextErrors;
  };
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: 'audio/webm',
      });

      setAudioUrl(URL.createObjectURL(blob));

      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setIsRecording(true);
  } catch (err) {
    toast.error('Microphone permission denied.');
  }
};

const stopRecording = () => {
  mediaRecorderRef.current.stop();
  setIsRecording(false);
};
  const handleSubmit = (event) => {
  event.preventDefault();

  const nextErrors = validate();

  if (Object.keys(nextErrors).length) {
    setErrors(nextErrors);
    toast.error('Please correct the highlighted fields before continuing.');
    return;
  }

  setSubmitting(true);

  setTimeout(() => {
    const lead = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `buyer-${Date.now()}`,
      userId: currentUser?.id || '',
      ...form,
      voiceRecording: audioUrl,
      createdAt: new Date().toISOString(),
    };

    appendStorageArray(STORAGE_KEYS.buyerLeads, lead);

    const mobile = currentUser?.mobile || localStorage.getItem('currentUserMobile');

    if (mobile) {
      localStorage.setItem(`buyerFormSubmitted_${mobile}`, 'true');
    }

    setSubmitting(false);

    toast.success('Your buyer profile has been submitted successfully.');

    navigate('/buy', {
      replace: true,
      state: {
        justSubmitted: true,
        lead,
      },
    });
  }, 700);
};

  return (
    <div className="min-h-screen bg-[#FFFEFE] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 rounded-[32px] border border-slate-200 bg-white p-6 shadow-card sm:p-8 lg:p-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles size={16} /> Premium buyer profile
          </div>

          <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-ink">
              <span>Profile completion</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted">We use this information to curate the best shortlist for you.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-6">
              <label className="block w-full">
                <span className="field-label">Full Name *</span>
                <input name="name" value={form.name} onChange={handleChange} className={`field-control ${errors.name ? 'border-red-400' : ''}`} placeholder="Enter your full name" />
                {errors.name ? <p className="error-style">{errors.name}</p> : null}
              </label>
              <label className="block w-full">
                <span className="field-label">Mobile Number *</span>
                <input name="mobile" value={form.mobile} onChange={handleChange} className={`field-control ${errors.mobile ? 'border-red-400' : ''}`} placeholder="10-digit mobile" />
                {errors.mobile ? <p className="error-style">{errors.mobile}</p> : null}
              </label>
              <label className="block w-full">
                <span className="field-label">WhatsApp Number</span>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="field-control" placeholder="Optional" />
              </label>
              <label className="block w-full">
                <span className="field-label">Email</span>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="field-control" placeholder="name@email.com" />
              </label>
             </div>
             <div className="rounded-[24px] border border-slate-200 bg-white p-5">
  <h2 className="text-lg font-semibold text-ink">
    Your Preference
  </h2>

  <div className="mt-4 space-y-6">

    {/* Preferred State */}

    <label className="block w-full">
      <span className="field-label">Preferred State *</span>

      <select
        name="state"
        value={form.state}
        onChange={handleChange}
        className={`field-control ${errors.state ? 'border-red-400' : ''}`}
      >
        {gujaratStateOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {errors.state && (
        <p className="error-style">{errors.state}</p>
      )}
    </label>

    {/* Preferred District */}

    <label className="block w-full">
      <span className="field-label">Preferred District *</span>

      <select
        name="district"
        value={form.district}
        onChange={handleChange}
        className={`field-control ${errors.district ? 'border-red-400' : ''}`}
      >
        <option value="">Select District</option>

        {gujaratDistricts.map((district) => (
          <option key={district} value={district}>
            {district}
          </option>
        ))}
      </select>

      {errors.district && (
        <p className="error-style">{errors.district}</p>
      )}
    </label>

    {/* Preferred Sub District */}

    <label className="block w-full">
      <span className="field-label">
        Preferred Sub District / Taluka *
      </span>

      <select
        name="subDistrict"
        value={form.subDistrict}
        onChange={handleChange}
        className={`field-control ${errors.subDistrict ? 'border-red-400' : ''}`}
      >
        <option value="">Select Sub District</option>

        {(gujaratSubDistricts[form.district] || []).map((taluka) => (
          <option key={taluka} value={taluka}>
            {taluka}
          </option>
        ))}
      </select>

      {errors.subDistrict && (
        <p className="error-style">{errors.subDistrict}</p>
      )}
    </label>

    {/* Property Type */}

    <label className="block w-full">
      <span className="field-label">Property Type *</span>

      <select
        name="propertyType"
        value={form.propertyType}
        onChange={handleChange}
        className={`field-control ${errors.propertyType ? 'border-red-400' : ''}`}
      >
        <option value="">Select</option>

        {propertyTypes.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {errors.propertyType && (
        <p className="error-style">{errors.propertyType}</p>
      )}
    </label>

    {/* Budget */}

    <label className="block w-full">
      <span className="field-label">Budget *</span>

      <input
        name="budget"
        value={form.budget}
        onChange={handleChange}
        className={`field-control ${errors.budget ? 'border-red-400' : ''}`}
        placeholder="e.g. ₹50 Lakh"
      />

      {errors.budget && (
        <p className="error-style">{errors.budget}</p>
      )}
    </label>

    {/* Additional Requirements */}

    <label className="block w-full">
      <span className="field-label">
        Additional Requirements
      </span>

      <textarea
        name="requirements"
        rows="3"
        value={form.requirements}
        onChange={handleChange}
        className="field-control resize-y"
        placeholder="Parking, garden, school nearby..."
      />
    </label>
<div>
  <span className="field-label">
    Voice Message (Optional)
  </span>

  <p className="mb-3 text-sm text-slate-500">
    Tap record and tell us anything you'd like about your property requirement.
  </p>

  {!isRecording ? (
    <button
      type="button"
      onClick={startRecording}
      className="rounded-xl bg-red-500 px-5 py-3 text-white hover:bg-red-600"
    >
      🎤 Start Recording
    </button>
  ) : (
    <button
      type="button"
      onClick={stopRecording}
      className="rounded-xl bg-slate-700 px-5 py-3 text-white"
    >
      ⏹ Stop Recording
    </button>
  )}

  {audioUrl && (
    <div className="mt-4 space-y-3">
      <audio controls src={audioUrl} className="w-full" />

      <button
        type="button"
        onClick={() => setAudioUrl('')}
        className="rounded-lg bg-red-100 px-4 py-2 text-red-600"
      >
        Delete Recording
      </button>
    </div>
  )}
</div>
  </div>
</div>
            <label className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <input name="consent" type="checkbox" checked={form.consent} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-primary" />
              <span>I agree to be contacted regarding properties that match my needs.</span>
            </label>
            {errors.consent ? <p className="error-style">{errors.consent}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-70">
                {submitting ? 'Submitting…' : 'Continue to Properties'}
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={() => navigate('/home')} className="rounded-full border border-slate-200 px-6 py-3.5 text-base font-semibold text-slate-700">Back home</button>
            </div>
          </form>
        </div>

        <aside className="w-full lg:w-[360px] lg:self-start lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#17324D] via-[#204A70] to-[#3A7BD0] p-8 text-white shadow-card">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Home size={18} />
              Buyer Benefits
            </div>

            <h2 className="mt-6 text-3xl font-bold leading-tight">
              Find Your Dream Home with Confidence
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Complete your buyer profile once and unlock a personalized property
              experience. We'll recommend homes that match your budget, preferred
              location, and lifestyle.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Personalized property recommendations',
                'Verified and trusted property listings',
                'Priority access to newly added properties',
                'Save time with smarter property matching',
                'Direct communication with verified sellers',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-400" />
                  <span className="text-sm text-white">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <h3 className="text-2xl font-bold">500+</h3>
                <p className="mt-1 text-xs text-white/70">Properties</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <h3 className="text-2xl font-bold">98%</h3>
                <p className="mt-1 text-xs text-white/70">Match Rate</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <h3 className="text-2xl font-bold">24/7</h3>
                <p className="mt-1 text-xs text-white/70">Support</p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Sparkles size={22} className="mt-1 shrink-0 text-yellow-300" />
                <div>
                  <h3 className="text-lg font-semibold">Why we ask for these details</h3>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    Your information helps us recommend properties that truly fit your
                    budget, location, and lifestyle. Your details remain private and
                    are only used to improve your home buying experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-green-500/15 px-5 py-4 text-sm text-green-100">
              🔒 Your information is secure and will never be shared without your permission.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BuyerForm;
