import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, GripVertical, ImagePlus, MapPin, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';

const amenityOptions = ['Lift', 'Parking', 'Power Backup', 'Security', 'Garden', 'Clubhouse', 'Balcony', 'CCTV'];
const statusOptions = ['Available', 'Sold', 'Pending'];
const propertyTypeOptions = ['Apartment', 'Villa', 'House', 'Plot', 'Farm House', 'Commercial', 'Office'];

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
          <p className="eyebrow">Premium listing workspace</p>
          <h1 className="mt-3 text-4xl font-bold text-ink">{editId ? 'Edit this listing' : 'List a new property'}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">The form is designed to feel like a polished local listing workflow. Every image preview is stored in localStorage so it is ready for a later backend integration.</p>
        </div>
        <form onSubmit={submitProperty} className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-semibold text-ink">Property information</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="field-label">Property title *</span><input required name="title" value={details.title} onChange={update} placeholder="e.g. Spacious 3 BHK near the city center" className="field-control" /></label>
              <label><span className="field-label">Property type</span><select name="propertyType" value={details.propertyType} onChange={update} className="field-control">{propertyTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              <label><span className="field-label">City</span><select name="city" value={details.city} onChange={update} className="field-control"><option>Ahmedabad</option><option>Surat</option><option>Vadodara</option><option>Rajkot</option><option>Gandhinagar</option><option>Navsari</option></select></label>
              <label className="sm:col-span-2"><span className="field-label">Full address *</span><div className="relative"><MapPin size={18} className="absolute left-4 top-4 text-primary" /><input required name="address" value={details.address} onChange={update} placeholder="Locality, landmark and street" className="field-control pl-11" /></div></label>
              <label><span className="field-label">Expected price *</span><input required name="price" value={details.price} onChange={update} placeholder="e.g. 75 Lakh" className="field-control" /></label>
              <label><span className="field-label">Area *</span><input required name="area" value={details.area} onChange={update} placeholder="e.g. 1,250 sqft" className="field-control" /></label>
              <label><span className="field-label">Bedrooms / BHK</span><select name="bedrooms" value={details.bedrooms} onChange={update} className="field-control"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>
              <label><span className="field-label">Bathrooms</span><select name="bathrooms" value={details.bathrooms} onChange={update} className="field-control"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
              <label><span className="field-label">Parking</span><select name="parking" value={details.parking} onChange={update} className="field-control"><option>Yes</option><option>No</option></select></label>
              <label><span className="field-label">Facing</span><select name="facing" value={details.facing} onChange={update} className="field-control"><option>East</option><option>West</option><option>North</option><option>South</option></select></label>
              <label><span className="field-label">Status</span><select name="status" value={details.status} onChange={update} className="field-control">{statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              <label><span className="field-label">Location</span><input name="location" value={details.location} onChange={update} placeholder="e.g. Satellite" className="field-control" /></label>
              <label className="sm:col-span-2"><span className="field-label">Map URL</span><input name="mapUrl" value={details.mapUrl} onChange={update} placeholder="https://www.google.com/maps/.." className="field-control" /></label>
              <div className="sm:col-span-2"><span className="field-label">Amenities</span><div className="mt-3 flex flex-wrap gap-3">{amenityOptions.map((item) => <label key={item} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"><input type="checkbox" checked={amenities.includes(item)} onChange={(event) => setAmenities((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))} className="h-4 w-4 rounded border-slate-300 text-primary" />{item}</label>)}</div></div>
              <label className="sm:col-span-2"><span className="field-label">Description *</span><textarea required name="description" value={details.description} onChange={update} rows="5" placeholder="Tell buyers what makes this property special" className="field-control resize-y" /></label>
            </div>
          </section>
          <aside className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-blue-50 p-6">
              <div className="flex items-center gap-3"><ImagePlus className="text-primary" /><h2 className="text-lg font-bold text-ink">Image gallery</h2></div>
              <p className="mt-3 text-sm leading-6 text-muted">Upload multiple photos, reorder them and remove anything that does not help the listing.</p>
              <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-white px-5 py-8 text-center hover:border-primary">
                <UploadCloud className="text-primary" />
                <span className="text-sm font-semibold text-ink">Drop images or browse</span>
                <span className="text-xs text-muted">PNG, JPG and webp are supported</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="sr-only" />
              </div>
              {images.length > 0 && <div className="mt-4 space-y-3">{images.map((image, index) => <div key={`${image.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><img src={image.preview || image} alt={image.name} className="h-16 w-16 rounded-xl object-cover" /><div className="flex-1"><p className="text-sm font-semibold text-ink">{image.name}</p><p className="text-xs text-muted">Drag to reorder or remove</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => moveImage(index, Math.max(0, index - 1))} className="rounded-full border border-slate-200 p-2 text-slate-600"><ArrowUpDown size={15} /></button><button type="button" onClick={() => removeImage(index)} className="rounded-full border border-slate-200 p-2 text-danger"><Trash2 size={15} /></button></div></div>)}</div>}
            </section>
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-sage-dark"><Plus size={19} /> {editId ? 'Update Listing' : 'Submit Property'}</button>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default AddPropertyPage;
