import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Heart, IndianRupee, MapPin, Share2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { readStorage, onListingsChanged, onSavedPropertiesChanged, STORAGE_KEYS, addRecentlyViewed, isPropertySaved, toggleSavedProperty } from '../utils/storage';
import { sampleProperties } from '../utils/data';
import { getSubmissionDestination } from '../utils/formNavigation';
import AsyncImage from '../components/AsyncImage';
import ContactModal from '../components/ContactModal';
import { useLanguage } from '../i18n/LanguageContext';
import { formatIndianPrice, standardizePriceUnit } from '../utils/format';
import logo from '../assets/images/logo.png';

const formatPrice = (value, t, isGujarati) => {
  if (typeof value === 'number') return formatIndianPrice(value);
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
  const stdUnit = standardizePriceUnit(str);
  if (isGujarati) {
    if (stdUnit === 'Sq.Yard' || /var/i.test(str)) return 'ચોરસ વાર';
    if (stdUnit === 'Sq.Ft') return 'ચોરસ ફૂટ';
    if (stdUnit === 'Acre') return 'એકર';
    if (stdUnit === 'Vigha') return 'વીઘા';
    if (stdUnit === 'Hectare') return 'હેક્ટર';
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

const getLandImage = (property) => {
  const title = String(property?.title || property?.name || '').toLowerCase();
  const type = String(property?.type || property?.propertyType || '').toLowerCase();
  if (title.includes('mango')) return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=85';
  if (title.includes('banana')) return 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=85';
  if (title.includes('sugarcane')) return 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85';
  if (title.includes('cotton')) return 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=85';
  if (title.includes('agricultural') || title.includes('farm') || type.includes('agricultural')) return 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85';
  if (type.includes('commercial')) return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85';
  if (type.includes('industrial')) return 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85';
  if (type.includes('residential') || title.includes('plot')) return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85';
  if (type.includes('investment') || title.includes('investment')) return 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85';
  return 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85';
};

function RelatedPropertyCard({ property }) {
  const { t, language, getPropertyDisplayTitle } = useLanguage();
  const [favorited, setFavorited] = useState(() => isPropertySaved(property?.id));

  useEffect(() => {
    setFavorited(isPropertySaved(property?.id));
    const cleanup = onSavedPropertiesChanged(() => setFavorited(isPropertySaved(property?.id)));
    return cleanup;
  }, [property?.id]);

  const cardImage = useMemo(() => {
    const candidates = [
      property?.image,
      property?.gallery?.[0],
      property?.images?.[0],
      property?.photos?.[0],
      property?.media?.[0],
    ];
    return candidates.find((item) => typeof item === 'string' && item.trim() && !item.trim().toLowerCase().startsWith('blob:')) || getLandImage(property);
  }, [property]);

  const locationLine = useMemo(() => {
    const parts = [property?.village, property?.subDistrict || property?.taluka, property?.district || property?.location || property?.city];
    return parts.filter(Boolean).map((part) => t(part)).join(' • ');
  }, [property, t]);

  const propertyTitle = getPropertyDisplayTitle(property?.title || property?.name || t('propertyDetails.propertyTitleFallback'));
  const rawStatus = property?.status || 'Available';
  const statusText = rawStatus === 'Sold' ? t('dropdown.sold') : rawStatus === 'Pending' ? t('dropdown.pending') : rawStatus === 'Unavailable' ? t('dropdown.unavailable') : t('dropdown.available');
  const typeText = translatePropertyType(property?.type || property?.propertyType, t, language === 'gu');

  const rawPrice = property?.priceAmount || property?.price;
  const displayPrice = !rawPrice || rawPrice === 'Price on request' ? t('common.notAvailable') : formatIndianPrice(rawPrice);
  const priceUnit = property?.priceUnit;
  const displayPriceUnit = priceUnit
    ? translatePriceUnit(priceUnit, language === 'gu')
    : '';
  const perWord = language === 'gu' ? 'પ્રતિ' : 'per';

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/property/${property.id}`;
    const shareText = `${propertyTitle} • ${displayPrice}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: propertyTitle, text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.info(t('propertyDetails.propertyLinkCopied'));
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      toast.error(t('propertyDetails.shareUnavailable'));
    }
  };

  const handleFavorite = () => {
    const next = toggleSavedProperty(property);
    setFavorited(next.some((p) => String(p.id) === String(property.id)));
  };

  return (
    <article className="flex w-[250px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(15,23,42,0.10)] lg:w-auto dark:border-dark-border dark:bg-dark-card">
      <Link to={`/property/${property.id}`} className="relative block overflow-hidden bg-slate-200 dark:bg-dark-bg">
        <div className="aspect-[16/10] w-full overflow-hidden">
          <AsyncImage src={cardImage} alt={propertyTitle} className="h-full w-full object-cover" />
        </div>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${rawStatus === 'Sold' ? 'bg-amber-500/90 text-white' : rawStatus === 'Unavailable' ? 'bg-slate-500/90 text-white' : 'bg-emerald-600/90 text-white'}`}>{statusText}</span>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <button type="button" aria-label={`Share ${propertyTitle}`} onClick={handleShare} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:text-dark-text dark:hover:bg-dark-card">
            <Share2 size={13} />
          </button>
          <button type="button" aria-label={`Save ${propertyTitle}`} onClick={handleFavorite} className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:hover:bg-dark-card ${favorited ? 'text-rose-600' : 'text-slate-700 dark:text-dark-text'}`}>
            <Heart size={13} fill={favorited ? 'currentColor' : 'none'} />
          </button>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sage dark:text-emerald-400">{typeText}</span>
        <h3 className="truncate text-sm font-semibold leading-snug text-ink dark:text-dark-text">{propertyTitle}</h3>
        <p className="truncate text-xs text-slate-500 dark:text-dark-muted">{locationLine || t('profile.locationPending')}</p>
        <div className="mt-auto pt-1">
          <p className="text-base font-bold leading-tight text-ink dark:text-dark-text">{displayPrice}</p>
          {displayPriceUnit ? (
            <p className="text-[11px] font-medium text-slate-500 dark:text-dark-muted">{perWord} {displayPriceUnit}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

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

  const availableFeatures = featureItems.filter((item) => item.available);
  const documentCountLabel = (count) => (isGujarati ? (count === 1 ? '૧ દસ્તાવેજ' : `${count} દસ્તાવેજો`) : count === 1 ? '1 document' : `${count} documents`);

  return (
    <div className="pb-2 lg:pb-6">
      <main className="mx-auto w-full max-w-[1200px] space-y-4 lg:space-y-8">
        {/* ===== BACK TO PROPERTIES ===== */}
        <button
          type="button"
          onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))}
          className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold text-muted transition hover:text-primary dark:text-dark-muted"
        >
          <ArrowLeft size={16} /> {t('propertyDetails.backToProperties')}
        </button>

        {/* ===== HERO — IMAGE (left) + SELLER INFORMATION (right), balanced heights ===== */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:rounded-[28px] dark:border-dark-border dark:bg-dark-card">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-stretch">
            {/* LEFT — PROPERTY IMAGE GALLERY */}
            <div className="overflow-hidden bg-white dark:bg-dark-card">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 lg:aspect-[4/3] dark:bg-dark-bg" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <AsyncImage src={galleryImages[activeIndex] || galleryImages[0]} alt={propertyTitle} className="h-full w-full object-cover" onClick={() => setZoomOpen(true)} />

                {/* Overlay: counter top-left, share + like top-right */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4">
                  {galleryImages.length > 1 ? (
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{activeIndex + 1}/{galleryImages.length}</span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label={t('propertyDetails.shareProperty')} onClick={handleShare} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:text-dark-text dark:hover:bg-dark-card">
                      <Share2 size={17} />
                    </button>
                    <button type="button" aria-label={t('propertyDetails.saveProperty')} onClick={() => { const next = toggleSavedProperty(property); setIsSaved(next.some((item) => String(item.id) === String(property.id))); }} className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:hover:bg-dark-card ${isSaved ? 'text-rose-600' : 'text-ink dark:text-dark-text'}`}>
                      <Heart size={17} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                {/* Overlay: prev / next vertically centered at edges (hidden when single image) */}
                {galleryImages.length > 1 ? (
                  <>
                    <button type="button" onClick={handlePrev} className="absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-ink shadow-sm transition hover:bg-white sm:left-4 dark:border-dark-border dark:bg-dark-card/90 dark:text-dark-text dark:hover:bg-dark-card">
                      <ChevronLeft size={18} />
                    </button>
                    <button type="button" onClick={handleNext} className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-ink shadow-sm transition hover:bg-white sm:right-4 dark:border-dark-border dark:bg-dark-card/90 dark:text-dark-text dark:hover:bg-dark-card">
                      <ChevronRight size={18} />
                    </button>
                  </>
                ) : null}
              </div>

              {/* Thumbnails — only when there is more than one image */}
              {galleryImages.length > 1 ? (
                <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6 sm:p-4">
                  {galleryImages.map((image, index) => (
                    <button key={`${image}-${index}`} type="button" onClick={() => setActiveIndex(index)} className={`overflow-hidden rounded-lg border dark:border-dark-border ${activeIndex === index ? 'border-sage ring-2 ring-sage/20' : 'border-slate-200'}`}>
                      <AsyncImage src={image} alt={`${propertyTitle} ${index + 1}`} className="h-14 w-full object-cover sm:h-16" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* RIGHT — SELLER INFORMATION (compact, content-driven, no empty space) */}
            <div className="flex flex-col p-4 sm:p-6 lg:border-l lg:border-slate-200 lg:p-6 xl:p-7 dark:lg:border-dark-border">
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-dark-border dark:bg-dark-card">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-sage dark:text-emerald-400">{t('propertyDetails.sellerInformation')}</h2>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage text-base font-semibold text-white sm:h-16 sm:w-16 sm:text-lg">
                    {sellerName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-ink dark:text-dark-text">{sellerName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-600 dark:text-dark-muted">
                      <MapPin size={14} className="shrink-0 text-sage dark:text-emerald-400" />
                      {translateLocation(property?.district || property?.location, t, isGujarati)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-slate-500 dark:text-dark-muted">
                      <span className="font-semibold text-slate-500 dark:text-dark-muted">{t('propertyDetails.sellerDistrict')}:</span>{' '}
                      {translateLocation(property?.district || property?.location, t, isGujarati)}{' '}
                      ·{' '}
                      <span className="font-semibold text-slate-500 dark:text-dark-muted">{t('propertyDetails.sellerTaluka')}:</span>{' '}
                      {translateLocation(property?.subDistrict || property?.taluka, t, isGujarati)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {sellerCall ? (
                    <a href={sellerCall} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage px-4 py-3 text-xs font-semibold text-white transition hover:bg-sage-dark sm:text-sm">
                      {t('propertyDetails.callSeller')}
                    </a>
                  ) : null}
                  {sellerWhatsApp ? (
                    <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-bg">
                      {t('common.whatsapp')}
                    </a>
                  ) : null}
                  {sellerMail ? (
                    <a href={sellerMail} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-bg">
                      {t('propertyDetails.emailSeller')}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PROPERTY TITLE + PRICE — full-width summary ===== */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:rounded-[28px] sm:p-6 dark:border-dark-border dark:bg-dark-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sage/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sage dark:bg-sage/20 dark:text-emerald-400">
                  {translatePropertyType(propertyTypeLabel, t, isGujarati)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  {translateStatus(property.status, isGujarati)}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl dark:text-dark-text">{propertyTitle}</h1>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 sm:text-[15px] dark:text-dark-muted">
                <MapPin size={16} className="shrink-0 text-sage dark:text-emerald-400" />
                <span>{propertyLocationLabel}</span>
              </div>
            </div>

            {/* Price — prominent, right-aligned on desktop; own card on mobile */}
            <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:w-[320px] lg:border-0 lg:bg-cream lg:px-5 lg:py-5 lg:ring-1 lg:ring-slate-200/70 dark:border-dark-border dark:bg-dark-card dark:lg:border-0 dark:lg:bg-dark-bg dark:lg:ring-dark-border">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sage dark:text-emerald-400">{t('propertyDetails.landPrice')}</p>
              <div className="mt-2 flex items-center gap-2">
                {!heroPriceIsRequest ? (
                  <IndianRupee size={28} strokeWidth={2.5} className="shrink-0 text-sage dark:text-emerald-400" />
                ) : null}
                <p className="text-3xl font-bold leading-none tracking-tight text-ink sm:text-4xl dark:text-dark-text">
                  {heroPriceIsRequest ? heroPriceText : heroPriceText.replace(/^₹\s?/, '')}
                </p>
              </div>
              {!heroPriceIsRequest && (property?.priceUnit || heroAreaText) ? (
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-dark-muted">
                  {property?.priceUnit ? `${isGujarati ? 'પ્રતિ' : 'per'} ${heroUnitText}` : ''}
                  {property?.priceUnit && heroAreaText ? ' · ' : ''}
                  {heroAreaText}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* ===== PROPERTY LOCATION + GOOGLE MAP ===== */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:rounded-[28px] sm:p-6 dark:border-dark-border dark:bg-dark-card">
          <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl dark:text-dark-text">{t('propertyDetails.propertyLocation')}</h2>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-600 dark:text-dark-muted">
            <MapPin size={15} className="shrink-0 text-sage dark:text-emerald-400" />
            <span>{propertyLocationLabel}</span>
          </div>
          <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-dark-border">
            <iframe
              title={`${propertyTitle} location map`}
              src={getPropertyMapEmbedUrl(property)}
              className="h-60 w-full border-0 sm:h-[288px] lg:h-80"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          {property?.mapUrl || property?.googleMaps || property?.mapLink ? (
            <a
              href={property.mapUrl || property.googleMaps || property.mapLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sage px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-sage-dark sm:text-sm"
            >
              {t('propertyDetails.openInGoogleMaps')} <ExternalLink size={14} />
            </a>
          ) : null}
        </section>

        {/* ===== LOWER CONTENT GRID — DETAILS | DOCUMENTS | RELATED ===== */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.8fr_1.5fr] lg:gap-8">
          {/* PROPERTY DETAILS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:rounded-[28px] sm:p-6 dark:border-dark-border dark:bg-dark-card">
            <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl dark:text-dark-text">{t('common.propertyDetails')}</h2>

            {/* Clean hairline grid — 1 col on mobile, 2 col on sm+ */}
            <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 dark:border-dark-border dark:bg-dark-border">
              {overviewItems.map((item) => (
                <div key={item.label} className="bg-white px-4 py-3 dark:bg-dark-card">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-dark-muted">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-ink dark:text-dark-text">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Features — compact hairline grid */}
            {availableFeatures.length ? (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-ink sm:text-base dark:text-dark-text">{t('propertyDetails.propertyFeatures')}</h3>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-dark-border" />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 dark:border-dark-border dark:bg-dark-border">
                  {availableFeatures.map((item) => (
                    <div key={item.label} className="bg-white px-4 py-3 dark:bg-dark-card">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-dark-muted">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold leading-snug text-ink dark:text-dark-text">{item.value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          {/* PROPERTY DOCUMENTS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:rounded-[28px] sm:p-6 dark:border-dark-border dark:bg-dark-card">
            <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl dark:text-dark-text">{t('propertyDetails.propertyDocuments')}</h2>
            <div className="mt-3 space-y-2">
              {documentItems.length ? (
                documentItems.map((document, index) => {
                  const isImage = document.type?.startsWith('image') || /\.(png|jpg|jpeg|webp)$/i.test(document.rawName || '');
                  return (
                    <div key={`${document.rawName}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 sm:px-4 dark:border-dark-border dark:bg-dark-bg/60">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText size={16} className="shrink-0 text-sage dark:text-emerald-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink dark:text-dark-text">{translateDocumentName(document.displayName, isGujarati)}</p>
                          <p className="text-[11px] text-slate-500 dark:text-dark-muted">{documentCountLabel(documentItems.length)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {isImage && document.url ? (
                          <a href={document.url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-dark-border dark:bg-dark-card dark:text-dark-text">
                            {t('propertyDetails.view')}
                          </a>
                        ) : null}
                        {document.url ? (
                          <a href={document.url} download={document.rawName || '712-document'} className="inline-flex items-center gap-1 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sage-dark">
                            {t('propertyDetails.downloadDocument')} <Download size={12} />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-dark-muted">{t('propertyDetails.notUploaded')}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500 dark:border-dark-border dark:bg-dark-bg/60 dark:text-dark-muted">{t('propertyDetails.noDocumentUploaded')}</div>
              )}
            </div>
          </section>

          {/* RELATED PROPERTIES */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl dark:text-dark-text">
                {similarProperties.length ? t('common.relatedProperties') : t('propertyDetails.noSimilarListings')}
              </h2>
              {similarProperties.length ? (
                <button
                  type="button"
                  onClick={() => navigate(getSubmissionDestination('buyerFormSubmitted', '/buyer-form', '/buy'))}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sage transition hover:text-sage-dark"
                >
                  {t('common.viewAllShort')} <ArrowRight size={15} />
                </button>
              ) : null}
            </div>
            {similarProperties.length ? (
              <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:pb-0">
                {similarProperties.map((item) => (
                  <RelatedPropertyCard key={item.id} property={item} />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500 dark:border-dark-border dark:bg-dark-bg/60 dark:text-dark-muted">{t('propertyDetails.noSimilarListings')}</div>
            )}
          </section>
        </div>
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