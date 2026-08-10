import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appendStorageArray, appendNotification, STORAGE_KEYS } from '../utils/storage';
import { useUserStore } from '../store/useUserStore';
import { gujaratDistricts, gujaratStateOptions, gujaratSubDistricts, gujaratVillages } from '../utils/data';
import { useLanguage } from '../i18n/LanguageContext';

const initialForm = {
  state: 'Gujarat',
  district: '',
  taluka: '',
  preferredVillages: [],
  propertyType: '',
  purpose: '',
  requirements: '',
};

function BuyerForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = useUserStore((state) => state.user);
  const [form, setForm] = useState({ ...initialForm });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const propertyTypeOptions = useMemo(() => [
    { value: 'Agricultural Land', label: t('buyerForm.agriculturalLand') },
    { value: 'Non-Agricultural Land', label: t('buyerForm.nonAgriculturalLand') },
  ], [t]);
  const purposeOptions = useMemo(() => [
    { value: 'Investment', label: t('buyerForm.investment') },
    { value: 'Project', label: t('buyerForm.project') },
    { value: 'Personal Farm', label: t('buyerForm.personalFarm') },
    { value: 'Other', label: t('buyerForm.other') },
  ], [t]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === 'district') {
        return { ...current, district: value, taluka: '', preferredVillages: [] };
      }
      if (name === 'taluka') {
        return { ...current, taluka: value, preferredVillages: [] };
      }
      return { ...current, [name]: value };
    });

    setVillageSearch('');
    setErrors((current) => ({
      ...current,
      [name]: '',
      preferredVillages: '',
    }));
  };

  const handleVillageToggle = (village) => {
    setForm((current) => {
      const selectedVillages = current.preferredVillages || [];
      const alreadySelected = selectedVillages.includes(village);
      return {
        ...current,
        preferredVillages: alreadySelected
          ? selectedVillages.filter((item) => item !== village)
          : [...selectedVillages, village],
      };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.state) nextErrors.state = t('buyerForm.stateRequired');
    if (!form.district) nextErrors.district = t('buyerForm.districtRequired');
    if (!form.taluka) nextErrors.taluka = t('buyerForm.talukaRequired');
    if (!form.propertyType) nextErrors.propertyType = t('buyerForm.propertyTypeRequired');
    if (!form.purpose) nextErrors.purpose = t('buyerForm.purposeRequired');

    const availableVillageCount = allVillageOptions.length;
    if (form.taluka && availableVillageCount > 0) {
      const selectedCount = form.preferredVillages?.length || 0;
      if (availableVillageCount === 1 && selectedCount < 1) {
        nextErrors.preferredVillages = t('buyerForm.villageSelectionRequired');
      } else if (availableVillageCount > 1 && selectedCount < 2) {
        nextErrors.preferredVillages = t('buyerForm.villageSelectionRequiredPlural');
      }
    }

    return nextErrors;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error(t('buyerForm.microphoneDenied'));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const talukaOptions = useMemo(() => (form.district ? gujaratSubDistricts[form.district] || [] : []), [form.district]);

  const allVillageOptions = useMemo(() => {
    if (!form.district || !form.taluka) return [];
    return [...(gujaratVillages[form.district]?.[form.taluka] || [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [form.district, form.taluka]);

  const filteredVillageOptions = useMemo(() => {
    const query = villageSearch.trim().toLowerCase();
    if (!query) return allVillageOptions;
    return allVillageOptions.filter((village) => village.toLowerCase().includes(query));
  }, [allVillageOptions, villageSearch]);

  const selectedVillageCount = form.preferredVillages?.length || 0;

  const handleSelectAllVisible = () => {
    setForm((current) => ({
      ...current,
      preferredVillages: Array.from(new Set([...(current.preferredVillages || []), ...filteredVillageOptions])),
    }));
  };

  const handleClearAllVisible = () => {
    setForm((current) => ({
      ...current,
      preferredVillages: (current.preferredVillages || []).filter((village) => !filteredVillageOptions.includes(village)),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validate();

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      toast.error(t('buyerForm.validationError'));
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const lead = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `buyer-${Date.now()}`,
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
        userMobile: currentUser?.mobile || '',
        userEmail: currentUser?.email || '',
        ...form,
        preferredVillages: form.preferredVillages || [],
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
      toast.success(t('buyerForm.submitSuccess'));

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
          <p className="eyebrow text-blue-100">{t('buyerForm.eyebrow')}</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">{t('buyerForm.heading')}</h1>
          <p className="mt-3 text-sm text-slate-600">{t('buyerForm.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-ink">{t('buyerForm.preference')}</h2>

            <label className="block">
              <span className="field-label">{t('buyerForm.preferredState')} *</span>
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
              <span className="field-label">{t('buyerForm.preferredDistrict')} *</span>
              <select
                name="district"
                value={form.district}
                onChange={handleChange}
                className={`field-control w-full ${errors.district ? 'border-red-400' : ''}`}
              >
                <option value="">{t('buyerForm.selectDistrict')}</option>
                {gujaratDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {errors.district && <p className="error-style">{errors.district}</p>}
            </label>

            <label className="block">
              <span className="field-label">{t('buyerForm.preferredTaluka')} *</span>
              <select
                name="taluka"
                value={form.taluka}
                onChange={handleChange}
                className={`field-control w-full ${errors.taluka ? 'border-red-400' : ''}`}
                disabled={!form.district}
              >
                <option value="">{form.district ? t('buyerForm.selectTaluka') : t('buyerForm.selectDistrictFirst')}</option>
                {talukaOptions.map((taluka) => (
                  <option key={taluka} value={taluka}>
                    {taluka}
                  </option>
                ))}
              </select>
              {errors.taluka && <p className="error-style">{errors.taluka}</p>}
            </label>

            {form.taluka ? (
              <div className="block">
                <div className="mb-3 space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="field-label">{t('buyerForm.preferredVillages')} *</p>
                      <p className="text-sm text-slate-500">{t('buyerForm.selectVillagesHint')}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-sage/10 px-3 py-2 text-sm font-semibold text-sage">
                      {t('buyerForm.selectedCount')}: {selectedVillageCount}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="text"
                      value={villageSearch}
                      onChange={(event) => setVillageSearch(event.target.value)}
                      placeholder={t('buyerForm.searchVillages')}
                      className="field-control w-full sm:max-w-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={handleSelectAllVisible} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sage hover:text-sage">
                        {t('buyerForm.selectAll')}
                      </button>
                      <button type="button" onClick={handleClearAllVisible} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600">
                        {t('buyerForm.clearAll')}
                      </button>
                    </div>
                  </div>
                </div>

                {allVillageOptions.length ? (
                  <div className="max-h-[360px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredVillageOptions.length ? (
                        filteredVillageOptions.map((village) => {
                          const isSelected = (form.preferredVillages || []).includes(village);
                          return (
                            <button
                              key={village}
                              type="button"
                              onClick={() => handleVillageToggle(village)}
                              className={`group flex items-start gap-3 rounded-3xl border px-4 py-4 text-left transition ${isSelected ? 'border-sage bg-sage/10 text-ink' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100'}`}
                            >
                              <span className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-sage bg-sage text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                                <span className="text-xs font-semibold">✓</span>
                              </span>
                              <span className="leading-6">{village}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                          {t('buyerForm.noVillagesMatch')}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                    {t('buyerForm.noVillagesAvailable')}
                  </div>
                )}
                {errors.preferredVillages && <p className="error-style mt-2">{errors.preferredVillages}</p>}
              </div>
            ) : null}

            <label className="block">
              <span className="field-label">{t('buyerForm.propertyType')} *</span>
              <select
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
                className={`field-control w-full ${errors.propertyType ? 'border-red-400' : ''}`}
              >
                <option value="">{t('buyerForm.selectPropertyType')}</option>
                {propertyTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.propertyType && <p className="error-style">{errors.propertyType}</p>}
            </label>

            <label className="block">
              <span className="field-label">{t('buyerForm.purpose')} *</span>
              <select
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                className={`field-control w-full ${errors.purpose ? 'border-red-400' : ''}`}
              >
                <option value="">{t('buyerForm.selectPurpose')}</option>
                {purposeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.purpose && <p className="error-style">{errors.purpose}</p>}
            </label>

            <label className="block">
              <span className="field-label">{t('buyerForm.additionalRequirements')}</span>
              <textarea
                name="requirements"
                rows="4"
                value={form.requirements}
                onChange={handleChange}
                className="field-control w-full resize-y"
                placeholder={t('buyerForm.requirementsPlaceholder')}
              />
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="field-label">{t('buyerForm.voiceRecording')}</span>
                <span className="text-xs text-muted">{t('common.optional')}</span>
              </div>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  {t('buyerForm.startRecording')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t('buyerForm.stopRecording')}
                </button>
              )}
              {isRecording ? <p className="text-sm text-slate-600">{t('buyerForm.recordingInProgress')}</p> : null}
              {audioUrl && (
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <audio controls src={audioUrl} className="w-full" />
                  <button type="button" onClick={() => setAudioUrl('')} className="text-sm font-semibold text-red-600">
                    {t('buyerForm.removeRecording')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-sage px-6 py-3 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-slate-300 min-h-[48px]"
            >
              {submitting ? t('buyerForm.submitting') : t('buyerForm.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BuyerForm;
