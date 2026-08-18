import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Heart, MapPin, Maximize2, Share2, ShieldCheck, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { readStorage, onListingsChanged, STORAGE_KEYS, addRecentlyViewed, isPropertySaved, toggleSavedProperty } from '../utils/storage';
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

const formatPriceWithUnit = (value, unit, t, isGujarati) => {
  const priceText = formatPrice(value, t, isGujarati);
  const unitText = translatePriceUnit(unit, isGujarati);
  if (!unit || String(unit).trim() === '') return priceText;
  if (priceText === (isGujarati ? 'કિંમત માટે સંપર્ક કરો' : 'Price on request')) return priceText;
  return `${priceText} ${isGujarati ? 'પ્રતિ' : 'per'} ${unitText}`;
};

const getPropertyMapEmbedUrl = (property) => {
  if (!property) return '';
  // Prefer explicit coordinates when available
  const lat = property?.latitude || property?.lat;
  const lng = property?.longitude || property?.lng || property?.lon;
  if (lat && lng) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=15&output=embed`;
  }
  // Fall back to existing map link if it's an embeddable Google Maps URL
  const mapLink = property?.mapUrl || property?.googleMaps || property?.mapLink || '';
  if (mapLink && mapLink.includes('output=embed')) return mapLink;
  if (mapLink && mapLink.includes('google.com/maps')) {
    return mapLink.includes('output=embed') ? mapLink : `${mapLink}${mapLink.includes('?') ? '&' : '?'}output=embed`;
  }
  // Safely build a location query from available location data
  const locationParts = [
    property?.village,
    property?.subDistrict || property?.taluka,
    property?.district || property?.location || property?.city,
    property?.state || 'Gujarat',
  ].filter(Boolean);
  if (locationParts.length) {
    return `https://www.google.com/maps?q=${encodeURIComponent(locationParts.join(', '))}&z=13&output=embed`;
  }
  return '';
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
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.info(t('propertyDetails.propertyLinkCopied'));
        return;
      }
    } catch (error) {
      // User cancelled/closed the native share dialog — silently ignore.
      if (error?.name === 'AbortError') {
        return;
      }
    }
    // Reaching here means:
    //  - navigator.share threw a genuine unexpected error, OR
    //  - navigator.clipboard threw a genuine unexpected error, OR
    //  - neither navigator.share nor navigator.clipboard is available.
    toast.error(t('propertyDetails.shareUnavailable'));
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
    addItem(t('common.price'), formatPriceWithUnit(property?.priceAmount || property?.price, property?.priceUnit, t, isGujarati));
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
      <div className="border border-slate-200 bg-white p-8 shadow-card dark:border-dark-border dark:bg-dark-card">
        <h1 className="text-3xl font-semibold text-ink dark:text-dark-text">{t('propertyDetails.notFound')}</h1>
        <p className="mt-3 text-muted dark:text-dark-muted">{t('propertyDetails.unavailable')}</p>
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

  const heroPriceText = formatPrice(property.priceAmount || property.price, t, isGujarati);
  const heroPriceIsRequest = heroPriceText === (isGujarati ? 'કિંમત માટે સંપર્ક કરો' : 'Price on request');
  const heroUnitText = translatePriceUnit(property.priceUnit, isGujarati);
  const heroAreaText = translateArea(property?.landArea || property?.area, isGujarati);

  return (
    <div className="-mx-4 -mt-8 bg-background pb-24 sm:-mx-6 lg:-mx-8 lg:bg-[#FFFEFE] dark:bg-dark-bg dark:lg:bg-dark-bg">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
        <button type="button" onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary dark:text-dark-muted">
          <ArrowLeft size={17} /> {t('propertyDetails.backToProperties')}
        </button>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-10 lg:px-12">
        {/* ===== HERO: IMAGE + GALLERY ===== */}
        <section className="-mx-4 sm:-mx-6 lg:mx-0 lg:overflow-hidden lg:rounded-[32px] lg:border lg:border-slate-200 lg:bg-white lg:shadow-card dark:lg:border-dark-border dark:lg:bg-dark-card">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <div className="p-0 sm:p-6">
              {/* Main gallery image */}
              <div className="relative overflow-hidden bg-slate-200 lg:rounded-b-[32px] dark:bg-dark-card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <AsyncImage src={galleryImages[activeIndex] || galleryImages[0]} alt={propertyTitle} className="h-full w-full object-cover" onClick={() => setZoomOpen(true)} />

                  {/* Top overlay: badges + share/like */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-dark-card/95 dark:text-dark-text">
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
                      <button type="button" aria-label={t('propertyDetails.shareProperty')} onClick={handleShare} className="rounded-full bg-white/95 p-3 text-ink shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:text-dark-text dark:hover:bg-dark-card">
                        <Share2 size={17} />
                      </button>
                      <button type="button" aria-label={t('propertyDetails.saveProperty')} onClick={() => { const next = toggleSavedProperty(property); setIsSaved(next.some((item) => String(item.id) === String(property.id))); }} className={`rounded-full bg-white/95 p-3 shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:hover:bg-dark-card ${isSaved ? 'text-rose-600' : 'text-ink dark:text-dark-text'}`}>
                        <Heart size={17} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom overlay: counter + nav */}
                  <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-4 sm:px-6">
                    <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">{activeIndex + 1}/{galleryImages.length}</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handlePrev} className="rounded-full border border-white/80 bg-white/90 p-2 shadow-sm dark:border-dark-border dark:bg-dark-card/90"><ChevronLeft size={18} /></button>
                      <button type="button" onClick={handleNext} className="rounded-full border border-white/80 bg-white/90 p-2 shadow-sm dark:border-dark-border dark:bg-dark-card/90"><ChevronRight size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnail gallery */}
              <div className="mt-3 grid grid-cols-4 gap-2 px-4 sm:grid-cols-6 sm:px-6 lg:mt-4 lg:px-0">
                {galleryImages.map((image, index) => (
                  <button key={`${image}-${index}`} type="button" onClick={() => setActiveIndex(index)} className={`overflow-hidden rounded-xl border lg:rounded-2xl dark:border-dark-border ${activeIndex === index ? 'border-sage ring-2 ring-sage/20' : 'border-slate-200'}`}>
                    <AsyncImage src={image} alt={`${propertyTitle} ${index + 1}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>

              {/* ===== MOBILE: PROPERTY SUMMARY + PRICE CARD ===== */}
              <div className="lg:hidden">
                {/* Property summary */}
                <div className="px-4 pb-2 pt-6 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sage/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sage dark:bg-sage/20 dark:text-emerald-400">
                      {translatePropertyType(propertyTypeLabel, t, isGujarati)}
                    </span>
                    {property?.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <ShieldCheck size={12} /> {t('propertyDetails.verifiedListing')}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {translateStatus(property.status, isGujarati)}
                    </span>
                  </div>
                  <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-ink dark:text-dark-text">{propertyTitle}</h1>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-dark-muted">
                    <MapPin size={15} className="shrink-0 text-sage dark:text-emerald-400" />
                    <span>{propertyLocationLabel}</span>
                  </div>
                </div>

                {/* Price card */}
                <div className="px-4 pt-5 sm:px-6">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card dark:border-dark-border dark:bg-dark-card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-dark-muted">{t('propertyDetails.landPrice')}</p>
                        <p className="mt-1.5 text-3xl font-bold tracking-tight text-ink dark:text-dark-text">{heroPriceText}</p>
                        {!heroPriceIsRequest && (property.priceUnit || property?.landArea || property?.area) ? (
                          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-dark-muted">
                            {property.priceUnit ? `${isGujarati ? 'પ્રતિ' : 'per'} ${heroUnitText}` : ''}
                            {property.priceUnit && (property?.landArea || property?.area) ? ' · ' : ''}
                            {property?.landArea || property?.area ? heroAreaText : ''}
                          </p>
                        ) : null}
                      </div>
                      <img src={logo} alt="Broker Streets" className="h-8 w-auto object-contain opacity-80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== LOCATION + MAP ===== */}
              <div className="mt-6 px-4 sm:px-6 lg:mt-4 lg:px-0">
                <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm dark:lg:border-dark-border dark:lg:bg-dark-card">
                  <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-3 lg:border-b lg:border-slate-100 lg:px-4 lg:py-3 dark:lg:border-dark-border">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-sage dark:text-emerald-400" />
                      <h3 className="text-sm font-semibold text-ink dark:text-dark-text">{t('propertyDetails.propertyLocation')}</h3>
                    </div>
                    {property?.mapUrl || property?.googleMaps || property?.mapLink ? (
                      <a href={property.mapUrl || property.googleMaps || property.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-emerald-400 dark:hover:bg-dark-bg">
                        <ExternalLink size={13} /> {t('propertyDetails.openInGoogleMaps')}
                      </a>
                    ) : null}
                  </div>
                  <div className="lg:hidden">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-sage dark:text-emerald-400" />
                      <h3 className="text-[15px] font-semibold text-ink dark:text-dark-text">{t('propertyDetails.propertyLocation')}</h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-dark-muted">{propertyLocationLabel}</p>
                    {property?.mapUrl || property?.googleMaps || property?.mapLink ? (
                      <a href={property.mapUrl || property.googleMaps || property.mapLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary dark:text-emerald-400">
                        {t('propertyDetails.openInGoogleMaps')} <ArrowRight size={14} />
                      </a>
                    ) : null}
                  </div>
                  <div className="relative mt-3 w-full overflow-hidden rounded-2xl lg:mt-0 lg:rounded-none dark:border dark:border-dark-border">
                    <iframe
                      title={`${propertyTitle} location map`}
                      src={getPropertyMapEmbedUrl(property)}
                      className="h-64 w-full border-0 sm:h-80"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== DESKTOP: RIGHT COLUMN ===== */}
            <div className="hidden flex-col justify-between lg:flex lg:border-l lg:p-6 dark:lg:border-dark-border">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1.5 lg:text-xs ${propertyTypeLabel.toLowerCase().includes('agricultural') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'}`}>
                    {translatePropertyType(propertyTypeLabel, t, isGujarati)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1.5 lg:text-xs ${property.status === 'Sold' ? 'bg-amber-500/90 text-white' : 'bg-slate-800/90 text-white dark:bg-slate-700'}`}>
                    {translateStatus(property.status, isGujarati)}
                  </span>
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-4xl lg:mt-5 dark:text-dark-text">{propertyTitle}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 lg:mt-4 dark:text-dark-muted">
                  <MapPin size={16} className="text-sage dark:text-emerald-400" />
                  <span>{propertyLocationLabel}</span>
                </div>
                <div className="mt-5 lg:mt-5 lg:rounded-[24px] lg:border lg:border-slate-200 lg:bg-slate-50 lg:p-4 dark:lg:border-dark-border dark:lg:bg-dark-bg">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-dark-muted">{t('propertyDetails.landPrice')}</p>
                  <div className="mt-1.5 flex items-end justify-between gap-3 lg:mt-2">
                    <p className="text-3xl font-semibold tracking-tight text-ink sm:text-3xl dark:text-dark-text">{formatPriceWithUnit(property.priceAmount || property.price, property.priceUnit, t, isGujarati)}</p>
                    <span className="text-sm font-semibold text-slate-600 lg:rounded-full lg:bg-white lg:px-3 lg:py-2 lg:text-slate-700 lg:shadow-sm dark:text-dark-muted dark:lg:bg-dark-card dark:lg:text-dark-text">
                      {translateArea(property?.landArea || property?.area, isGujarati)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 lg:mt-5 lg:gap-2 dark:text-dark-muted">
                  <span className="lg:rounded-full lg:border lg:border-slate-200 lg:bg-white lg:px-3 lg:py-2 dark:lg:border-dark-border dark:lg:bg-dark-card">
                    {t('propertyDetails.posted')}: {postedDate === 'Recently Listed' || postedDate === 'recently listed' ? t('propertyDetails.recentlyListed') : postedDate}
                  </span>
                  <span className="text-slate-300 lg:hidden dark:text-dark-border">•</span>
                  <span className="lg:rounded-full lg:border lg:border-slate-200 lg:bg-white lg:px-3 lg:py-2 dark:lg:border-dark-border dark:lg:bg-dark-card">
                    {t('propertyDetails.verified')}: {property.verified ? t('propertyDetails.yes') : t('propertyDetails.no')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== DETAILS + SELLER ===== */}
        <section className="grid gap-10 lg:grid-cols-[1.05fr_360px] lg:gap-8">
          <div className="space-y-10 lg:space-y-8">
            {/* Property Details */}
            <section className="lg:rounded-[28px] lg:border lg:border-slate-200 lg:bg-white lg:p-6 lg:shadow-card dark:lg:border-dark-border dark:lg:bg-dark-card">
              <h2 className="text-[22px] font-semibold tracking-tight text-ink lg:hidden dark:text-dark-text">{t('common.propertyDetails')}</h2>
              <h2 className="hidden text-2xl font-semibold text-ink lg:block dark:text-dark-text">{t('propertyDetails.quickOverview')}</h2>
              <div className="mt-3 border-t border-slate-200/60 pt-1 lg:mt-5 lg:border-t-0 lg:pt-0 dark:border-dark-border">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-2 lg:gap-3">
                  {overviewItems.map((item) => (
                    <div key={item.label} className="lg:rounded-[20px] lg:border lg:border-slate-200 lg:bg-slate-50 lg:p-4 dark:lg:border-dark-border dark:lg:bg-dark-bg">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-dark-muted">{item.label}</p>
                      <p className="mt-1 text-[15px] font-semibold text-ink lg:mt-2 lg:text-sm dark:text-dark-text">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Property Features - Desktop only */}
            <section className="hidden lg:rounded-[28px] lg:border lg:border-slate-200 lg:bg-white lg:p-6 lg:shadow-card lg:block dark:lg:border-dark-border dark:lg:bg-dark-card">
              <h2 className="text-2xl font-semibold text-ink dark:text-dark-text">{t('propertyDetails.propertyFeatures')}</h2>
              <div className="mt-5 border-t-0 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {featureItems.filter((item) => item.available).map((item) => (
                    <div key={item.label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-dark-muted">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-ink dark:text-dark-text">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Property Documents */}
            <section className="lg:rounded-[28px] lg:border lg:border-slate-200 lg:bg-white lg:p-6 lg:shadow-card dark:lg:border-dark-border dark:lg:bg-dark-card">
              <h2 className="text-[22px] font-semibold tracking-tight text-ink lg:text-2xl dark:text-dark-text">{t('propertyDetails.propertyDocuments')}</h2>
              <div className="mt-4 lg:mt-5">
                {documentItems.length ? (
                  <div className="divide-y divide-slate-200/70 lg:divide-y-0 lg:space-y-3 dark:divide-dark-border">
                    {documentItems.map((document, index) => {
                      const isImage = document.type?.startsWith('image') || /\.(png|jpg|jpeg|webp)$/i.test(document.rawName || '');
                      return (
                        <div key={`${document.rawName}-${index}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between lg:rounded-[20px] lg:border lg:border-slate-200 lg:bg-slate-50 lg:p-4 lg:py-4 lg:first:pt-4 lg:last:pb-4 dark:lg:border-dark-border dark:lg:bg-dark-bg">
                          <div className="flex min-w-0 items-center gap-2.5">
                            {isImage ? <Maximize2 size={16} className="shrink-0 text-sage dark:text-emerald-400" /> : <FileText size={16} className="shrink-0 text-sage dark:text-emerald-400" />}
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-semibold text-ink dark:text-dark-text">{translateDocumentName(document.displayName, isGujarati)}</p>
                              <p className="text-xs text-slate-500 dark:text-dark-muted">{isGujarati ? '૭/૧૨ દસ્તાવેજ' : '7/12 Document'}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {isImage && document.url ? (
                              <a href={document.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary dark:text-emerald-400 lg:rounded-full lg:border lg:border-slate-200 lg:bg-white lg:px-4 lg:py-2 lg:text-slate-700 dark:lg:border-dark-border dark:lg:bg-dark-card dark:lg:text-dark-text">
                                {t('propertyDetails.view')}
                              </a>
                            ) : null}
                            {document.url ? (
                              <a href={document.url} download={document.rawName || '712-document'} className="text-sm font-semibold text-sage dark:text-emerald-400 lg:rounded-full lg:bg-sage lg:px-4 lg:py-2 lg:text-white dark:lg:bg-sage dark:lg:text-white">
                                {t('propertyDetails.downloadDocument')}
                              </a>
                            ) : (
                              <span className="text-sm text-slate-500 dark:text-dark-muted">{t('propertyDetails.notUploaded')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 dark:text-dark-muted lg:rounded-[20px] lg:border lg:border-dashed lg:border-slate-200 lg:bg-slate-50 lg:p-6 dark:lg:border-dark-border dark:lg:bg-dark-bg">{t('propertyDetails.noDocumentUploaded')}</div>
                )}
              </div>
            </section>
          </div>

          {/* ===== SELLER INFORMATION ===== */}
          <aside className="self-start lg:sticky lg:top-24">
            <div className="lg:rounded-[28px] lg:border lg:border-slate-200 lg:bg-white lg:p-6 lg:shadow-card dark:lg:border-dark-border dark:lg:bg-dark-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 lg:text-sm dark:text-dark-muted">{t('propertyDetails.sellerInformation')}</p>
              <div className="mt-4 flex items-center gap-3 lg:mt-4 lg:gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage text-lg font-semibold text-white lg:h-16 lg:w-16 lg:rounded-3xl lg:text-xl">
                  {sellerName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'S'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-ink dark:text-dark-text">{sellerName}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-dark-muted">{translateLocation(property?.district || property?.location, t, isGujarati)}</p>
                </div>
              </div>
              <div className="my-4 h-px bg-slate-200/70 lg:hidden dark:bg-dark-border" />
              <div className="grid grid-cols-2 gap-4 lg:mt-4 lg:grid-cols-2 lg:gap-3">
                <div className="lg:rounded-2xl lg:bg-white lg:p-3 lg:shadow-sm dark:lg:bg-dark-bg">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-dark-muted">{t('propertyDetails.sellerDistrict')}</p>
                  <p className="mt-1 text-[15px] font-semibold text-ink dark:text-dark-text">{translateLocation(property?.district || property?.location, t, isGujarati)}</p>
                </div>
                <div className="lg:rounded-2xl lg:bg-white lg:p-3 lg:shadow-sm dark:lg:bg-dark-bg">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-dark-muted">{t('propertyDetails.sellerTaluka')}</p>
                  <p className="mt-1 text-[15px] font-semibold text-ink dark:text-dark-text">{translateLocation(property?.subDistrict || property?.taluka, t, isGujarati)}</p>
                </div>
              </div>
              <div className="mt-4 lg:mt-4 lg:rounded-2xl lg:bg-white lg:p-4 lg:shadow-sm dark:lg:bg-dark-bg">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-dark-muted">{t('propertyDetails.sellerMobile')}</p>
                <p className="mt-1 text-[15px] font-semibold text-ink dark:text-dark-text">{sellerPhone || translateLocation('', t, isGujarati)}</p>
              </div>
              <div className="mt-5 lg:mt-5">
                {sellerCall ? <a href={sellerCall} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white lg:py-3">{t('propertyDetails.callSeller')}</a> : null}
                <div className="mt-3 flex items-center justify-center gap-3 lg:mt-3 lg:grid lg:grid-cols-1 lg:gap-3">
                  {sellerWhatsApp ? <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-dark-text lg:w-full lg:justify-center lg:rounded-full lg:border lg:border-slate-200 lg:bg-white lg:px-5 lg:py-3 dark:lg:border-dark-border dark:lg:bg-dark-card">{t('common.whatsapp')}</a> : null}
                  {sellerWhatsApp && sellerMail ? <span className="text-slate-300 lg:hidden dark:text-dark-border">·</span> : null}
                  {sellerMail ? <a href={sellerMail} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-dark-text lg:w-full lg:justify-center lg:rounded-full lg:border lg:border-slate-200 lg:bg-white lg:px-5 lg:py-3 dark:lg:border-dark-border dark:lg:bg-dark-card">{t('propertyDetails.emailSeller')}</a> : null}
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* ===== RELATED PROPERTIES ===== */}
        <section className="lg:rounded-[28px] lg:border lg:border-slate-200 lg:bg-white lg:p-6 lg:shadow-card dark:lg:border-dark-border dark:lg:bg-dark-card">
          <SectionHeading eyebrow={t('propertyDetails.recentlyListed')} title={similarProperties.length ? (isGujarati ? 'સંબંધિત પ્રોપર્ટીઓ' : 'Related Properties') : t('propertyDetails.noSimilarListings')} />
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:mt-6 lg:gap-5 xl:grid-cols-4">
            {similarProperties.length ? similarProperties.map((item) => <PropertyCard key={item.id} property={item} onContact={setContactModal} />) : <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">{t('propertyDetails.noSimilarListings')}</div>}
          </div>
        </section>
      </main>

      {zoomOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-6" onClick={() => setZoomOpen(false)}>
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setZoomOpen(false)} className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-2 shadow-sm">
              <X size={18} />
            </button>
            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-dark-card">
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