import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LargeButton from '../components/LargeButton';
import { useUserStore } from '../store/useUserStore';
import { gujaratDistricts, gujaratSubDistricts, gujaratVillages } from '../utils/data';
import { appendStorageArray, readStorage, writeStorage, STORAGE_KEYS } from '../utils/storage';
import logo from '../assets/images/logo.png';
import { useLanguage } from '../i18n/LanguageContext';

import { formatIndianPrice } from '../utils/format';

const fallbackPropertyImage = logo;
const metadata = (files) => Array.from(files || []).map((file) => ({ name: file.name, type: file.type, size: file.size, lastModified: file.lastModified }));

function SellerForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const user = useUserStore((state) => state.user);
  const { register, handleSubmit, watch, setValue, clearErrors, formState: { errors } } = useForm({
    defaultValues: {
      state: 'Gujarat',
      district: '',
      subDistrict: '',
      village: '',
      type: '',
      priceUnit: '',
      priceAmount: '',
      mapLink: '',
      additionalDetails: '',
    },
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [displayPrice, setDisplayPrice] = useState('');
  const propertyTypeOptions = useMemo(() => [
    { value: 'Agricultural Land', label: t('sellerForm.agriculturalLand') },
    { value: 'Non-Agricultural Land', label: t('sellerForm.nonAgriculturalLand') },
  ], [t]);
  const priceUnitOptions = useMemo(() => [
    { value: 'Vigha', label: t('sellerForm.vigha') },
    { value: 'sq.yard (var)', label: t('sellerForm.sqYard') },
    { value: 'Sq.Ft', label: t('sellerForm.sqFt') },
  ], [t]);
  const selectedDistrict = watch('district');
  const selectedTaluka = watch('subDistrict');
  const subDistrictOptions = selectedDistrict ? gujaratSubDistricts[selectedDistrict] || [] : [];
  const villageOptions = useMemo(() => {
    if (!selectedDistrict || !selectedTaluka) return [];
    return (gujaratVillages[selectedDistrict]?.[selectedTaluka] || []).slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [selectedDistrict, selectedTaluka]);

  useEffect(() => {
    setValue('subDistrict', '');
    setValue('village', '');
    clearErrors('village');
  }, [selectedDistrict, setValue, clearErrors]);

  useEffect(() => {
    setValue('village', '');
    clearErrors('village');
  }, [selectedTaluka, setValue, clearErrors]);

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
    const digitsOnly = String(value).replace(/[^\d]/g, '');
    setDisplayPrice(formatIndianNumber(digitsOnly));
    setValue('priceAmount', digitsOnly, { shouldDirty: true, shouldValidate: true });
  };

  const submit = (data) => {
    if (!pdf) { toast.error(t('sellerForm.documentRequired')); return; }
    setSubmitting(true);
    const listingId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `listing-${Date.now()}`;
    const imageUrls = images.map((item) => item.url).filter(Boolean);
    const pdfUrl = pdf ? URL.createObjectURL(pdf) : '';
    const priceValue = data.priceAmount ? Number(String(data.priceAmount).replace(/[^\d]/g, '')) : 0;
    const title = `${data.type || 'Land'} in ${data.village || data.subDistrict || data.district || 'Gujarat'}`;
    const lead = {
      id: listingId,
      ...data,
      priceAmount: data.priceAmount || '',
      subDistrict: data.subDistrict || '',
      village: data.village || '',
      userId: user?.id || '', userName: user?.name || '', userMobile: user?.mobile || '', userEmail: user?.email || '',
      ownerName: user?.name || '', ownerMobile: user?.mobile || '', ownerEmail: user?.email || '',
      propertyImages: metadata(images.map((item) => item.file)), propertyVideos: metadata(videos.map((item) => item.file)), propertyDocument: metadata([pdf])[0],
      submittedAt: new Date().toISOString(),
    };
    const listing = {
      ...lead,
      id: listingId,
      title,
      name: title,
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
      price: priceValue ? formatIndianPrice(priceValue) : 'Price on request',
      priceAmount: priceValue ? String(priceValue) : '',
      priceUnit: data.priceUnit || '',
      landArea: data.additionalDetails || 'Area not specified',
      area: data.additionalDetails || 'Area not specified',
      description: data.additionalDetails || 'Verified land listing with clear location and pricing details.',
      status: 'Available',
      verified: true,
      image: fallbackPropertyImage,
      gallery: [fallbackPropertyImage],
      images: [fallbackPropertyImage],
      propertyDocument: pdf ? { name: pdf.name, type: pdf.type, size: pdf.size, lastModified: pdf.lastModified, url: '#' } : null,
      documentUrl: '#',
      mapLink: data.mapLink || '',
      mapUrl: data.mapLink || '',
      googleMaps: data.mapLink || '',
      seller: { name: user?.name || '', phone: user?.mobile || '', email: user?.email || '' },
      sellerName: user?.name || '',
      sellerPhone: user?.mobile || '',
      sellerEmail: user?.email || '',
      ownerName: user?.name || '',
      ownerMobile: user?.mobile || '',
      ownerEmail: user?.email || '',
      submittedAt: lead.submittedAt,
      createdAt: lead.submittedAt,
      updatedAt: lead.submittedAt,
      uploadedDate: lead.submittedAt,
      userId: user?.id || '',
    };
    try {
      appendStorageArray(STORAGE_KEYS.sellerLeads, lead);
      appendStorageArray(STORAGE_KEYS.listings, listing);
      writeStorage(STORAGE_KEYS.lastProperty, listing);
    } catch {
      toast.error(t('sellerForm.saveError'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    toast.success(t('sellerForm.submitSuccess'));
    navigate('/seller-form', { state: { justSubmitted: true, data: lead } });
  };

  return <div className="-mx-4 -mt-8 bg-cream pb-28 sm:pb-20 sm:-mx-6 lg:-mx-8 dark:bg-dark-bg">
    <section className="bg-[#1D5CA9] px-4 py-12 text-white sm:px-10 sm:py-16 lg:px-12 dark:bg-dark-card dark:border-b dark:border-dark-border"><div className="mx-auto max-w-5xl"><p className="eyebrow text-white/80">{t('sellerForm.title')}</p><h1 className="mt-4 text-3xl font-bold sm:text-6xl">{t('sellerForm.smallHeading')}</h1><p className="mt-4 max-w-2xl text-sm text-white/80 sm:text-base">{t('sellerForm.authMessage')}</p><p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">{t('sellerForm.helpDescription')}</p></div></section>
    <section className="mx-auto mt-4 max-w-4xl px-4 sm:-mt-8 sm:px-6">
      <form onSubmit={handleSubmit(submit)} className="space-y-6 rounded-[32px] bg-white p-5 shadow-xl sm:p-10 dark:bg-dark-card dark:border dark:border-dark-border">
        <div>
          <p className="eyebrow">{t('sellerForm.sectionEyebrow')}</p>
          <h2 className="mt-2 text-3xl font-bold text-ink dark:text-dark-text">{t('sellerForm.headline')}</h2>
        </div>

        <div className="space-y-6">
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

          <label className="block">
            <span className="field-label">{t('sellerForm.propertyType')} *</span>
            <select {...register('type', { required: t('sellerForm.propertyTypeRequired') })} className="field-control w-full">
              <option value="">{t('sellerForm.selectPropertyType')}</option>
              {propertyTypeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && <p className="error-style">{errors.type.message}</p>}
          </label>

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
  </div>;
}

export default SellerForm;
