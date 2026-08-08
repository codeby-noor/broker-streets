import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Heart, MapPin, Maximize2, Phone, Share2, ShieldCheck, X } from 'lucide-react';
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

const formatPrice = (value) => {
  if (typeof value === 'number') return `₹${value.toLocaleString('en-IN')}`;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'Not Provided';
    return trimmed.startsWith('₹') ? trimmed : trimmed;
  }
  return 'Not Provided';
};

function PropertyDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [sourceProperties, setSourceProperties] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [contactModal, setContactModal] = useState(null);
  const [touchStart, setTouchStart] = useState(null);

  const resolvePropertySource = () => {
    const stored = readStorage(STORAGE_KEYS.listings, []);
    return Array.isArray(stored) && stored.length ? stored : sampleProperties;
  };

  const loadProperty = () => {
    const source = resolvePropertySource();
    const current = source.find((item) => item.id === id) || sampleProperties.find((item) => item.id === id) || null;
    setSourceProperties(source);
    setProperty(current);
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  useEffect(() => {
    const cleanup = onListingsChanged(() => loadProperty());
    return cleanup;
  }, [id]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/property/${property?.id}`;
    const shareText = `${property?.title || 'Land listing'} • ${property?.price || ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title || 'Land listing', text: shareText, url: shareUrl });
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

  const galleryImages = useMemo(() => {
    const normalized = [];
    const candidates = [
      property?.gallery,
      property?.images,
      property?.image ? [property.image] : null,
      property?.photos,
      property?.media,
    ].filter(Boolean);

    candidates.forEach((entry) => {
      if (Array.isArray(entry)) {
        entry.forEach((item) => {
          if (typeof item === 'string' && item) normalized.push(item);
        });
      }
    });

    if (!normalized.length && property?.image) normalized.push(property.image);
    if (!normalized.length) normalized.push('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=85');
    return normalized.filter((item, index, array) => array.indexOf(item) === index);
  }, [property]);

  const overviewItems = useMemo(() => {
    const items = [];
    const addItem = (label, value, fallback) => {
      const resolved = value ?? fallback;
      if (resolved === undefined || resolved === null || resolved === '') return;
      if (typeof resolved === 'string' && resolved.trim() === '') return;
      if (typeof resolved === 'string' && resolved.toLowerCase() === 'not provided') return;
      items.push({ label, value: resolved });
    };

    addItem('Property Type', property?.type || property?.propertyType);
    addItem('Land Area', property?.landArea || property?.area);
    addItem('Price', formatPrice(property?.priceAmount || property?.price));
    addItem('Price Unit', property?.priceUnit);
    addItem('District', property?.district || property?.location);
    addItem('Taluka', property?.subDistrict || property?.taluka);
    addItem('Village', property?.village);
    addItem('State', property?.state || 'Gujarat');

    return items;
  }, [property]);

  const featureItems = useMemo(() => {
    if (!property) return [];
    const featureMap = [
      { label: 'Road Access', value: property?.roadAccess || property?.roadConnectivity || property?.roadAccessStatus },
      { label: 'Electricity Connection', value: property?.electricity || property?.electricityConnection || property?.electricityAvailable },
      { label: 'Water Availability', value: property?.waterAvailability || property?.waterSource || property?.water },
      { label: 'Borewell', value: property?.borewell || property?.hasBorewell },
      { label: 'Irrigation Facility', value: property?.irrigation || property?.irrigationFacility },
      { label: 'Boundary Wall', value: property?.boundaryWall || property?.boundaryFence || property?.boundary },
      { label: 'Fencing', value: property?.fencing || property?.hasFencing },
      { label: 'Corner Plot', value: property?.cornerPlot || property?.corner },
      { label: 'Facing Direction', value: property?.facing || property?.direction },
      { label: 'Soil Type', value: property?.soilType },
      { label: 'Ownership Status', value: property?.ownershipStatus || property?.ownership },
    ];

    return featureMap.map((item) => ({
      label: item.label,
      value: item.value || 'Not Provided',
      available: Boolean(item.value),
    }));
  }, [property]);

  const documentItems = useMemo(() => {
    const documents = [];
    const pushDocument = (entry) => {
      if (!entry) return;
      if (Array.isArray(entry)) {
        entry.forEach(pushDocument);
        return;
      }
      if (typeof entry === 'string') {
        documents.push({ name: '7/12 Document', url: entry, type: entry.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*' });
        return;
      }
      if (entry && typeof entry === 'object') {
        documents.push({
          name: entry.name || '7/12 Document',
          url: entry.url || entry.href || entry.link || entry.fileUrl || '',
          type: entry.type || 'application/pdf',
        });
      }
    };

    pushDocument(property?.propertyDocument);
    pushDocument(property?.propertyDocuments);
    pushDocument(property?.document);
    pushDocument(property?.documentUrl);
    pushDocument(property?.pdf);
    pushDocument(property?.documents);

    if (!documents.length && (property?.documentUrl || property?.pdf || property?.propertyDocument)) {
      documents.push({ name: '7/12 Document', url: property.documentUrl || property.pdf || property.propertyDocument?.url || '', type: 'application/pdf' });
    }

    return documents.slice(0, 1);
  }, [property]);

  const similarProperties = useMemo(() => {
    const currentType = property?.type || property?.propertyType || '';
    const currentDistrict = property?.district || property?.location || '';
    return sourceProperties.filter((item) => item.id !== property?.id).filter((item) => {
      const sameType = (item.type || item.propertyType || '').toLowerCase() === currentType.toLowerCase();
      const sameDistrict = (item.district || item.location || '').toLowerCase() === currentDistrict.toLowerCase();
      return sameType || sameDistrict;
    }).slice(0, 4);
  }, [property, sourceProperties]);

  const handlePrev = () => {
    setActiveIndex((current) => (current === 0 ? galleryImages.length - 1 : current - 1));
  };

  const handleNext = () => {
    setActiveIndex((current) => (current === galleryImages.length - 1 ? 0 : current + 1));
  };

  const handleTouchStart = (event) => setTouchStart(event.touches[0].clientX);
  const handleTouchEnd = (event) => {
    if (touchStart === null) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (delta > 50) handlePrev();
    if (delta < -50) handleNext();
    setTouchStart(null);
  };

  if (!property) {
    return <div className="border border-slate-200 bg-white p-8 shadow-card"><h1 className="text-3xl font-semibold text-ink">Property not found</h1><p className="mt-3 text-muted">The listing you requested is unavailable. Please return to browsing.</p><button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Back to listings</button></div>;
  }

  const propertyTitle = property.title || property.name || 'Land Listing';
  const propertyTypeLabel = property.type || property.propertyType || 'Land';
  const propertyLocationLabel = [property?.state || 'Gujarat', property?.district || property?.location || '', property?.subDistrict || property?.taluka || '', property?.village || ''].filter(Boolean).join(' • ');
  const postedDate = property.uploadedDate || property.submittedAt || property.createdAt || property.updatedAt || 'Recently listed';
  const sellerName = property.seller?.name || property.sellerName || property.owner || property.ownerName || 'Seller';
  const sellerPhone = property.seller?.phone || property.sellerPhone || property.ownerMobile || property.mobile || '';
  const sellerEmail = property.seller?.email || property.sellerEmail || property.ownerEmail || property.email || '';
  const sellerWhatsApp = sellerPhone ? `https://wa.me/91${String(sellerPhone).replace(/\D/g, '')}` : '';
  const sellerCall = sellerPhone ? `tel:${sellerPhone}` : '';
  const sellerMail = sellerEmail ? `mailto:${sellerEmail}` : '';

  return (
    <div className="-mx-4 -mt-8 bg-[#FFFEFE] pb-24 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
        <button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary">
          <ArrowLeft size={17} /> Back to properties
        </button>
      </div>

      <main className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-12">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-card">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-0 sm:p-6">
              <div className="relative overflow-hidden rounded-b-[32px] bg-slate-200" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <AsyncImage src={galleryImages[activeIndex] || galleryImages[0]} alt={propertyTitle} className="h-full w-full object-cover" onClick={() => setZoomOpen(true)} />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">{propertyTypeLabel}</span>
                      {property?.verified ? <span className="rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"><ShieldCheck size={13} className="mr-1 inline" />Verified listing</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Share property" onClick={handleShare} className="rounded-full bg-white/95 p-3 text-ink shadow-sm transition hover:bg-white"><Share2 size={17} /></button>
                      <button type="button" aria-label="Save property" onClick={() => { const next = toggleSavedProperty(property); setIsSaved(next.some((item) => String(item.id) === String(property.id))); }} className="rounded-full bg-white/95 p-3 text-ink shadow-sm transition hover:bg-white">{isSaved ? <Heart size={17} className="text-rose-600" /> : <Heart size={17} />}</button>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-4 sm:px-6">
                    <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">{activeIndex + 1}/{galleryImages.length}</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handlePrev} className="rounded-full border border-white/80 bg-white/90 p-2 shadow-sm"><ChevronLeft size={18} /></button>
                      <button type="button" onClick={handleNext} className="rounded-full border border-white/80 bg-white/90 p-2 shadow-sm"><ChevronRight size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {galleryImages.map((image, index) => (
                  <button key={`${image}-${index}`} type="button" onClick={() => setActiveIndex(index)} className={`overflow-hidden rounded-2xl border ${activeIndex === index ? 'border-sage ring-2 ring-sage/20' : 'border-slate-200'}`}>
                    <AsyncImage src={image} alt={`${propertyTitle} ${index + 1}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between border-t border-slate-200 p-4 sm:p-6 lg:border-l lg:border-t-0">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${propertyTypeLabel.toLowerCase().includes('agricultural') ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{propertyTypeLabel}</span>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${property.status === 'Sold' ? 'bg-amber-500/90 text-white' : 'bg-slate-800/90 text-white'}`}>{property.status || 'Available'}</span>
                </div>
                <h1 className="mt-5 text-2xl font-semibold text-ink sm:text-4xl">{propertyTitle}</h1>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-sage" />
                  <span>{propertyLocationLabel}</span>
                </div>
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Land price</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-semibold text-ink sm:text-3xl">{formatPrice(property.priceAmount || property.price)}</p>
                      <p className="mt-1 text-sm text-slate-600">{property.priceUnit || 'Price unit not provided'}</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">{property?.landArea || property?.area || 'Land area'}</div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Posted: {postedDate}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Verified: {property.verified ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6">
                {sellerCall ? (
                  <a href={sellerCall} className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-dark"><Phone size={16} /> Call Seller</a>
                ) : null}
                {sellerWhatsApp ? (
                  <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><ExternalLink size={16} /> WhatsApp</a>
                ) : null}
                {sellerMail ? (
                  <a href={sellerMail} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Download size={16} /> Email Seller</a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_360px]">
          <div className="space-y-8">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-2xl font-semibold text-ink">Quick Overview</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {overviewItems.map((item) => (
                  <div key={item.label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                    <p className={`mt-2 text-sm font-semibold ${item.available ? 'text-ink' : 'text-slate-500'}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-2xl font-semibold text-ink">Property Features</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {featureItems.map((feature) => (
                  <div key={feature.label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{feature.label}</p>
                    <p className={`mt-2 text-sm font-semibold ${feature.available ? 'text-ink' : 'text-slate-500'}`}>{feature.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-2xl font-semibold text-ink">Property Location</h2>
              {property?.mapUrl || property?.googleMaps || property?.mapLink ? (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">District</p>
                      <p className="mt-1 font-semibold text-ink">{property.district || property.location || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Taluka</p>
                      <p className="mt-1 font-semibold text-ink">{property.subDistrict || property.taluka || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Village</p>
                      <p className="mt-1 font-semibold text-ink">{property.village || 'Not provided'}</p>
                    </div>
                  </div>
                  <a href={property.mapUrl || property.googleMaps || property.mapLink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15">
                    <ExternalLink size={16} /> Open in Google Maps
                  </a>
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Location not available.</div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-2xl font-semibold text-ink">Property Documents</h2>
              <div className="mt-5 space-y-3">
                {documentItems.length ? documentItems.map((document, index) => {
                  const isImage = document.type?.startsWith('image') || /\.(png|jpg|jpeg|webp)$/i.test(document.name || '');
                  return (
                    <div key={`${document.name}-${index}`} className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {isImage ? <Maximize2 size={18} className="text-sage" /> : <FileText size={18} className="text-sage" />}
                        <div>
                          <p className="font-semibold text-ink">{document.name || '7/12 Document'}</p>
                          <p className="text-sm text-slate-500">7/12 Document</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isImage && document.url ? <a href={document.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">View</a> : null}
                        {document.url ? (
                  <a href={document.url} download={document.name || '712-document'} className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white">
                    Download
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">Not uploaded</span>
                )}
                      </div>
                    </div>
                  );
                }) : <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No 7/12 document uploaded.</div>}
              </div>
            </div>
          </div>

          <aside className="self-start lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Seller Information</p>
              <div className="mt-4 rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sage text-xl font-semibold text-white">{sellerName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'S'}</div>
                  <div>
                    <p className="text-lg font-semibold text-ink">{sellerName}</p>
                    <p className="mt-1 text-sm text-slate-600">{property?.district || property?.location || 'Land seller'}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">District</p>
                    <p className="mt-1 font-semibold text-ink">{property?.district || property?.location || 'Not provided'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Taluka</p>
                    <p className="mt-1 font-semibold text-ink">{property?.subDistrict || property?.taluka || 'Not provided'}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mobile</p>
                  <p className="mt-1 font-semibold text-ink">{sellerPhone || 'Not provided'}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {sellerCall ? <a href={sellerCall} className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white">Call Seller</a> : null}
                {sellerWhatsApp ? <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">WhatsApp</a> : null}
                {sellerMail ? <a href={sellerMail} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Email Seller</a> : null}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <SectionHeading eyebrow="More land options" title="Similar Agricultural & Non-Agricultural Lands" />
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {similarProperties.length ? similarProperties.map((item) => <PropertyCard key={item.id} property={item} onContact={setContactModal} />) : <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No similar land listings available right now.</div>}
          </div>
        </section>
      </main>

      {sellerCall || sellerWhatsApp || sellerMail ? (
        <div className="fixed inset-x-0 bottom-0 z-60 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
            {sellerCall ? (
              <a href={sellerCall} className="flex-1 min-w-[140px] rounded-full bg-sage px-4 py-3 text-center text-sm font-semibold text-white">Call</a>
            ) : null}
            {sellerWhatsApp ? (
              <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="flex-1 min-w-[140px] rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">WhatsApp</a>
            ) : null}
            {sellerMail ? (
              <a href={sellerMail} className="flex-1 min-w-[140px] rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">Email</a>
            ) : null}
          </div>
        </div>
      ) : null}

      {sellerCall || sellerWhatsApp || sellerMail ? <div className="h-[calc(5.25rem+env(safe-area-inset-bottom))] lg:hidden" /> : null}

      {zoomOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-6" onClick={() => setZoomOpen(false)}>
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setZoomOpen(false)} className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-2 shadow-sm">
              <X size={18} />
            </button>
            <div className="overflow-hidden rounded-[24px] bg-white">
              <AsyncImage src={galleryImages[activeIndex] || galleryImages[0]} alt={propertyTitle} className="h-[70vh] w-full object-contain" />
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button type="button" onClick={handlePrev} className="rounded-full bg-white/90 p-2 shadow-sm"><ChevronLeft size={18} /></button>
              <button type="button" onClick={handleNext} className="rounded-full bg-white/90 p-2 shadow-sm"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      ) : null}

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title="Contact Seller" />
    </div>
  );
}

export default PropertyDetailsPage;
