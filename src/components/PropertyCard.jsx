import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';
import AsyncImage from './AsyncImage';
import { isPropertySaved, onSavedPropertiesChanged, toggleSavedProperty } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { formatIndianPrice, standardizePriceUnit } from '../utils/format';

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

function PropertyCard({ property, compact = false, onContact }) {
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

  const rawPropertyType = property?.type || property?.propertyType || 'Land';
  const propertyTitle = getPropertyDisplayTitle(property?.title || property?.name || t('propertyDetails.propertyTitleFallback'), language);
  const rawPrice = property?.priceAmount || property?.price;
  const rawArea = property?.landArea || property?.area;
  const rawStatus = property?.status || 'Available';
  const priceUnit = property?.priceUnit;

  const statusText = useMemo(() => {
    if (rawStatus === 'Sold') return t('dropdown.sold');
    if (rawStatus === 'Pending') return t('dropdown.pending');
    if (rawStatus === 'Available') return t('dropdown.available');
    if (rawStatus === 'Unavailable') return t('dropdown.unavailable');
    return rawStatus;
  }, [rawStatus, t]);

  const typeText = useMemo(() => {
    if (rawPropertyType === 'Agricultural Land') return t('buyerForm.agriculturalLand');
    if (rawPropertyType === 'Non-Agricultural Land') return t('buyerForm.nonAgriculturalLand');
    if (rawPropertyType === 'Apartment') return t('dropdown.apartment');
    if (rawPropertyType === 'Villa') return t('dropdown.villa');
    if (rawPropertyType === 'House') return t('dropdown.house');
    if (rawPropertyType === 'Plot') return t('dropdown.plot');
    if (rawPropertyType === 'Farm House') return t('dropdown.farmHouse');
    if (rawPropertyType === 'Commercial') return t('dropdown.commercial');
    if (rawPropertyType === 'Office') return t('dropdown.office');
    return rawPropertyType;
  }, [rawPropertyType, t]);

  const displayArea = useMemo(() => {
    if (!rawArea || rawArea === 'Area not specified') return t('propertyDetails.landAreaFallback');
    return rawArea;
  }, [rawArea, t]);

  const displayPrice = useMemo(() => {
    if (!rawPrice || rawPrice === 'Price on request') return t('common.notAvailable');
    return formatIndianPrice(rawPrice);
  }, [rawPrice, t]);

  const displayPriceUnit = useMemo(() => {
    if (!priceUnit) return null;
    const stdUnit = standardizePriceUnit(priceUnit);
    if (stdUnit === 'Sq.Yard') return 'Sq.Yard';
    if (stdUnit === 'Sq.Ft') return t('sellerForm.sqFt');
    if (stdUnit === 'Vigha') return t('sellerForm.vigha');
    return stdUnit;
  }, [priceUnit, t]);

  const displayPriceWithUnit = useMemo(() => {
    const priceText = displayPrice;
    if (!displayPriceUnit) return priceText;
    if (priceText === t('common.notAvailable')) return priceText;
    const perWord = language === 'gu' ? 'પ્રતિ' : 'per';
    return `${priceText} ${perWord} ${displayPriceUnit}`;
  }, [displayPrice, displayPriceUnit, t, language]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/property/${property.id}`;
    const shareText = `${propertyTitle} • ${displayPrice} • ${property?.location || property?.district || ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: propertyTitle, text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.info(t('propertyDetails.propertyLinkCopied'));
      }
    } catch (error) {
      toast.error(t('propertyDetails.shareUnavailable'));
    }
  };

  const handleFavorite = () => {
    const next = toggleSavedProperty(property);
    setFavorited(next.some((p) => String(p.id) === String(property.id)));
  };

  return (
    <article className={`group flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.13)] dark:border-dark-border dark:bg-dark-card ${compact ? '' : ''}`}>
      <div className="relative overflow-hidden bg-slate-200 dark:bg-dark-card">
        <div className="aspect-[4/3] w-full overflow-hidden">
          <AsyncImage src={cardImage} alt={propertyTitle} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>

        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" aria-label={`Share ${propertyTitle}`} onClick={handleShare} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:text-dark-text dark:hover:bg-dark-card">
              <Share2 size={15} />
            </button>
            <button type="button" aria-label={`Save ${propertyTitle}`} onClick={handleFavorite} className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white dark:bg-dark-card/95 dark:hover:bg-dark-card ${favorited ? 'text-rose-600' : 'text-slate-700 dark:text-dark-text'}`}>
              <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${rawStatus === 'Sold' ? 'bg-amber-500/90 text-white' : rawStatus === 'Unavailable' ? 'bg-slate-500/90 text-white' : 'bg-primary text-white'}`}>{statusText}</span>
          <span className="rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-white">{typeText}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="space-y-3">
          <h3 className="break-words text-base font-semibold leading-tight text-slate-900 sm:text-lg dark:text-dark-text">{propertyTitle}</h3>
          <p className="break-words text-sm leading-5 text-slate-500 dark:text-dark-muted">
            <span className="inline-flex items-center gap-2 text-slate-500 dark:text-dark-muted">
              <MapPin size={14} className="text-sage dark:text-sage" />
              <span className="break-words">{locationLine || t('profile.locationPending')}</span>
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
              <p className="font-semibold text-slate-900 dark:text-dark-text">{t('common.area')}</p>
              <p className="mt-1 break-words">{displayArea}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
              <p className="font-semibold text-slate-900 dark:text-dark-text">{t('common.price')}</p>
              <p className="mt-1 break-words">{displayPriceWithUnit}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row">
          <Link to={`/property/${property.id}`} className="flex min-h-[46px] flex-1 items-center justify-center rounded-[16px] bg-sage px-4 py-3 text-sm font-semibold text-white transition hover:bg-sage-dark">
            {t('common.viewDetails')}
          </Link>
          <button type="button" onClick={() => onContact?.(property)} className="flex min-h-[46px] flex-1 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-bg">
            {t('common.contactSeller')}
          </button>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;