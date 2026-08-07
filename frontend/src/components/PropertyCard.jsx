import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Share2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import AsyncImage from './AsyncImage';
import { isPropertySaved, onSavedPropertiesChanged, toggleSavedProperty } from '../utils/storage';

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

    return candidates.find((item) => typeof item === 'string' && item.trim()) || getLandImage(property);
  }, [property]);

  const locationLine = useMemo(() => {
    const parts = [property?.village, property?.subDistrict || property?.taluka, property?.district || property?.location || property?.city];
    return parts.filter(Boolean).join(' • ');
  }, [property]);

  const propertyType = property?.type || property?.propertyType || 'Land';
  const propertyTitle = property?.title || property?.name || 'Land Listing';
  const propertyPrice = property?.price || property?.priceAmount || 'Price on request';
  const propertyArea = property?.landArea || property?.area || 'Area not specified';
  const propertyStatus = property?.status || 'Available';
  const postedDate = property?.uploadedDate || property?.submittedAt || property?.createdAt || property?.updatedAt || 'Recently listed';

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/property/${property.id}`;
    const shareText = `${propertyTitle} • ${propertyPrice} • ${property?.location || property?.district || 'Land'}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: propertyTitle, text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.info('Property link copied.');
      }
    } catch (error) {
      toast.error('Sharing is unavailable right now.');
    }
  };

  const handleFavorite = () => {
    const next = toggleSavedProperty(property);
    setFavorited(next.some((p) => String(p.id) === String(property.id)));
  };

  return (
    <article className={`group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.13)] ${compact ? '' : ''}`}>
      <div className="relative h-[250px] overflow-hidden bg-slate-200">
        <AsyncImage src={cardImage} alt={propertyTitle} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {property?.verified ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm">
                <ShieldCheck size={13} className="text-sage" /> Verified
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={`Share ${propertyTitle}`} onClick={handleShare} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:bg-white">
              <Share2 size={16} />
            </button>
            <button type="button" aria-label={`Save ${propertyTitle}`} onClick={handleFavorite} className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white ${favorited ? 'text-rose-600' : 'text-slate-700'}`}>
              <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${propertyStatus === 'Sold' ? 'bg-amber-500/90 text-white' : 'bg-emerald-600/90 text-white'}`}>{propertyStatus}</span>
          <span className="rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-white">{propertyType}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="space-y-2">
          <h3 className="text-[22px] font-semibold leading-tight text-slate-900">{propertyTitle}</h3>
          <p className="flex items-center gap-1.5 text-[15px] text-slate-500">
            <MapPin size={15} className="text-sage" /> {locationLine || 'Location details pending'}
          </p>
          <p className="text-[16px] font-medium text-slate-700">{propertyArea}</p>
          <p className="text-[30px] font-bold text-emerald-700">{propertyPrice}</p>
          <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] font-semibold text-slate-600">{propertyType}</div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-slate-400">Posted</p>
          <p className="mt-1 text-[13px] text-slate-500">{postedDate}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to={`/property/${property.id}`} className="flex-1 inline-flex min-h-[46px] items-center justify-center rounded-[16px] bg-sage px-4 py-3 text-[16px] font-semibold text-white transition hover:bg-sage-dark">
            View Details
          </Link>
          <button type="button" onClick={() => onContact?.(property)} className="flex-1 inline-flex min-h-[46px] items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-[16px] font-semibold text-slate-700 transition hover:bg-slate-50">
            Contact Seller
          </button>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
