import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Heart, MapPin, Maximize2, Phone, Share2, ShieldCheck, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { readStorage, onListingsChanged, STORAGE_KEYS, addRecentlyViewed, isPropertySaved } from '../utils/storage';
import { sampleProperties } from '../utils/data';
import { getSubmissionDestination } from '../utils/formNavigation';
import PropertyCard from '../components/PropertyCard';
import AsyncImage from '../components/AsyncImage';
import ContactModal from '../components/ContactModal';
import SectionHeading from '../components/SectionHeading';
import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/images/logo.png';

const formatPrice = (value, t, isGujarati) => {
  if (typeof value === 'number') return `₹${value.toLocaleString('en-IN')}`;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'not provided' || trimmed.toLowerCase() === 'price on request') {
      return isGujarati ? 'કિંમત માટે સંપર્ક કરો' : 'Price on request';
    }
    return trimmed.startsWith('₹') ? trimmed : trimmed;
  }
  return isGujarati ? 'કિંમત માટે સંપર્ક કરો' : 'Price on request';
};

const translateLocation = (val, t, isGujarati) => {
  if (!val && val !== 0) return isGujarati ? 'આપેલ નથી' : 'Not provided';
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'not provided' || str.toLowerCase() === 'location pending') {
    return isGujarati ? 'આપેલ નથી' : 'Not provided';
  }
  const translated = t(str);
  return translated || str;
};

const translatePropertyType = (typeStr, t, isGujarati) => {
  if (!typeStr) return isGujarati ? 'જમીન' : 'Land';
  const str = String(typeStr).trim();
  if (str === 'Agricultural Land') return isGujarati ? 'ખેતીની જમીન' : 'Agricultural Land';
  if (str === 'Non-Agricultural Land') return isGujarati ? 'બિનખેતી જમીન' : 'Non-Agricultural Land';
  if (str === 'Residential') return isGujarati ? 'રહેણાંક' : 'Residential';
  if (str === 'Commercial') return isGujarati ? 'વ્યાવસાયિક' : 'Commercial';
  if (str === 'Villa') return isGujarati ? 'વિલા' : 'Villa';
  if (str === 'Apartment') return isGujarati ? 'એપાર્ટમેન્ટ' : 'Apartment';
  if (str === 'House') return isGujarati ? 'મકાન' : 'House';
  if (str === 'Plot') return isGujarati ? 'પ્લોટ' : 'Plot';
  if (str === 'Farm House') return isGujarati ? 'ફાર્મ હાઉસ' : 'Farm House';
  if (str === 'Office') return isGujarati ? 'ઓફિસ' : 'Office';
  if (str === 'Industrial') return isGujarati ? 'ઔદ્યોગિક' : 'Industrial';
  const lookedUp = t(str);
  if (lookedUp && lookedUp !== str) return lookedUp;
  return str;
};

const translateStatus = (statusStr, isGujarati) => {
  if (!statusStr) return isGujarati ? 'ઉપલબ્ધ' : 'Available';
  const str = String(statusStr).trim();
  if (str === 'Sold' || str.toLowerCase() === 'sold') return isGujarati ? 'વેચાયેલ' : 'Sold';
  if (str === 'Pending' || str.toLowerCase() === 'pending') return isGujarati ? 'બાકી' : 'Pending';
  if (str === 'Available' || str.toLowerCase() === 'available') return isGujarati ? 'ઉપલબ્ધ' : 'Available';
  return str;
};

const translatePriceUnit = (unitStr, isGujarati) => {
  if (!unitStr || String(unitStr).trim() === '') {
    return isGujarati ? 'કિંમત એકમ ઉપલબ્ધ નથી' : 'Price unit not available';
  }
  const str = String(unitStr).trim();
  if (isGujarati) {
    if (/sq\.?yard\s*\(var\)/i.test(str) || /sq\.?yard/i.test(str) || /var/i.test(str)) return 'ચોરસ વાર';
    if (/sq\.?ft/i.test(str) || /sqft/i.test(str)) return 'ચોરસ ફૂટ';
    if (/acre/i.test(str)) return 'એકર';
    if (/vigha/i.test(str) || /bigha/i.test(str)) return 'વીઘા';
    if (/total/i.test(str)) return 'કુલ કિંમત';
  }
  return str;
};

const translateArea = (areaStr, isGujarati) => {
  if (!areaStr || String(areaStr).trim() === '' || String(areaStr).toLowerCase() === 'area not specified') {
    return isGujarati ? 'વિસ્તાર ઉપલબ્ધ નથી' : 'Area not specified';
  }
  const str = String(areaStr).trim();
  if (!isGujarati) return str;

  let translated = str
    .replace(/Sq\.Yard\s*\(Var\)/gi, 'ચોરસ વાર')
    .replace(/sq\.yard\s*\(var\)/gi, 'ચોરસ વાર')
    .replace(/sq\.?yard/gi, 'ચોરસ વાર')
    .replace(/sq\s*yd/gi, 'ચોરસ વાર')
    .replace(/Sq\.Ft/gi, 'ચોરસ ફૂટ')
    .replace(/sq\.?ft/gi, 'ચોરસ ફૂટ')
    .replace(/sqft/gi, 'ચોરસ ફૂટ')
    .replace(/Acres?/gi, 'એકર')
    .replace(/acre/gi, 'એકર')
    .replace(/Vigha/gi, 'વીઘા')
    .replace(/vigha/gi, 'વીઘા')
    .replace(/Bigha/gi, 'વીઘા')
    .replace(/bigha/gi, 'વીઘા')
    .replace(/Hectares?/gi, 'હેક્ટર');

  return translated;
};

const translateValueOrFallback = (val, t, isGujarati) => {
  if (val === true) return isGujarati ? 'હા' : 'Yes';
  if (val === false) return isGujarati ? 'ના' : 'No';
  if (val === undefined || val === null) return isGujarati ? 'આપેલ નથી' : 'Not provided';
  const str = String(val).trim();
  if (!str) return isGujarati ? 'આપેલ નથી' : 'Not provided';

  const lower = str.toLowerCase();
  if (lower === 'yes') return isGujarati ? 'હા' : 'Yes';
  if (lower === 'no') return isGujarati ? 'ના' : 'No';
  if (lower === 'available') return isGujarati ? 'ઉપલબ્ધ' : 'Available';
  if (lower === 'sold') return isGujarati ? 'વેચાયેલ' : 'Sold';
  if (lower === 'pending') return isGujarati ? 'બાકી' : 'Pending';
  if (lower === 'not provided') return isGujarati ? 'આપેલ નથી' : 'Not provided';
  if (lower === 'not available') return isGujarati ? 'ઉપલબ્ધ નથી' : 'Not available';
  if (lower === 'area not specified') return isGujarati ? 'વિસ્તાર ઉપલબ્ધ નથી' : 'Area not specified';
  if (lower === 'price on request') return isGujarati ? 'કિંમત માટે સંપર્ક કરો' : 'Price on request';
  if (lower === 'unknown' || lower === 'n/a') return isGujarati ? 'આપેલ નથી' : 'Not provided';

  if (lower === 'road access' || lower === 'tar road' || lower === 'paved') return isGujarati ? 'પાકો રસ્તો' : str;
  if (lower === 'highway touch') return isGujarati ? 'હાઇવે ટચ' : str;
  if (lower === 'north') return isGujarati ? 'ઉત્તર' : 'North';
  if (lower === 'south') return isGujarati ? 'દક્ષિણ' : 'South';
  if (lower === 'east') return isGujarati ? 'પૂર્વ' : 'East';
  if (lower === 'west') return isGujarati ? 'પશ્ચિમ' : 'West';
  if (lower === 'north-east' || lower === 'northeast') return isGujarati ? 'ઉત્તર-પૂર્વ' : str;
  if (lower === 'north-west' || lower === 'northwest') return isGujarati ? 'ઉત્તર-પશ્ચિમ' : str;
  if (lower === 'south-east' || lower === 'southeast') return isGujarati ? 'દક્ષિણ-પૂર્વ' : str;
  if (lower === 'south-west' || lower === 'southwest') return isGujarati ? 'દક્ષિણ-પશ્ચિમ' : str;
  if (lower === 'black soil') return isGujarati ? 'કાળી માટી' : str;
  if (lower === 'red soil') return isGujarati ? 'લાલ માટી' : str;
  if (lower === 'alluvial soil') return isGujarati ? 'કાંપની માટી' : str;
  if (lower === 'freehold') return isGujarati ? 'ફ્રીહોલ્ડ' : str;
  if (lower === 'leasehold') return isGujarati ? 'લીઝહોલ્ડ' : str;
  if (lower === 'single owner') return isGujarati ? 'એકલ માલિક' : str;

  const locOrDict = t(str);
  if (locOrDict && locOrDict !== str) return locOrDict;

  return str;
};

const translateDocumentName = (docName, isGujarati) => {
  if (!docName || docName === '7/12 Document' || docName.includes('7/12')) {
    return isGujarati ? '૭/૧૨ દસ્તાવેજ' : '7/12 Document';
  }
  return docName;
};

function PropertyDetailsPage() {
  const navigate = useNavigate();
  const { t, getPropertyDisplayTitle, isGujarati } = useLanguage();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [sourceProperties, setSourceProperties] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [contactModal, setContactModal] = useState(null);
  const [touchStart, setTouchStart] = useState(null);

  const resolvePropertySource = () => {
    const storedListings = readStorage(STORAGE_KEYS.listings, []);
    const lastProp = readStorage(STORAGE_KEYS.lastProperty, null);
    const savedProps = readStorage(STORAGE_KEYS.savedProperties, []);
    const recentProps = readStorage(STORAGE_KEYS.recentlyViewed, []);
    const allStored = [
      ...(Array.isArray(storedListings) ? storedListings : []),
      ...(lastProp ? [lastProp] : []),
      ...(Array.isArray(savedProps) ? savedProps : []),
      ...(Array.isArray(recentProps) ? recentProps : []),
      ...sampleProperties,
    ];

    const uniqueMap = new Map();
    allStored.forEach((item) => {
      if (item && item.id && !uniqueMap.has(String(item.id))) {
        uniqueMap.set(String(item.id), item);
      }
    });

    return Array.from(uniqueMap.values());
  };

  const loadProperty = () => {
    if (!id) return;
    const source = resolvePropertySource();
    const current = source.find((item) => String(item?.id) === String(id)) || sampleProperties.find((item) => String(item?.id) === String(id)) || null;
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
        await navigator.share({ title: property?.title || t('propertyDetails.propertyTitleFallback'), text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.info(t('propertyDetails.propertyLinkCopied'));
      }
    } catch (error) {
      toast.error(t('propertyDetails.shareUnavailable'));
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
          if (typeof item === 'string' && item && !item.toLowerCase().startsWith('blob:')) normalized.push(item);
        });
      }
    });

    if (!normalized.length && property?.image && !property.image.toLowerCase().startsWith('blob:')) normalized.push(property.image);
    if (!normalized.length) normalized.push(logo);
    return normalized.filter((item, index, array) => array.indexOf(item) === index);
  }, [property]);

  const overviewItems = useMemo(() => {
    const items = [];
    const addItem = (label, value) => {
      if (value === undefined || value === null || value === '') return;
      if (typeof value === 'string' && value.trim() === '') return;
      items.push({ label, value });
    };

    addItem(t('common.propertyType'), translatePropertyType(property?.type || property?.propertyType, t, isGujarati));
    addItem(t('common.area'), translateArea(property?.landArea || property?.area, isGujarati));
    addItem(t('common.price'), formatPrice(property?.priceAmount || property?.price, t, isGujarati));
    addItem(t('common.priceUnit'), translatePriceUnit(property?.priceUnit, isGujarati));
    addItem(t('common.district'), translateLocation(property?.district || property?.location, t, isGujarati));
    addItem(t('common.taluka'), translateLocation(property?.subDistrict || property?.taluka, t, isGujarati));
    addItem(t('common.village'), translateLocation(property?.village, t, isGujarati));
    addItem(t('common.state'), translateLocation(property?.state || t('propertyDetails.stateFallback'), t, isGujarati));

    return items;
  }, [property, t, isGujarati]);

  const featureItems = useMemo(() => {
    if (!property) return [];
    const featureMap = [
      { label: t('propertyDetails.roadAccess'), value: property?.roadAccess || property?.roadConnectivity || property?.roadAccessStatus },
      { label: t('propertyDetails.electricityConnection'), value: property?.electricity || property?.electricityConnection || property?.electricityAvailable },
      { label: t('propertyDetails.waterAvailability'), value: property?.waterAvailability || property?.waterSource || property?.water },
      { label: t('propertyDetails.borewell'), value: property?.borewell || property?.hasBorewell },
      { label: t('propertyDetails.irrigationFacility'), value: property?.irrigation || property?.irrigationFacility },
      { label: t('propertyDetails.boundaryWall'), value: property?.boundaryWall || property?.boundaryFence || property?.boundary },
      { label: t('propertyDetails.fencing'), value: property?.fencing || property?.hasFencing },
      { label: t('propertyDetails.cornerPlot'), value: property?.cornerPlot || property?.corner },
      { label: t('propertyDetails.facingDirection'), value: property?.facing || property?.direction },
      { label: t('propertyDetails.soilType'), value: property?.soilType },
      { label: t('propertyDetails.ownershipStatus'), value: property?.ownershipStatus || property?.ownership },
    ];

    return featureMap.map((item) => ({
      label: item.label,
      value: translateValueOrFallback(item.value, t, isGujarati),
      available: Boolean(item.value),
    }));
  }, [property, t, isGujarati]);

  const documentItems = useMemo(() => {
    const documents = [];
    const cleanUrl = (u) => (typeof u === 'string' && u.toLowerCase().startsWith('blob:') ? '#' : u || '');
    const pushDocument = (entry) => {
      if (!entry) return;
      if (Array.isArray(entry)) {
        entry.forEach(pushDocument);
        return;
      }
      if (typeof entry === 'string') {
        documents.push({
          rawName: entry,
          displayName: '7/12 Document',
          url: cleanUrl(entry),
          type: entry.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*'
        });
        return;
      }
      if (entry && typeof entry === 'object') {
        const docUrl = cleanUrl(entry.url || entry.href || entry.link || entry.fileUrl);
        documents.push({
          rawName: entry.name || '7/12 Document',
          displayName: entry.name || '7/12 Document',
          url: docUrl,
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
      const docUrl = cleanUrl(property.documentUrl || property.pdf || property.propertyDocument?.url);
      documents.push({
        rawName: '7/12 Document',
        displayName: '7/12 Document',
        url: docUrl,
        type: 'application/pdf'
      });
    }

    return documents.slice(0, 1);
  }, [property]);

  const similarProperties = useMemo(() => {
    const currentType = property?.type || property?.propertyType || '';
    const currentDistrict = property?.district || property?.location || '';
    const filtered = sourceProperties
      .filter((item) => String(item?.id) !== String(property?.id))
      .filter((item) => {
        const sameType = (item.type || item.propertyType || '').toLowerCase() === currentType.toLowerCase();
        const sameDistrict = (item.district || item.location || '').toLowerCase() === currentDistrict.toLowerCase();
        return sameType || sameDistrict;
      });

    const uniqueMap = new Map();
    filtered.forEach((item) => {
      if (item && item.id && !uniqueMap.has(String(item.id))) {
        uniqueMap.set(String(item.id), item);
      }
    });

    return Array.from(uniqueMap.values()).slice(0, 4);
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
    return (
      <div className="border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{t('propertyDetails.notFound')}</h1>
        <p className="mt-3 text-muted">{t('propertyDetails.unavailable')}</p>
        <button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">
          {t('propertyDetails.backToListings')}
        </button>
      </div>
    );
  }

  const propertyTitle = getPropertyDisplayTitle(property.title || property.name || t('propertyDetails.propertyTitleFallback'));
  const propertyTypeLabel = property.type || property.propertyType || t('propertyDetails.propertyTypeFallback');
  
  const locationParts = [
    property?.state || t('propertyDetails.stateFallback'),
    property?.district || property?.location || '',
    property?.subDistrict || property?.taluka || '',
    property?.village || '',
  ].filter(Boolean).map((part) => translateLocation(part, t, isGujarati));

  const propertyLocationLabel = locationParts.join(' • ');

  const postedDate = property.uploadedDate || property.submittedAt || property.createdAt || property.updatedAt || t('propertyDetails.recentlyListed');
  const sellerName = property.seller?.name || property.sellerName || property.owner || property.ownerName || t('propertyDetails.sellerNameFallback');
  const sellerPhone = property.seller?.phone || property.sellerPhone || property.ownerMobile || property.mobile || '';
  const sellerEmail = property.seller?.email || property.sellerEmail || property.ownerEmail || property.email || '';
  const sellerWhatsApp = sellerPhone ? `https://wa.me/91${String(sellerPhone).replace(/\D/g, '')}` : '';
  const sellerCall = sellerPhone ? `tel:${sellerPhone}` : '';
  const sellerMail = sellerEmail ? `mailto:${sellerEmail}` : '';

  return (
    <div className="-mx-4 -mt-8 bg-[#FFFEFE] pb-24 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
        <button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary">
          <ArrowLeft size={17} /> {t('propertyDetails.backToProperties')}
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
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
                        {translatePropertyType(propertyTypeLabel, t, isGujarati)}
                      </span>
                      {property?.verified ? (
                        <span className="rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                          <ShieldCheck size={13} className="mr-1 inline" />
                          {t('propertyDetails.verifiedListing')}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label={t('propertyDetails.shareProperty')} onClick={handleShare} className="rounded-full bg-white/95 p-3 text-ink shadow-sm transition hover:bg-white">
                        <Share2 size={17} />
                      </button>
                      <button type="button" aria-label={t('propertyDetails.saveProperty')} onClick={() => { const next = toggleSavedProperty(property); setIsSaved(next.some((item) => String(item.id) === String(property.id))); }} className="rounded-full bg-white/95 p-3 text-ink shadow-sm transition hover:bg-white">
                        {isSaved ? <Heart size={17} className="text-rose-600" /> : <Heart size={17} />}
                      </button>
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
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${propertyTypeLabel.toLowerCase().includes('agricultural') ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                    {translatePropertyType(propertyTypeLabel, t, isGujarati)}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${property.status === 'Sold' ? 'bg-amber-500/90 text-white' : 'bg-slate-800/90 text-white'}`}>
                    {translateStatus(property.status, isGujarati)}
                  </span>
                </div>
                <h1 className="mt-5 text-2xl font-semibold text-ink sm:text-4xl">{propertyTitle}</h1>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-sage" />
                  <span>{propertyLocationLabel}</span>
                </div>
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('propertyDetails.landPrice')}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-semibold text-ink sm:text-3xl">{formatPrice(property.priceAmount || property.price, t, isGujarati)}</p>
                      <p className="mt-1 text-sm text-slate-600">{translatePriceUnit(property.priceUnit, isGujarati)}</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      {translateArea(property?.landArea || property?.area, isGujarati)}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                    {t('propertyDetails.posted')}: {postedDate === 'Recently Listed' || postedDate === 'recently listed' ? t('propertyDetails.recentlyListed') : postedDate}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                    {t('propertyDetails.verified')}: {property.verified ? t('propertyDetails.yes') : t('propertyDetails.no')}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6">
                {sellerCall ? (
                  <a href={sellerCall} className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-dark">
                    <Phone size={16} /> {t('propertyDetails.callSeller')}
                  </a>
                ) : null}
                {sellerWhatsApp ? (
                  <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <ExternalLink size={16} /> {t('common.whatsapp')}
                  </a>
                ) : null}
                {sellerMail ? (
                  <a href={sellerMail} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Download size={16} /> {t('propertyDetails.emailSeller')}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_360px]">
          <div className="space-y-8">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-2xl font-semibold text-ink">{t('propertyDetails.quickOverview')}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {overviewItems.map((item) => (
                  <div key={item.label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-2xl font-semibold text-ink">{t('propertyDetails.propertyFeatures')}</h2>
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
              <h2 className="text-2xl font-semibold text-ink">{t('propertyDetails.propertyLocation')}</h2>
              {property?.mapUrl || property?.googleMaps || property?.mapLink ? (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('common.district')}</p>
                      <p className="mt-1 font-semibold text-ink">{translateLocation(property.district || property.location, t, isGujarati)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('common.taluka')}</p>
                      <p className="mt-1 font-semibold text-ink">{translateLocation(property.subDistrict || property.taluka, t, isGujarati)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('common.village')}</p>
                      <p className="mt-1 font-semibold text-ink">{translateLocation(property.village, t, isGujarati)}</p>
                    </div>
                  </div>
                  <a href={property.mapUrl || property.googleMaps || property.mapLink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15">
                    <ExternalLink size={16} /> {t('propertyDetails.openInGoogleMaps')}
                  </a>
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">{t('propertyDetails.locationNotAvailable')}</div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-2xl font-semibold text-ink">{t('propertyDetails.propertyDocuments')}</h2>
              <div className="mt-5 space-y-3">
                {documentItems.length ? documentItems.map((document, index) => {
                  const isImage = document.type?.startsWith('image') || /\.(png|jpg|jpeg|webp)$/i.test(document.rawName || '');
                  return (
                    <div key={`${document.rawName}-${index}`} className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {isImage ? <Maximize2 size={18} className="text-sage" /> : <FileText size={18} className="text-sage" />}
                        <div>
                          <p className="font-semibold text-ink">{translateDocumentName(document.displayName, isGujarati)}</p>
                          <p className="text-sm text-slate-500">{isGujarati ? '૭/૧૨ દસ્તાવેજ' : '7/12 Document'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isImage && document.url ? (
                          <a href={document.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                            {t('propertyDetails.view')}
                          </a>
                        ) : null}
                        {document.url ? (
                          <a href={document.url} download={document.rawName || '712-document'} className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white">
                            {t('propertyDetails.downloadDocument')}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-500">{t('propertyDetails.notUploaded')}</span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">{t('propertyDetails.noDocumentUploaded')}</div>
                )}
              </div>
            </div>
          </div>

          <aside className="self-start lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('propertyDetails.sellerInformation')}</p>
              <div className="mt-4 rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sage text-xl font-semibold text-white">
                    {sellerName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'S'}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-ink">{sellerName}</p>
                    <p className="mt-1 text-sm text-slate-600">{translateLocation(property?.district || property?.location, t, isGujarati)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('propertyDetails.sellerDistrict')}</p>
                    <p className="mt-1 font-semibold text-ink">{translateLocation(property?.district || property?.location, t, isGujarati)}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('propertyDetails.sellerTaluka')}</p>
                    <p className="mt-1 font-semibold text-ink">{translateLocation(property?.subDistrict || property?.taluka, t, isGujarati)}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('propertyDetails.sellerMobile')}</p>
                  <p className="mt-1 font-semibold text-ink">{sellerPhone || translateLocation('', t, isGujarati)}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {sellerCall ? <a href={sellerCall} className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white">{t('propertyDetails.callSeller')}</a> : null}
                {sellerWhatsApp ? <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">{t('common.whatsapp')}</a> : null}
                {sellerMail ? <a href={sellerMail} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">{t('propertyDetails.emailSeller')}</a> : null}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <SectionHeading eyebrow={t('propertyDetails.recentlyListed')} title={similarProperties.length ? (isGujarati ? 'સંબંધિત પ્રોપર્ટીઓ' : 'Related Properties') : t('propertyDetails.noSimilarListings')} />
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {similarProperties.length ? similarProperties.map((item) => <PropertyCard key={item.id} property={item} onContact={setContactModal} />) : <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">{t('propertyDetails.noSimilarListings')}</div>}
          </div>
        </section>
      </main>

      {sellerCall || sellerWhatsApp || sellerMail ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-2 sm:grid-cols-3">
            {sellerCall ? (
              <a href={sellerCall} className="min-h-[46px] rounded-full bg-sage px-4 py-3 text-center text-sm font-semibold text-white">{t('propertyDetails.callSeller')}</a>
            ) : null}
            {sellerWhatsApp ? (
              <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="min-h-[46px] rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">{t('common.whatsapp')}</a>
            ) : null}
            {sellerMail ? (
              <a href={sellerMail} className="min-h-[46px] rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">{t('propertyDetails.emailSeller')}</a>
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

      <ContactModal open={Boolean(contactModal)} onClose={() => setContactModal(null)} data={contactModal || {}} title={t('common.contactSeller')} />
    </div>
  );
}

export default PropertyDetailsPage;

