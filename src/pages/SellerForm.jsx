import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LargeButton from '../components/LargeButton';
import { useUserStore } from '../store/useUserStore';
import { gujaratDistricts, gujaratSubDistricts, gujaratVillages } from '../utils/data';
import { appendStorageArray, readStorage, writeStorage, STORAGE_KEYS } from '../utils/storage';
import logo from '../assets/images/logo.png';
import { useLanguage } from '../i18n/LanguageContext';

import { formatIndianPrice, parseNaturalIndianPrice } from '../utils/format';

const fallbackPropertyImage = logo;
const metadata = (files) => Array.from(files || []).map((file) => ({ name: file.name, type: file.type, size: file.size, lastModified: file.lastModified }));

function SellerForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const user = useUserStore((state) => state.user);
  const editProperty = location.state?.editProperty || null;

  const { register, handleSubmit, watch, setValue, clearErrors, formState: { errors } } = useForm({
    defaultValues: {
      sellerType: editProperty?.sellerType || editProperty?.seller?.type || '',
      state: editProperty?.state || 'Gujarat',
      district: editProperty?.district || editProperty?.city || editProperty?.location || '',
      subDistrict: editProperty?.subDistrict || editProperty?.taluka || '',
      village: editProperty?.village || '',
      type: editProperty?.type || editProperty?.propertyType || '',
      priceUnit: editProperty?.priceUnit || '',
      priceAmount: editProperty?.priceAmount || editProperty?.price || '',
      mapLink: editProperty?.mapLink || editProperty?.mapUrl || editProperty?.googleMaps || '',
      additionalDetails: editProperty?.description || editProperty?.additionalDetails || '',
    },
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(
    editProperty?.priceAmount || editProperty?.price ? String(editProperty.priceAmount || editProperty.price) : ''
  );
  const sellerTypeOptions = useMemo(() => [
    { value: 'owner', label: t('sellerForm.owner') },
    { value: 'agent', label: t('sellerForm.agent') },
  ], [t]);
  const propertyTypeOptions = useMemo(() => [
    { value: 'Agricultural Land', label: t('sellerForm.agriculturalLand') },
    { value: 'Non-Agricultural Land', label: t('sellerForm.nonAgriculturalLand') },
  ], [t]);
  const priceUnitOptions = useMemo(() => [
    { value: 'Vigha', label: t('sellerForm.vigha') },
    { value: 'sq.yard (var)', label: t('sellerForm.sqYard') },
    { value: 'Sq.Ft', label: t('sellerForm.sqFt') },
  ], [t]);
  const selectedSellerType = watch('sellerType');
  const selectedDistrict = watch('district');
  const selectedTaluka = watch('subDistrict');
  const selectedType = watch('type');
  const priceAmountValue = watch('priceAmount');

  useEffect(() => {
    if (editProperty) {
      setValue('sellerType', editProperty.sellerType || editProperty.seller?.type || '');
      setValue('state', editProperty.state || 'Gujarat');
      setValue('district', editProperty.district || editProperty.city || editProperty.location || '');
      setValue('subDistrict', editProperty.subDistrict || editProperty.taluka || '');
      setValue('village', editProperty.village || '');
      setValue('type', editProperty.type || editProperty.propertyType || '');
      setValue('priceUnit', editProperty.priceUnit || '');
      setValue('priceAmount', editProperty.priceAmount || editProperty.price || '');
      if (editProperty.priceAmount || editProperty.price) {
        setDisplayPrice(String(editProperty.priceAmount || editProperty.price));
      }
      setValue('mapLink', editProperty.mapLink || editProperty.mapUrl || editProperty.googleMaps || '');
      setValue('additionalDetails', editProperty.description || editProperty.additionalDetails || '');
    }
  }, [editProperty, setValue]);

  const subDistrictOptions = useMemo(() => {
    if (!selectedDistrict) return [];
    const rawList = gujaratSubDistricts[selectedDistrict] || [];
    return [...new Set(rawList.map((item) => item.trim()))].sort((a, b) =>
      (t(a) || a).localeCompare(t(b) || b, undefined, { sensitivity: 'base' })
    );
  }, [selectedDistrict, t]);

  const villageOptions = useMemo(() => {
    if (!selectedDistrict || !selectedTaluka) return [];
    const rawList = gujaratVillages[selectedDistrict]?.[selectedTaluka] || [];
    return [...new Set(rawList.map((item) => item.trim()))].sort((a, b) =>
      (t(a) || a).localeCompare(t(b) || b, undefined, { sensitivity: 'base' })
    );
  }, [selectedDistrict, selectedTaluka, t]);

  useEffect(() => {
    if (!editProperty) {
      setValue('subDistrict', '');
      setValue('village', '');
      clearErrors('village');
    }
  }, [selectedDistrict, setValue, clearErrors, editProperty]);

  useEffect(() => {
    if (!editProperty) {
      setValue('village', '');
      clearErrors('village');
    }
  }, [selectedTaluka, setValue, clearErrors, editProperty]);

  const addFiles = (event, setter, accept) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith(accept));
    setter((current) => [...current, ...files].map((file) => ({ file, url: URL.createObjectURL(file) })));
    event.target.value = '';
  };
  const removeFile = (setter, index) => setter((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const formatIndianNumber = (value) => {
    const digitsOnly = String(value).replace(/[^\d]/g, '');
    if (!digitsOnly) return '';
    return Number(digitsOnly).toLocaleString('en-IN');
  };

  const handlePriceInput = (event) => {
    const value = event.target.value;
    setDisplayPrice(value);
    const parsed = parseNaturalIndianPrice(value);
    const numValue = typeof parsed === 'number' ? String(parsed) : String(value).replace(/[^\d]/g, '');
    setValue('priceAmount', numValue, { shouldDirty: true, shouldValidate: true });
  };

  const submit = (data) => {
    if (!editProperty && !pdf) { toast.error(t('sellerForm.documentRequired')); return; }
    setSubmitting(true);
    const listingId = editProperty?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `listing-${Date.now()}`);
    const priceValue = data.priceAmount ? Number(String(data.priceAmount).replace(/[^\d]/g, '')) : 0;
    const title = `${data.type || 'Land'} in ${data.village || data.subDistrict || data.district || 'Gujarat'}`;
    const lead = {
      ...(editProperty || {}),
      id: listingId,
      ...data,
      sellerType: data.sellerType || '',
      priceAmount: data.priceAmount || '',
      subDistrict: data.subDistrict || '',
      village: data.village || '',
      userId: editProperty?.userId || user?.id || '',
      userName: editProperty?.userName || user?.name || '',
      userMobile: editProperty?.userMobile || user?.mobile || '',
      userEmail: editProperty?.userEmail || user?.email || '',
      ownerName: editProperty?.ownerName || user?.name || '',
      ownerMobile: editProperty?.ownerMobile || user?.mobile || '',
      ownerEmail: editProperty?.ownerEmail || user?.email || '',
      propertyImages: images.length ? metadata(images.map((item) => item.file)) : (editProperty?.propertyImages || []),
      propertyVideos: videos.length ? metadata(videos.map((item) => item.file)) : (editProperty?.propertyVideos || []),
      propertyDocument: pdf ? metadata([pdf])[0] : (editProperty?.propertyDocument || null),
      submittedAt: editProperty?.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const listing = {
      ...(editProperty || {}),
      ...lead,
      id: listingId,
      title,
      name: title,
      sellerType: data.sellerType || '',
      type: data.type || '',
      propertyType: data.type || '',
      state: data.state || 'Gujarat',
      district: data.district || '',
      subDistrict: data.subDistrict || '',
      taluka: data.subDistrict || '',
      village: data.village || '',
      location: data.district || '',
      city: data.district || '',
      address: [data.village || '', data.subDistrict || '', data.district || '', 'Gujarat'].filter(Boolean).join(', '),
      price: priceValue ? (Number(priceValue) || String(priceValue)) : 'Price on request',
      priceAmount: priceValue ? String(priceValue) : '',
      priceUnit: data.priceUnit || '',
      landArea: data.additionalDetails || 'Area not specified',
      area: data.additionalDetails || 'Area not specified',
      description: data.additionalDetails || 'Verified land listing with clear location and pricing details.',
      status: editProperty?.status || 'Available',
      verified: editProperty?.verified ?? true,
      image: editProperty?.image || fallbackPropertyImage,
      gallery: editProperty?.gallery || [fallbackPropertyImage],
      images: editProperty?.images || [fallbackPropertyImage],
      propertyDocument: pdf ? { name: pdf.name, type: pdf.type, size: pdf.size, lastModified: pdf.lastModified, url: '#' } : (editProperty?.propertyDocument || null),
      documentUrl: editProperty?.documentUrl || '#',
      mapLink: data.mapLink || '',
      mapUrl: data.mapLink || '',
      googleMaps: data.mapLink || '',
      seller: {
        name: editProperty?.seller?.name || user?.name || '',
        phone: editProperty?.seller?.phone || user?.mobile || '',
        email: editProperty?.seller?.email || user?.email || '',
        type: data.sellerType || '',
        sellerType: data.sellerType || '',
      },
      sellerName: editProperty?.sellerName || user?.name || '',
      sellerPhone: editProperty?.sellerPhone || user?.mobile || '',
      sellerEmail: editProperty?.sellerEmail || user?.email || '',
      ownerName: editProperty?.ownerName || user?.name || '',
      ownerMobile: editProperty?.ownerMobile || user?.mobile || '',
      ownerEmail: editProperty?.ownerEmail || user?.email || '',
      submittedAt: lead.submittedAt,
      createdAt: editProperty?.createdAt || lead.submittedAt,
      updatedAt: lead.updatedAt,
      uploadedDate: editProperty?.uploadedDate || lead.submittedAt,
      userId: editProperty?.userId || user?.id || '',
    };
    try {
      const existingListings = readStorage(STORAGE_KEYS.listings, []);
      if (editProperty?.id) {
        const updatedListings = existingListings.map((item) =>
          String(item.id) === String(editProperty.id) ? listing : item
        );
        writeStorage(STORAGE_KEYS.listings, updatedListings);

        const existingLeads = readStorage(STORAGE_KEYS.sellerLeads, []);
        const updatedLeads = existingLeads.map((item) =>
          String(item.id) === String(editProperty.id) ? lead : item
        );
        writeStorage(STORAGE_KEYS.sellerLeads, updatedLeads);
        writeStorage(STORAGE_KEYS.lastProperty, listing);
      } else {
        appendStorageArray(STORAGE_KEYS.sellerLeads, lead);
        appendStorageArray(STORAGE_KEYS.listings, listing);
        writeStorage(STORAGE_KEYS.lastProperty, listing);
      }
    } catch {
      toast.error(t('sellerForm.saveError'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    toast.success(editProperty ? t('sellerForm.listingUpdated') || 'Listing updated successfully.' : t('sellerForm.submitSuccess'));
    navigate('/seller-form', { state: { justSubmitted: true, data: lead } });
  };

  return (
    <div className="-mx-4 -mt-8 bg-cream pb-28 sm:pb-20 sm:-mx-6 lg:-mx-8 dark:bg-dark-bg">
      <section className="bg-[#1D5CA9] px-4 py-7 text-white sm:px-10 sm:py-12 lg:px-12 dark:bg-dark-card dark:border-b dark:border-dark-border">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow text-white/80">{t('sellerForm.title')}</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-4xl lg:text-5xl">{t('sellerForm.smallHeading')}</h1>
          <p className="mt-2 max-w-2xl text-xs text-white/80 sm:text-base">{t('sellerForm.authMessage')}</p>
          <p className="mt-1.5 max-w-2xl text-xs text-white/70 sm:text-base">{t('sellerForm.helpDescription')}</p>
        </div>
      </section>
      <section className="mx-auto mt-4 max-w-4xl px-4 sm:-mt-6 sm:px-6">
      <form onSubmit={handleSubmit(submit)} className="space-y-6 rounded-[32px] bg-white p-5 shadow-xl sm:p-10 dark:bg-dark-card dark:border dark:border-dark-border">
        <div>
          <p className="eyebrow">{t('sellerForm.sectionEyebrow')}</p>
          <h2 className="mt-2 text-3xl font-bold text-ink dark:text-dark-text">{t('sellerForm.headline')}</h2>
        </div>

        <div className="space-y-6">
          <div className="block space-y-2">
            <span className="field-label">{t('sellerForm.sellerTypeQuestion')} *</span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {sellerTypeOptions.map((opt) => {
                const isSelected = selectedSellerType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setValue('sellerType', opt.value, { shouldDirty: true, shouldValidate: true });
                      clearErrors('sellerType');
                    }}
                    className={`flex h-12 w-full items-center justify-center rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? 'border-[#1D5CA9] bg-[#1D5CA9] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#1D5CA9]/50 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('sellerType', { required: t('sellerForm.sellerTypeRequired') })} />
            {errors.sellerType && <p className="error-style">{errors.sellerType.message}</p>}
          </div>

          <label className="block">
            <span className="field-label">{t('sellerForm.state')} *</span>
            <input
              type="text"
              value={t('Gujarat')}
              readOnly
              disabled
              className="field-control w-full bg-slate-100 text-slate-600"
            />
            <input type="hidden" {...register('state', { required: t('sellerForm.stateRequired') })} value="Gujarat" />
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.district')} *</span>
            <select {...register('district', { required: t('sellerForm.districtRequired') })} className="field-control w-full">
              <option value="">{t('sellerForm.selectDistrict')}</option>
              {gujaratDistricts.map((district) => (
                <option key={district} value={district}>
                  {t(district)}
                </option>
              ))}
            </select>
            {errors.district && <p className="error-style">{errors.district.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.taluka')} *</span>
            <select
              {...register('subDistrict', { required: t('sellerForm.talukaRequired') })}
              className="field-control w-full"
              disabled={!selectedDistrict}
              value={watch('subDistrict') || ''}
              onChange={(event) => {
                setValue('subDistrict', event.target.value, { shouldDirty: true, shouldValidate: true });
                if (event.target.value) clearErrors('subDistrict');
                if (event.target.value) event.target.blur();
              }}
            >
              <option value="">{selectedDistrict ? t('sellerForm.selectTaluka') : t('sellerForm.selectDistrictFirst')}</option>
              {subDistrictOptions.map((subDistrict) => (
                <option key={subDistrict} value={subDistrict}>
                  {t(subDistrict)}
                </option>
              ))}
            </select>
            {errors.subDistrict && <p className="error-style">{errors.subDistrict.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.village')} *</span>
            <select
              {...register('village', { required: t('sellerForm.villageRequired') })}
              className="field-control w-full"
              disabled={!selectedTaluka}
              value={watch('village') || ''}
              onChange={(event) => {
                setValue('village', event.target.value, { shouldDirty: true, shouldValidate: true });
                if (event.target.value) clearErrors('village');
                if (event.target.value) event.target.blur();
              }}
            >
              <option value="">{selectedTaluka ? t('sellerForm.selectVillage') : t('sellerForm.selectTalukaFirst')}</option>
              {villageOptions.map((village) => (
                <option key={village} value={village}>
                  {t(village)}
                </option>
              ))}
            </select>
            {errors.village && <p className="error-style">{errors.village.message}</p>}
          </label>

          <div className="block space-y-2">
            <span className="field-label">{t('sellerForm.propertyType')} *</span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {propertyTypeOptions.map((opt) => {
                const isSelected = selectedType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setValue('type', opt.value, { shouldDirty: true, shouldValidate: true });
                      clearErrors('type');
                    }}
                    className={`flex h-12 w-full items-center justify-center rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? 'border-[#1D5CA9] bg-[#1D5CA9] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#1D5CA9]/50 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('type', { required: t('sellerForm.propertyTypeRequired') })} />
            {errors.type && <p className="error-style">{errors.type.message}</p>}
          </div>

          <label className="block">
            <span className="field-label">{t('sellerForm.priceUnit')} *</span>
            <select {...register('priceUnit', { required: t('sellerForm.priceUnitRequired') })} className="field-control w-full">
              <option value="">{t('sellerForm.selectPriceUnit')}</option>
              {priceUnitOptions.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            {errors.priceUnit && <p className="error-style">{errors.priceUnit.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.priceAmount')} *</span>
            <input
              type="text"
              value={displayPrice}
              onChange={handlePriceInput}
              className="field-control w-full"
              placeholder={t('sellerForm.pricePlaceholder')}
              inputMode="numeric"
            />
            {priceAmountValue ? (
              <p className="mt-1.5 text-xs font-semibold text-[#1D5CA9]">
                ≈ {formatIndianPrice(priceAmountValue)}
              </p>
            ) : null}
            {errors.priceAmount && <p className="error-style">{errors.priceAmount.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.propertyImages')}</span>
            <div className="rounded-[28px] border border-slate-200 bg-cream p-4">
              <input type="file" accept="image/*" multiple onChange={(event) => addFiles(event, setImages, 'image/')} className="field-control w-full bg-white" />
              <p className="mt-3 text-sm text-slate-500">{t('sellerForm.imageHint')}</p>
              {images.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {images.map((item, index) => (
                    <div key={item.url} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                      <img src={item.url} alt="Property upload" className="h-40 w-full object-cover" />
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-800">{t('sellerForm.imageLabel')} {index + 1}</p>
                        <button type="button" onClick={() => removeFile(setImages, index)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{t('common.clear')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.propertyVideos')}</span>
            <div className="rounded-[28px] border border-slate-200 bg-cream p-4">
              <input type="file" accept="video/*" multiple onChange={(event) => addFiles(event, setVideos, 'video/')} className="field-control w-full bg-white" />
              {videos.length > 0 && (
                <div className="mt-4 space-y-3">
                  {videos.map((item, index) => (
                    <div key={item.url} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                      <video controls src={item.url} className="h-48 w-full bg-slate-900" />
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-800">{t('sellerForm.videoLabel')} {index + 1}</p>
                        <button type="button" onClick={() => removeFile(setVideos, index)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{t('common.clear')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.document')} *</span>
            <div className="rounded-[28px] border border-slate-200 bg-cream p-4">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setPdf(event.target.files?.[0] || null)} className="field-control w-full bg-white" />
              <p className="mt-3 text-sm text-slate-500">{t('sellerForm.documentHint')}</p>
              {pdf && (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800 truncate">{pdf.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{t('sellerForm.documentReady')}</p>
                    </div>
                    <button type="button" onClick={() => setPdf(null)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{t('common.clear')}</button>
                  </div>
                </div>
              )}
            </div>
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.mapLink')} *</span>
            <input
              {...register('mapLink', { required: t('sellerForm.mapLinkRequired'), pattern: { value: /^https?:\/\//i, message: t('sellerForm.mapLinkInvalid') } })}
              className="field-control w-full"
              placeholder={t('sellerForm.mapPlaceholder')}
            />
            {errors.mapLink && <p className="error-style">{errors.mapLink.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">{t('sellerForm.additionalDetails')}</span>
            <textarea
              {...register('additionalDetails')}
              rows="5"
              className="field-control w-full resize-y min-h-[160px]"
              placeholder={t('sellerForm.additionalPlaceholder')}
            />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <LargeButton type="submit" disabled={submitting} className="min-h-[48px]">
            {submitting ? t('sellerForm.submitting') : t('sellerForm.submit')}
          </LargeButton>
        </div>
      </form>
    </section>
    </div>
  );
}

export default SellerForm;
