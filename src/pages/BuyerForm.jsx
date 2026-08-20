import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LargeButton from '../components/LargeButton';
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
  const [villageDropdownOpen, setVillageDropdownOpen] = useState(false);
  const villageDropdownRef = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (villageDropdownRef.current && !villageDropdownRef.current.contains(event.target)) {
        setVillageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setVillageDropdownOpen(false);
    setErrors((current) => ({
      ...current,
      [name]: '',
      preferredVillages: '',
    }));
  };

  const handleVillageToggle = (village) => {
    const selectedVillages = form.preferredVillages || [];
    const alreadySelected = selectedVillages.includes(village);

    // Block third village selection
    if (!alreadySelected && selectedVillages.length >= 2) {
      return;
    }

    const nextVillages = alreadySelected
      ? selectedVillages.filter((item) => item !== village)
      : [...selectedVillages, village];

    setForm((current) => ({ ...current, preferredVillages: nextVillages }));

    // Close dropdown after 2nd selection
    if (!alreadySelected && nextVillages.length >= 2) {
      setVillageDropdownOpen(false);
    }
  };

  const handleRemoveVillage = (village) => {
    setForm((current) => ({
      ...current,
      preferredVillages: (current.preferredVillages || []).filter((item) => item !== village),
    }));
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

  const talukaOptions = useMemo(() => {
    if (!form.district) return [];
    const rawList = gujaratSubDistricts[form.district] || [];
    return [...new Set(rawList.map((item) => item.trim()))].sort((a, b) =>
      (t(a) || a).localeCompare(t(b) || b, undefined, { sensitivity: 'base' })
    );
  }, [form.district, t]);

  const allVillageOptions = useMemo(() => {
    if (!form.district || !form.taluka) return [];
    const rawList = gujaratVillages[form.district]?.[form.taluka] || [];
    return [...new Set(rawList.map((item) => item.trim()))].sort((a, b) =>
      (t(a) || a).localeCompare(t(b) || b, undefined, { sensitivity: 'base' })
    );
  }, [form.district, form.taluka, t]);

  const filteredVillageOptions = useMemo(() => {
    const query = villageSearch.trim().toLowerCase();
    if (!query) return allVillageOptions;
    return allVillageOptions.filter((village) => {
      if (village.toLowerCase().includes(query)) return true;
      const gujaratiName = t(village);
      return Boolean(gujaratiName && gujaratiName !== village && gujaratiName.toLowerCase().includes(query));
    });
  }, [allVillageOptions, villageSearch, t]);

  const selectedVillageCount = form.preferredVillages?.length || 0;


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
        audio: '',
        voiceRecording: '',
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
    <div className="-mx-4 -mt-8 bg-cream pb-28 sm:pb-20 sm:-mx-6 lg:-mx-8 dark:bg-dark-bg">
      <section className="bg-[#1D5CA9] px-4 py-12 text-white sm:px-10 sm:py-16 lg:px-12 dark:bg-dark-card dark:border-b dark:border-dark-border">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow text-white/80">{t('buyerForm.eyebrow')}</p>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-6xl">{t('buyerForm.heading')}</h1>
          <p className="mt-4 max-w-2xl text-sm text-white/80 sm:text-base">{t('buyerForm.description')}</p>
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-4xl px-4 sm:-mt-8 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] bg-white p-5 shadow-xl sm:p-10 dark:bg-dark-card dark:border dark:border-dark-border">
          <div>
            <p className="eyebrow">{t('buyerForm.eyebrow')}</p>
            <h2 className="mt-2 text-3xl font-bold text-ink dark:text-dark-text">{t('buyerForm.preference')}</h2>
          </div>

          <div className="space-y-6">
            <label className="block">
              <span className="field-label">{t('buyerForm.preferredState')} *</span>
              <input
                type="text"
                value={t('Gujarat')}
                readOnly
                disabled
                className="field-control w-full border border-slate-200 bg-slate-100/80 font-semibold text-slate-700 cursor-not-allowed"
              />
              <input type="hidden" name="state" value="Gujarat" />
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
                    {t(district)}
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
                onChange={(event) => {
                  handleChange(event);
                  if (event.target.value) {
                    event.target.blur();
                  }
                }}
                className={`field-control w-full ${errors.taluka ? 'border-red-400' : ''}`}
                disabled={!form.district}
              >
                <option value="">{form.district ? t('buyerForm.selectTaluka') : t('buyerForm.selectDistrictFirst')}</option>
                {talukaOptions.map((taluka) => (
                  <option key={taluka} value={taluka}>
                    {t(taluka)}
                  </option>
                ))}
              </select>
              {errors.taluka && <p className="error-style">{errors.taluka}</p>}
            </label>

            {form.taluka ? (
              <div className="block">
                <span className="field-label">{t('buyerForm.preferredVillages')} *</span>
                <div ref={villageDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedVillageCount < 2) {
                        setVillageDropdownOpen((open) => !open);
                      }
                    }}
                    className={`field-control w-full flex flex-wrap items-center gap-2 min-h-[48px] text-left ${errors.preferredVillages ? 'border-red-400' : ''}`}
                  >
                    {selectedVillageCount === 0 ? (
                      <span className="text-slate-400">{t('buyerForm.selectVillagesHint')}</span>
                    ) : (
                      (form.preferredVillages || []).map((village) => (
                        <span key={village} className="inline-flex items-center gap-1.5 rounded-full bg-sage/10 px-3 py-1 text-sm font-semibold text-ink">
                          {t(village)}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveVillage(village);
                            }}
                            className="text-slate-500 hover:text-red-600 transition"
                            aria-label={t('buyerForm.removeVillage')}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                    <span className="ml-auto text-xs font-semibold text-slate-400">{selectedVillageCount}/2</span>
                  </button>

                  {villageDropdownOpen && selectedVillageCount < 2 ? (
                    <div className="absolute z-20 mt-2 w-full rounded-[24px] border border-slate-200 bg-white shadow-xl">
                      <div className="p-3">
                        <input
                          type="text"
                          value={villageSearch}
                          onChange={(event) => setVillageSearch(event.target.value)}
                          placeholder={t('buyerForm.searchVillages')}
                          className="field-control w-full bg-cream"
                        />
                      </div>
                      <div className="max-h-[280px] overflow-y-auto p-2">
                        {allVillageOptions.length ? (
                          filteredVillageOptions.length ? (
                            filteredVillageOptions.map((village) => {
                              const isSelected = (form.preferredVillages || []).includes(village);
                              return (
                                <button
                                  key={village}
                                  type="button"
                                  onClick={() => handleVillageToggle(village)}
                                  className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm transition ${isSelected ? 'bg-sage/10 text-ink font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  {t(village)}
                                </button>
                              );
                            })
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                              {t('buyerForm.noVillagesMatch')}
                            </div>
                          )
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                            {t('buyerForm.noVillagesAvailable')}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                {selectedVillageCount >= 2 && (
                  <p className="mt-1 text-xs text-slate-500">{t('buyerForm.maxVillagesReached')}</p>
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
                className="field-control w-full resize-y min-h-[140px]"
                placeholder={t('buyerForm.requirementsPlaceholder')}
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="field-label">{t('buyerForm.voiceRecording')}</span>
                <span className="text-xs text-slate-500">{t('common.optional')}</span>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-cream p-4 sm:p-6 space-y-4">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark min-h-[44px]"
                  >
                    {t('buyerForm.startRecording')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark min-h-[44px]"
                  >
                    {t('buyerForm.stopRecording')}
                  </button>
                )}
                {isRecording ? <p className="text-sm font-medium text-slate-600 text-center">{t('buyerForm.recordingInProgress')}</p> : null}
                {audioUrl && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <audio controls src={audioUrl} className="w-full" />
                    <button type="button" onClick={() => setAudioUrl('')} className="text-sm font-semibold text-red-600 hover:underline">
                      {t('buyerForm.removeRecording')}
                    </button>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <LargeButton type="submit" disabled={submitting} className="min-h-[48px]">
              {submitting ? t('buyerForm.submitting') : t('buyerForm.submit')}
            </LargeButton>
          </div>
        </form>
      </section>
    </div>
  );
}

export default BuyerForm;
