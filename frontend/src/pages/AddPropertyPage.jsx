import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, GripVertical, ImagePlus, MapPin, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

const amenityOptions = ['Lift', 'Parking', 'Power Backup', 'Security', 'Garden', 'Clubhouse', 'Balcony', 'CCTV'];
const statusOptions = ['Available', 'Sold', 'Pending'];
const propertyTypeOptions = ['Apartment', 'Villa', 'House', 'Plot', 'Farm House', 'Commercial', 'Office'];

const propertyTypeTranslationKeys = {
  Apartment: 'dropdown.apartment',
  Villa: 'dropdown.villa',
  House: 'dropdown.house',
  Plot: 'dropdown.plot',
  'Farm House': 'dropdown.farmHouse',
  Commercial: 'dropdown.commercial',
  Office: 'dropdown.office',
};

const amenityTranslationKeys = {
  Lift: 'dropdown.lift',
  Parking: 'dropdown.parking',
  'Power Backup': 'dropdown.powerBackup',
  Security: 'dropdown.security',
  Garden: 'dropdown.garden',
  Clubhouse: 'dropdown.clubhouse',
  Balcony: 'dropdown.balcony',
  CCTV: 'dropdown.cctv',
};

const facingTranslationKeys = {
  East: 'dropdown.east',
  West: 'dropdown.west',
  North: 'dropdown.north',
  South: 'dropdown.south',
};

const statusTranslationKeys = {
  Available: 'dropdown.available',
  Sold: 'dropdown.sold',
  Pending: 'dropdown.pending',
};

const initialDetails = {
  title: '',
  city: 'Ahmedabad',
  address: '',
  propertyType: 'Apartment',
  price: '',
  bedrooms: '2',
  bathrooms: '1',
  area: '',
  parking: 'Yes',
  facing: 'East',
  description: '',
  status: 'Available',
  location: '',
  mapUrl: '',
};

function AddPropertyPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const editId = useMemo(() => new URLSearchParams(location.search).get('edit'), [location.search]);
  const [images, setImages] = useState([]);
  const [details, setDetails] = useState(initialDetails);
  const [amenities, setAmenities] = useState([]);
  const [activeDragIndex, setActiveDragIndex] = useState(null);

  useEffect(() => {
    if (!editId) return;
    const listings = readStorage(STORAGE_KEYS.listings, []);
    const currentListing = listings.find((item) => item.id === editId);
    if (!currentListing) return;
    setDetails({
      title: currentListing.title || '',
      city: currentListing.city || 'Ahmedabad',
      address: currentListing.address || '',
      propertyType: currentListing.propertyType || 'Apartment',
      price: currentListing.price || '',
      bedrooms: currentListing.bedrooms || '2',
      bathrooms: currentListing.bathrooms || '1',
      area: currentListing.area || '',
      parking: currentListing.parking || 'Yes',
      facing: currentListing.facing || 'East',
      description: currentListing.description || '',
      status: currentListing.status || 'Available',
      location: currentListing.location || '',
      mapUrl: currentListing.mapUrl || '',
    });
    setAmenities(currentListing.amenities || []);
    setImages(currentListing.images || []);
  }, [editId]);

  const update = (event) => setDetails((current) => ({ ...current, [event.target.name]: event.target.value }));

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleImages = async (event) => {
    const files = Array.from(event.target.files || []);
    const nextImages = await Promise.all(files.map(async (file) => ({ name: file.name, preview: await readFileAsDataUrl(file) })));
    setImages((current) => [...current, ...nextImages]);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const nextImages = await Promise.all(files.map(async (file) => ({ name: file.name, preview: await readFileAsDataUrl(file) })));
    setImages((current) => [...current, ...nextImages]);
  };

  const removeImage = (index) => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  const moveImage = (fromIndex, toIndex) => {
    setImages((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const submitProperty = (event) => {
    event.preventDefault();
    if (!details.title || !details.address || !details.price || !details.area || !details.description) {
      toast.error('Please complete the required listing details.');
      return;
    }

    const listing = {
      id: editId || `listing-${Date.now()}`,
      ...details,
      amenities,
      images,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existing = readStorage(STORAGE_KEYS.listings, []);
    const nextListings = editId
      ? existing.map((item) => (item.id === editId ? listing : item))
      : [listing, ...existing];

    writeStorage(STORAGE_KEYS.listings, nextListings);
    writeStorage(STORAGE_KEYS.lastProperty, listing);
    toast.success(editId ? 'Listing updated successfully.' : 'Property added successfully.');
    navigate('/seller-dashboard', { state: { listing, refreshed: true } });
  };

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-[#FFFEFE] px-4 pb-20 pt-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-card sm:p-10">
          <p className="eyebrow">{t('sellerForm.sectionEyebrow')}</p>
          <h1 className="mt-3 text-4xl font-bold text-ink">{editId ? t('common.edit') : t('sellerForm.title')}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">{t('sellerForm.authMessage')}</p>
        </div>
        <form onSubmit={submitProperty} className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-semibold text-ink">{t('sellerForm.sectionEyebrow')}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="field-label">{t('sellerForm.title')} *</span><input required name="title" value={details.title} onChange={update} placeholder="e.g. Spacious 3 BHK near the city center" className="field-control" /></label>
              <label><span className="field-label">{t('sellerForm.propertyType')}</span><select name="propertyType" value={details.propertyType} onChange={update} className="field-control">{propertyTypeOptions.map((option) => <option key={option} value={option}>{t(propertyTypeTranslationKeys[option] || option)}</option>)}</select></label>
              <label><span className="field-label">{t('sellerForm.district')}</span><select name="city" value={details.city} onChange={update} className="field-control">{['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Navsari'].map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
              <label className="sm:col-span-2"><span className="field-label">{t('sellerForm.village')} *</span><div className="relative"><MapPin size={18} className="absolute left-4 top-4 text-primary" /><input required name="address" value={details.address} onChange={update} placeholder="Locality, landmark and street" className="field-control pl-11" /></div></label>
              <label><span className="field-label">{t('sellerForm.priceAmount')} *</span><input required name="price" value={details.price} onChange={update} placeholder="e.g. 75 Lakh" className="field-control" /></label>
              <label><span className="field-label">{t('sellerForm.priceUnit')} *</span><input required name="area" value={details.area} onChange={update} placeholder="e.g. 1,250 sqft" className="field-control" /></label>
              <label><span className="field-label">{t('sellerForm.bedrooms')}</span><select name="bedrooms" value={details.bedrooms} onChange={update} className="field-control"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>
              <label><span className="field-label">{t('sellerForm.bathrooms')}</span><select name="bathrooms" value={details.bathrooms} onChange={update} className="field-control"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
              <label><span className="field-label">{t('dropdown.parking')}</span><select name="parking" value={details.parking} onChange={update} className="field-control"><option value="Yes">{t('dropdown.yes')}</option><option value="No">{t('dropdown.no')}</option></select></label>
              <label><span className="field-label">{t('sellerForm.facing')}</span><select name="facing" value={details.facing} onChange={update} className="field-control"><option value="East">{t(facingTranslationKeys.East)}</option><option value="West">{t(facingTranslationKeys.West)}</option><option value="North">{t(facingTranslationKeys.North)}</option><option value="South">{t(facingTranslationKeys.South)}</option></select></label>
              <label><span className="field-label">{t('common.status')}</span><select name="status" value={details.status} onChange={update} className="field-control">{statusOptions.map((option) => <option key={option} value={option}>{t(statusTranslationKeys[option] || option)}</option>)}</select></label>
              <label><span className="field-label">{t('buy.location')}</span><input name="location" value={details.location} onChange={update} placeholder="e.g. Satellite" className="field-control" /></label>
              <label className="sm:col-span-2"><span className="field-label">{t('sellerForm.mapLink')}</span><input name="mapUrl" value={details.mapUrl} onChange={update} placeholder="https://www.google.com/maps/.." className="field-control" /></label>
              <div className="sm:col-span-2"><span className="field-label">{t('sellerForm.amenities')}</span><div className="mt-3 flex flex-wrap gap-3">{amenityOptions.map((item) => <label key={item} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"><input type="checkbox" checked={amenities.includes(item)} onChange={(event) => setAmenities((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))} className="h-4 w-4 rounded border-slate-300 text-primary" />{t(amenityTranslationKeys[item] || item)}</label>)}</div></div>
              <label className="sm:col-span-2"><span className="field-label">{t('sellerForm.additionalDetails')} *</span><textarea required name="description" value={details.description} onChange={update} rows="5" placeholder="Tell buyers what makes this property special" className="field-control resize-y" /></label>
            </div>
          </section>
          <aside className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-blue-50 p-6">
              <div className="flex items-center gap-3"><ImagePlus className="text-primary" /><h2 className="text-lg font-bold text-ink">{t('sellerForm.propertyImages')}</h2></div>
              <p className="mt-3 text-sm leading-6 text-muted">{t('sellerForm.imageHint')}</p>
              <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-white px-5 py-8 text-center hover:border-primary">
                <UploadCloud className="text-primary" />
                <span className="text-sm font-semibold text-ink">{t('sellerForm.imageHint')}</span>
                <span className="text-xs text-muted">PNG, JPG, WEBP</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="sr-only" />
              </div>
              {images.length > 0 && <div className="mt-4 space-y-3">{images.map((image, index) => <div key={`${image.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><img src={image.preview || image} alt={image.name} className="h-16 w-16 rounded-xl object-cover" /><div className="flex-1"><p className="text-sm font-semibold text-ink">{image.name}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => moveImage(index, Math.max(0, index - 1))} className="rounded-full border border-slate-200 p-2 text-slate-600"><ArrowUpDown size={15} /></button><button type="button" onClick={() => removeImage(index)} className="rounded-full border border-slate-200 p-2 text-danger"><Trash2 size={15} /></button></div></div>)}</div>}
            </section>
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-sage-dark"><Plus size={19} /> {editId ? t('common.edit') : t('sellerForm.submit')}</button>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default AddPropertyPage;
