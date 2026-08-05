import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bath, BedDouble, Building2, CheckCircle2, Heart, MapPin, Maximize2, Phone, Share2, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { readStorage, onListingsChanged, STORAGE_KEYS } from '../utils/storage';
import { sampleProperties } from '../utils/data';
import { getSubmissionDestination } from '../utils/formNavigation';
import PropertyCard from '../components/PropertyCard';
import AsyncImage from '../components/AsyncImage';
import ContactModal from '../components/ContactModal';
import SectionHeading from '../components/SectionHeading';
import { addRecentlyViewed, isPropertySaved, toggleSavedProperty } from '../utils/storage';

function PropertyDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [contactModal, setContactModal] = useState(null);

  const resolvePropertySource = () => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    return Array.isArray(stored) && stored.length ? stored : sampleProperties;
  };

  const loadProperty = () => {
    const source = resolvePropertySource();
    const current = source.find((item) => item.id === id) || sampleProperties.find((item) => item.id === id) || null;
    setProperty(current);
    if (!current) {
      setGallery([]);
      setSimilar([]);
      return;
    }

    const baseIndex = Math.max(0, (Number(String(current.id).split('-')[1]) || 1) - 1);
    setGallery([current, source[(baseIndex + 1) % source.length], source[(baseIndex + 2) % source.length]]);
    setSimilar(source.filter((item) => item.id !== current.id && item.type === current.type && item.city === current.city).slice(0, 4));
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  useEffect(() => {
    const cleanup = onListingsChanged(loadProperty);
    return cleanup;
  }, [id]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/property/${property.id}`;
    const shareText = `${property.title} • ${property.price} • ${property.location}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.info('Property link copied.');
      }
    } catch (error) {
      toast.error('Sharing is unavailable right now.');
    }
  };

  useEffect(() => {
    if (property) {
      addRecentlyViewed(property);
      setIsSaved(isPropertySaved(property.id));
      setActiveIndex(0);
    }
  }, [property]);

  if (!property) {
    return <div className="border border-slate-200 bg-white p-8 shadow-card"><h1 className="text-3xl font-semibold text-ink">Property not found</h1><p className="mt-3 text-muted">The listing you requested is unavailable. Please return to browsing.</p><button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Back to listings</button></div>;
  }

  return (
    <div className="-mx-4 -mt-8 bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12"><button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"><ArrowLeft size={17} /> Back to properties</button></div>
      <main className="mx-auto max-w-7xl space-y-12 px-6 lg:px-12">
        <section className="grid gap-3 lg:grid-cols-[1.45fr_0.8fr]">
          <div>
            <div className="relative h-[360px] overflow-hidden bg-slate-200 sm:h-[500px]">
              <AsyncImage src={property.gallery?.[0] || property.image} alt={property.title} className="h-full w-full object-cover cursor-zoom-in" onClick={() => setZoomOpen(true)} />
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-ink"><ShieldCheck size={15} className="text-primary" /> Verified listing</div>
              <div className="absolute right-5 top-5 flex items-center gap-2">
                <button type="button" aria-label="Share property" onClick={handleShare} className="rounded-full bg-white p-3 text-ink shadow-sm"><Share2 size={18} /></button>
                <button type="button" aria-label="Save property" onClick={() => { const next = toggleSavedProperty(property); setIsSaved(next.some((p) => String(p.id) === String(property.id))); }} className="rounded-full bg-white p-3 text-ink shadow-sm">{isSaved ? <Heart size={18} className="text-rose-600" /> : <Heart size={18} />}</button>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex gap-3 overflow-auto">
                {(property.gallery || []).map((img, idx) => (
                  <button key={img} onClick={() => setActiveIndex(idx)} className={`h-20 w-28 overflow-hidden rounded-lg ${activeIndex === idx ? 'ring-2 ring-sage' : ''}`}>
                    <AsyncImage src={img} alt={`${property.title} ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {zoomOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setZoomOpen(false)}>
                <img src={property.gallery?.[activeIndex] || property.image} alt={property.title} className="max-h-[90vh] max-w-[90vw] object-contain" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <AsyncImage src={property.gallery?.[1] || property.image} alt="Property interior" className="h-full min-h-[175px] w-full object-cover" />
            <AsyncImage src={property.gallery?.[2] || property.image} alt="Property exterior" className="h-full min-h-[175px] w-full object-cover" />
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="eyebrow">{property.type} - {property.location}</p>
                <div className="flex items-center gap-3">
                  <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">{property.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${property.type && property.type.toLowerCase().includes('agricultural') ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{property.type}</span>
                </div>
                <p className="mt-4 flex items-center gap-2 text-muted"><MapPin size={17} className="text-primary" />{property.address}</p>
                <p className="mt-2 text-sm text-muted">Uploaded: {property.uploadedDate || property.updatedAt || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-ink">{property.price}</p>
                <p className="mt-2 text-sm text-muted">{property.area}</p>
              </div>
            </div><div className="mt-8 grid grid-cols-2 gap-3 border-y border-slate-200 py-5 sm:grid-cols-4"><div className="flex items-center gap-3"><BedDouble size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.bedrooms} BHK</strong><small className="text-muted">Bedrooms</small></span></div><div className="flex items-center gap-3"><Bath size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.bathrooms}</strong><small className="text-muted">Bathrooms</small></span></div><div className="flex items-center gap-3"><Maximize2 size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.area}</strong><small className="text-muted">Built-up area</small></span></div><div className="flex items-center gap-3"><Building2 size={20} className="text-primary" /><span><strong className="block text-sm text-ink">{property.parking ? 'Yes' : 'No'}</strong><small className="text-muted">Parking</small></span></div></div><div className="mt-9"><h2 className="text-2xl font-semibold text-ink">About this property</h2><p className="mt-4 max-w-2xl leading-8 text-muted">{property.description}</p></div><div className="mt-9"><h2 className="text-2xl font-semibold text-ink">Amenities</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{['Lift access', '24/7 security', 'Power backup', 'Visitor parking', 'Water supply', 'Well-connected location'].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-muted"><CheckCircle2 size={17} className="text-primary" />{item}</div>)}</div></div>
            <div className="mt-9"><h2 className="text-2xl font-semibold text-ink">Nearby essentials</h2><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-slate-200 bg-blue-50 p-4"><strong className="block text-sm text-ink">Schools</strong><span className="mt-2 block text-sm text-muted">Within 2.4 km</span></div><div className="border border-slate-200 bg-blue-50 p-4"><strong className="block text-sm text-ink">Hospitals</strong><span className="mt-2 block text-sm text-muted">Within 3.1 km</span></div><div className="border border-slate-200 bg-blue-50 p-4"><strong className="block text-sm text-ink">Banks</strong><span className="mt-2 block text-sm text-muted">Within 1.2 km</span></div></div></div>
            <div className="mt-9 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-2xl font-semibold text-ink">Map & locality</h2>
              <div className="mt-4">
                <iframe title="property-map" src={property.mapUrl || property.googleMaps || `https://www.google.com/maps?q=${encodeURIComponent(property.address)}`} className="w-full h-72 rounded-[16px] border" loading="lazy" />
              </div>
            </div>
          </div>
          <aside className="self-start border border-slate-200 bg-white p-6 shadow-card lg:sticky lg:top-24">
            <p className="eyebrow">Interested in this home?</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Talk to the seller</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Get availability, viewing times, and answers to your questions.</p>
            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-muted">Seller</p>
              <p className="font-semibold text-ink">{property.seller?.name || property.sellerName || property.owner || property.ownerName || 'Seller'}</p>
              <p className="mt-1 text-sm text-muted">{property.city || property.district || property.location}</p>
              <p className="mt-2 text-sm"><strong>Mobile: </strong>{property.seller?.phone || property.sellerPhone || property.ownerMobile || '—'}</p>
              <p className="mt-1 text-sm"><strong>Email: </strong>{property.seller?.email || property.sellerEmail || property.ownerEmail || '—'}</p>
            </div>

            <div className="mt-6 grid gap-3">
              <a href={`tel:+91${String(property.seller?.phone || property.sellerPhone || property.ownerMobile || property.mobile || '').replace(/\D/g, '')}`} className="flex w-full items-center justify-center gap-2 rounded-full bg-sage px-5 py-3.5 font-semibold text-white"><Phone size={17} /> Call Seller</a>
              <a href={`https://wa.me/91${String(property.seller?.phone || property.sellerPhone || property.ownerMobile || property.mobile || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 px-5 py-3.5 font-semibold">WhatsApp Seller</a>
              <a href={`mailto:${property.seller?.email || property.sellerEmail || property.ownerEmail || property.email || ''}`} className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 px-5 py-3.5 font-semibold">Email Seller</a>
              <button type="button" onClick={() => setContactModal(property)} className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 font-semibold">Contact Seller</button>
            </div>
            <p className="mt-4 text-center text-xs text-muted">No commitment. Just useful guidance.</p>
          </aside>
        </section>

        <section><SectionHeading eyebrow="You may also like" title="Similar properties" /><div className="mt-8 grid gap-5 md:grid-cols-3">{similar.map((item) => <PropertyCard key={item.id} property={item} onContact={setContactModal} />)}</div></section>

        <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title="Contact Seller" />

      </main>
    </div>
  );
}

export default PropertyDetailsPage;
