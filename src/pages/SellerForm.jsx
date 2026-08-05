import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LargeButton from '../components/LargeButton';
import { useUserStore } from '../store/useUserStore';
import { gujaratStateOptions, gujaratDistricts } from '../utils/data';
import { appendStorageArray, writeStorage, STORAGE_KEYS } from '../utils/storage';

const propertyTypes = ['Agricultural Land', 'Non-Agricultural Land'];
const priceTypes = ['Total Property Price', 'Per Acre', 'Per Hectare', 'Per Guntha', 'Per Sq. Yard'];
const metadata = (files) => Array.from(files || []).map((file) => ({ name: file.name, type: file.type, size: file.size, lastModified: file.lastModified }));

function SellerForm() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (event, setter, accept) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith(accept));
    setter((current) => [...current, ...files].map((file) => ({ file, url: URL.createObjectURL(file) })));
    event.target.value = '';
  };
  const removeFile = (setter, index) => setter((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const submit = (data) => {
    if (!pdf) { toast.error('Please upload a property PDF.'); return; }
    setSubmitting(true);
    const lead = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `seller-${Date.now()}`,
      ...data,
      userId: user?.id || '', userName: user?.name || '', userMobile: user?.mobile || '', userEmail: user?.email || '',
      ownerName: user?.name || '', ownerMobile: user?.mobile || '', ownerEmail: user?.email || '',
      propertyImages: metadata(images.map((item) => item.file)), propertyVideos: metadata(videos.map((item) => item.file)), propertyDocument: metadata([pdf])[0],
      submittedAt: new Date().toISOString(),
    };
    try {
      appendStorageArray(STORAGE_KEYS.sellerLeads, lead);
      writeStorage(STORAGE_KEYS.lastProperty, lead);
    } catch {
      toast.error('Unable to save the property details.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    toast.success('Your property has been submitted successfully.');
    navigate('/add-property', { state: { justSubmitted: true, data: lead } });
  };

  return <div className="-mx-4 -mt-8 bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
    <section className="bg-ink px-6 py-16 text-white sm:px-10 lg:px-12"><div className="mx-auto max-w-5xl"><p className="eyebrow text-blue-200">Sell land with Broker Streets</p><h1 className="mt-4 text-4xl font-bold sm:text-6xl">List your land with confidence.</h1><p className="mt-4 max-w-2xl text-white/70">Your authenticated profile is attached securely to this listing.</p></div></section>
    <section className="mx-auto -mt-8 max-w-4xl px-6">
      <form onSubmit={handleSubmit(submit)} className="space-y-6 rounded-[32px] bg-white p-8 shadow-xl sm:p-10">
        <div>
          <p className="eyebrow">Land details</p>
          <h2 className="mt-2 text-3xl font-bold text-ink">Tell us about your land</h2>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="field-label">State *</span>
            <select {...register('state', { required: 'State is required' })} className="field-control w-full">
              <option value="">Select state</option>
              {gujaratStateOptions.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
            {errors.state && <p className="error-style">{errors.state.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">District *</span>
            <select {...register('district', { required: 'District is required' })} className="field-control w-full">
              <option value="">Select district</option>
              {gujaratDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            {errors.district && <p className="error-style">{errors.district.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">City *</span>
            <input
              {...register('city', { required: 'City is required' })}
              className="field-control w-full"
              placeholder="e.g. Surat"
            />
            {errors.city && <p className="error-style">{errors.city.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">Property Type *</span>
            <select {...register('type', { required: 'Select a property type' })} className="field-control w-full">
              <option value="">Select land type</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && <p className="error-style">{errors.type.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">Price *</span>
            <input
              type="number"
              {...register('price', { required: 'Price is required', min: { value: 1, message: 'Enter a valid price' } })}
              className="field-control w-full"
              placeholder="Enter price"
            />
            {errors.price && <p className="error-style">{errors.price.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">Price Type *</span>
            <select {...register('priceType', { required: 'Select a price type' })} className="field-control w-full">
              <option value="">Select price type</option>
              {priceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.priceType && <p className="error-style">{errors.priceType.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">Property Images</span>
            <input type="file" accept="image/*" multiple onChange={(event) => addFiles(event, setImages, 'image/')} className="field-control w-full" />
            {images.length === 0 && <p className="mt-1 text-xs text-slate-500">Upload one or more image files.</p>}
            {images.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {images.map((item, index) => (
                  <div key={item.url} className="space-y-2">
                    <img src={item.url} alt="Property upload" className="h-36 w-full rounded-3xl object-cover" />
                    <button type="button" onClick={() => removeFile(setImages, index)} className="text-sm font-semibold text-red-600">Remove image</button>
                  </div>
                ))}
              </div>
            )}
          </label>

          <label className="block">
            <span className="field-label">Property Videos</span>
            <input type="file" accept="video/*" multiple onChange={(event) => addFiles(event, setVideos, 'video/')} className="field-control w-full" />
            {videos.length > 0 && (
              <div className="mt-3 space-y-3">
                {videos.map((item, index) => (
                  <div key={item.url}>
                    <video controls src={item.url} className="h-48 w-full rounded-3xl bg-slate-900" />
                    <button type="button" onClick={() => removeFile(setVideos, index)} className="mt-2 text-sm font-semibold text-red-600">Remove video</button>
                  </div>
                ))}
              </div>
            )}
          </label>

          <label className="block">
            <span className="field-label">Property PDF *</span>
            <input type="file" accept="application/pdf,.pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} className="field-control w-full" />
            {pdf && (
              <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="truncate">{pdf.name}</span>
                  <button type="button" onClick={() => setPdf(null)} className="text-red-600">Remove PDF</button>
                </div>
              </div>
            )}
          </label>

          <label className="block">
            <span className="field-label">Google Maps Link *</span>
            <input
              {...register('mapLink', { required: 'Google Maps link is required', pattern: { value: /^https?:\/\//i, message: 'Enter a valid URL' } })}
              className="field-control w-full"
              placeholder="https://maps.google.com/..."
            />
            {errors.mapLink && <p className="error-style">{errors.mapLink.message}</p>}
          </label>

          <label className="block">
            <span className="field-label">Additional Details</span>
            <textarea
              {...register('additionalDetails')}
              rows="4"
              className="field-control w-full resize-y"
              placeholder="Land area, road access, water source, title details..."
            />
          </label>
        </div>

        <div className="flex justify-end">
          <LargeButton type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Property'}</LargeButton>
        </div>
      </form>
    </section>
  </div>;
}

export default SellerForm;
