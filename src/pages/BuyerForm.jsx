import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appendStorageArray, appendNotification, STORAGE_KEYS } from '../utils/storage';
import { useUserStore } from '../store/useUserStore';
import { gujaratStateOptions, gujaratDistricts } from '../utils/data';
const initialForm = {
  state: 'Gujarat',
  district: '',
  propertyType: '',
  budget: '',
  requirements: '',
};
const propertyTypes = ['Agricultural Land', 'Non-Agricultural Land'];

function BuyerForm() {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const [form, setForm] = useState({
    ...initialForm,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
const [isRecording, setIsRecording] = useState(false);
const [audioUrl, setAudioUrl] = useState('');

const mediaRecorderRef = useRef(null);
const chunksRef = useRef([]);
  const handleChange = (event) => {
  const { name, value, type, checked } = event.target;

  setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));

  setErrors((current) => ({
    ...current,
    [name]: '',
  }));
};
  const validate = () => {
    const nextErrors = {};
    if (!form.state) nextErrors.state = 'Please choose a state.';
    if (!form.district) nextErrors.district = 'Please choose a district.';
    if (!form.propertyType) nextErrors.propertyType = 'Please choose a property type.';
    if (!form.budget.trim()) nextErrors.budget = 'Budget helps us tailor results.';
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
      userName: currentUser?.name || '',
      userMobile: currentUser?.mobile || '',
      userEmail: currentUser?.email || '',
      ...form,
      audio: audioUrl,
      voiceRecording: audioUrl,
      createdAt: new Date().toISOString(),
    };

    appendStorageArray(STORAGE_KEYS.buyerLeads, lead);
    appendNotification({
      id: `notif-${Date.now()}`,
      type: 'Requirement submitted',
      message: `New buyer requirement submitted for ${lead.district} ${lead.propertyType}.`,
      createdAt: new Date().toISOString(),
      category: 'buyer',
    });

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
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8">
          <p className="eyebrow text-blue-100">Buyer preference</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Tell us what land you are looking for</h1>
          <p className="mt-3 text-sm text-slate-600">Provide the essentials and we will suggest matching agricultural and NA land options.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-ink">Your Preference</h2>

            <label className="block">
              <span className="field-label">Preferred State *</span>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className={`field-control w-full ${errors.state ? 'border-red-400' : ''}`}
              >
                {gujaratStateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.state && <p className="error-style">{errors.state}</p>}
            </label>

            <label className="block">
              <span className="field-label">Preferred District *</span>
              <select
                name="district"
                value={form.district}
                onChange={handleChange}
                className={`field-control w-full ${errors.district ? 'border-red-400' : ''}`}
              >
                <option value="">Select district</option>
                {gujaratDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {errors.district && <p className="error-style">{errors.district}</p>}
            </label>

            <label className="block">
              <span className="field-label">Property Type *</span>
              <select
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
                className={`field-control w-full ${errors.propertyType ? 'border-red-400' : ''}`}
              >
                <option value="">Select land type</option>
                {propertyTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.propertyType && <p className="error-style">{errors.propertyType}</p>}
            </label>

            <label className="block">
              <span className="field-label">Budget *</span>
              <input
                name="budget"
                value={form.budget}
                onChange={handleChange}
                className={`field-control w-full ${errors.budget ? 'border-red-400' : ''}`}
                placeholder="e.g. ₹50 Lakh"
              />
              {errors.budget && <p className="error-style">{errors.budget}</p>}
            </label>

            <label className="block">
              <span className="field-label">Additional Requirements</span>
              <textarea
                name="requirements"
                rows="4"
                value={form.requirements}
                onChange={handleChange}
                className="field-control w-full resize-y"
                placeholder="Road access, water source, preferred locality..."
              />
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="field-label">Voice Recording</span>
                <span className="text-xs text-muted">Optional</span>
              </div>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Stop Recording
                </button>
              )}
              {audioUrl && (
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <audio controls src={audioUrl} className="w-full" />
                  <button
                    type="button"
                    onClick={() => setAudioUrl('')}
                    className="text-sm font-semibold text-red-600"
                  >
                    Remove recording
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-3xl bg-sage px-6 py-3 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BuyerForm;
