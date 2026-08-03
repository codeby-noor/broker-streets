import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle2, ChevronRight, Home, Sparkles } from 'lucide-react';
import { appendStorageArray, STORAGE_KEYS } from '../utils/storage';

const initialForm = {
  name: '',
  mobile: '',
  whatsapp: '',
  email: '',
  state: '',
  city: '',
  address: '',
  lookingFor: 'Buy',
  propertyType: '',
  budget: '',
  preferredArea: '',
  bedrooms: '',
  possession: '',
  purpose: '',
  requirements: '',
  consent: false,
};

const propertyTypes = ['Apartment', 'Villa', 'Bungalow', 'Commercial', 'Office', 'Shop', 'Plot', 'Farm House'];
const bedroomOptions = ['1', '2', '3', '4', '5+'];
const possessionOptions = ['Immediate', '1 Month', '3 Months', 'Flexible'];
const purposeOptions = ['Investment', 'Personal', 'Business'];
const lookingForOptions = ['Buy', 'Rent'];

function BuyerForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const progress = useMemo(() => {
    const requiredFields = ['name', 'mobile', 'state', 'city', 'address', 'lookingFor', 'propertyType', 'budget', 'preferredArea', 'bedrooms', 'possession', 'purpose'];
    const completed = requiredFields.filter((field) => {
      const value = form[field];
      return typeof value === 'boolean' ? value : String(value || '').trim();
    }).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [form]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Please share your full name.';
    if (!/^[0-9]{10}$/.test(form.mobile)) nextErrors.mobile = 'A valid 10-digit mobile number is required.';
    if (!form.state.trim()) nextErrors.state = 'Please select your state.';
    if (!form.city.trim()) nextErrors.city = 'Please share your city.';
    if (!form.address.trim()) nextErrors.address = 'Your current address helps us shortlist better.';
    if (!form.lookingFor) nextErrors.lookingFor = 'Choose whether you are buying or renting.';
    if (!form.propertyType) nextErrors.propertyType = 'Please choose a property type.';
    if (!form.budget.trim()) nextErrors.budget = 'Budget helps us tailor results.';
    if (!form.preferredArea.trim()) nextErrors.preferredArea = 'Please tell us the preferred area.';
    if (!form.bedrooms) nextErrors.bedrooms = 'Select the bedroom count.';
    if (!form.possession) nextErrors.possession = 'Select a preferred possession timeline.';
    if (!form.purpose) nextErrors.purpose = 'Let us know your intent.';
    if (!form.consent) nextErrors.consent = 'Please confirm that you want to be contacted.';
    return nextErrors;
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
      ...form,
      createdAt: new Date().toISOString(),
    };

    // Save buyer lead
    appendStorageArray(STORAGE_KEYS.buyerLeads, lead);

    // Save buyer form status for the logged-in user
    const mobile = localStorage.getItem('currentUserMobile');

    if (mobile) {
      localStorage.setItem(
        `buyerFormSubmitted_${mobile}`,
        'true'
      );
    }

    setSubmitting(false);

    toast.success(
      'Your buyer profile has been submitted successfully.'
    );

    // Redirect to Buy Listings
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
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="field-label">Full Name *</span>
                <input name="name" value={form.name} onChange={handleChange} className={`field-control ${errors.name ? 'border-red-400' : ''}`} placeholder="Enter your full name" />
                {errors.name ? <p className="error-style">{errors.name}</p> : null}
              </label>
              <label className="block">
                <span className="field-label">Mobile Number *</span>
                <input name="mobile" value={form.mobile} onChange={handleChange} className={`field-control ${errors.mobile ? 'border-red-400' : ''}`} placeholder="10-digit mobile" />
                {errors.mobile ? <p className="error-style">{errors.mobile}</p> : null}
              </label>
              <label className="block">
                <span className="field-label">WhatsApp Number</span>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="field-control" placeholder="Optional" />
              </label>
              <label className="block">
                <span className="field-label">Email</span>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="field-control" placeholder="name@email.com" />
              </label>
              <label className="block">
                <span className="field-label">State *</span>
                <input name="state" value={form.state} onChange={handleChange} className={`field-control ${errors.state ? 'border-red-400' : ''}`} placeholder="e.g. Gujarat" />
                {errors.state ? <p className="error-style">{errors.state}</p> : null}
              </label>
              <label className="block">
                <span className="field-label">City *</span>
                <input name="city" value={form.city} onChange={handleChange} className={`field-control ${errors.city ? 'border-red-400' : ''}`} placeholder="e.g. Ahmedabad" />
                {errors.city ? <p className="error-style">{errors.city}</p> : null}
              </label>
              <label className="block md:col-span-2">
                <span className="field-label">Current Address *</span>
                <textarea name="address" rows="3" value={form.address} onChange={handleChange} className={`field-control resize-y ${errors.address ? 'border-red-400' : ''}`} placeholder="Apartment, locality, landmark" />
                {errors.address ? <p className="error-style">{errors.address}</p> : null}
              </label>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-ink">Your preference</h2>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <span className="field-label">Looking For *</span>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {lookingForOptions.map((option) => (
                      <button key={option} type="button" onClick={() => setForm((current) => ({ ...current, lookingFor: option }))} className={`rounded-full px-4 py-2 text-sm font-semibold ${form.lookingFor === option ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                        {option}
                      </button>
                    ))}
                  </div>
                  {errors.lookingFor ? <p className="error-style">{errors.lookingFor}</p> : null}
                </div>
                <label className="block">
                  <span className="field-label">Property Type *</span>
                  <select name="propertyType" value={form.propertyType} onChange={handleChange} className={`field-control ${errors.propertyType ? 'border-red-400' : ''}`}>
                    <option value="">Select</option>
                    {propertyTypes.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {errors.propertyType ? <p className="error-style">{errors.propertyType}</p> : null}
                </label>
                <label className="block">
                  <span className="field-label">Budget *</span>
                  <input name="budget" value={form.budget} onChange={handleChange} className={`field-control ${errors.budget ? 'border-red-400' : ''}`} placeholder="e.g. 70 Lakh" />
                  {errors.budget ? <p className="error-style">{errors.budget}</p> : null}
                </label>
                <label className="block">
                  <span className="field-label">Preferred Area *</span>
                  <input name="preferredArea" value={form.preferredArea} onChange={handleChange} className={`field-control ${errors.preferredArea ? 'border-red-400' : ''}`} placeholder="e.g. Satellite" />
                  {errors.preferredArea ? <p className="error-style">{errors.preferredArea}</p> : null}
                </label>
                <label className="block">
                  <span className="field-label">Bedrooms *</span>
                  <select name="bedrooms" value={form.bedrooms} onChange={handleChange} className={`field-control ${errors.bedrooms ? 'border-red-400' : ''}`}>
                    <option value="">Select</option>
                    {bedroomOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {errors.bedrooms ? <p className="error-style">{errors.bedrooms}</p> : null}
                </label>
                <label className="block">
                  <span className="field-label">Possession *</span>
                  <select name="possession" value={form.possession} onChange={handleChange} className={`field-control ${errors.possession ? 'border-red-400' : ''}`}>
                    <option value="">Select</option>
                    {possessionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {errors.possession ? <p className="error-style">{errors.possession}</p> : null}
                </label>
                <label className="block">
                  <span className="field-label">Purpose *</span>
                  <select name="purpose" value={form.purpose} onChange={handleChange} className={`field-control ${errors.purpose ? 'border-red-400' : ''}`}>
                    <option value="">Select</option>
                    {purposeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {errors.purpose ? <p className="error-style">{errors.purpose}</p> : null}
                </label>
                <label className="block">
                  <span className="field-label">Additional Requirements</span>
                  <textarea name="requirements" rows="3" value={form.requirements} onChange={handleChange} className="field-control resize-y" placeholder="Parking, gym, school proximity, etc." />
                </label>
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
        "Personalized property recommendations",
        "Verified and trusted property listings",
        "Priority access to newly added properties",
        "Save time with smarter property matching",
        "Direct communication with verified sellers",
      ].map((item) => (
        <div
          key={item}
          className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-sm"
        >
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-green-400"
          />
          <span className="text-sm text-white">{item}</span>
        </div>
      ))}
    </div>

    <div className="mt-8 grid grid-cols-3 gap-3">
      <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
        <h3 className="text-2xl font-bold">500+</h3>
        <p className="mt-1 text-xs text-white/70">
          Properties
        </p>
      </div>

      <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
        <h3 className="text-2xl font-bold">98%</h3>
        <p className="mt-1 text-xs text-white/70">
          Match Rate
        </p>
      </div>

      <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
        <h3 className="text-2xl font-bold">24/7</h3>
        <p className="mt-1 text-xs text-white/70">
          Support
        </p>
      </div>
    </div>

    <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <Sparkles
          size={22}
          className="mt-1 shrink-0 text-yellow-300"
        />

        <div>
          <h3 className="text-lg font-semibold">
            Why we ask for these details
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/80">
            Your information helps us recommend properties that truly fit your
            budget, location, and lifestyle. Your details remain private and
            are only used to improve your home buying experience.
          </p>
        </div>
      </div>
    </div>

    <div className="mt-8 rounded-2xl bg-green-500/15 px-5 py-4 text-sm text-green-100">
      🔒 Your information is secure and will never be shared without your
      permission.
    </div>

  </div>
</aside>
      </div>
    </div>
  );
}

export default BuyerForm;
