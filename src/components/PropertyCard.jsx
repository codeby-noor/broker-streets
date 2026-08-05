import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Phone, Share2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import AsyncImage from './AsyncImage';
import { getSavedProperties, isPropertySaved, onSavedPropertiesChanged, toggleSavedProperty } from '../utils/storage';

function PropertyCard({ property, compact = false, onContact }) {
  const [favorited, setFavorited] = useState(() => isPropertySaved(property?.id));

  useEffect(() => {
    setFavorited(isPropertySaved(property?.id));
    const cleanup = onSavedPropertiesChanged(() => setFavorited(isPropertySaved(property?.id)));
    return cleanup;
  }, [property?.id]);

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

  const handleFavorite = () => {
    const next = toggleSavedProperty(property);
    setFavorited(next.some((p) => String(p.id) === String(property.id)));
  };

  return (
    <article className={`group overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover ${compact ? '' : ''}`}>
      <div className="relative h-56 overflow-hidden bg-stone-200">
        <AsyncImage property={property} alt={property.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {property.verified ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-cream/95 px-3 py-2 text-xs font-semibold text-ink shadow-sm">
                <ShieldCheck size={14} className="text-sage" /> Verified
              </div>
            ) : null}
            <span className={`rounded-full px-3 py-2 text-xs font-semibold ${property.status === 'Sold' ? 'bg-amber-500/90 text-white' : property.status === 'Pending' ? 'bg-slate-700/90 text-white' : 'bg-success/90 text-white'}`}>{property.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={`Share ${property.title}`} onClick={handleShare} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-ink shadow-sm transition hover:bg-white">
              <Share2 size={17} />
            </button>
            <button type="button" aria-label={`Save ${property.title}`} onClick={handleFavorite} className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 shadow-sm transition hover:bg-white ${favorited ? 'text-rose-600' : 'text-ink'}`}>
              <Heart size={17} fill={favorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          {(property.tags || []).slice(0, 1).map((tag) => (
            <span key={tag} className="rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-white">{tag}</span>
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sage"><MapPin size={13} />{property.location}</p>
            <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{property.title}</h3>
          </div>
          <p className="whitespace-nowrap text-base font-bold text-ink">{property.price}</p>
        </div>
        <p className="mt-3 text-sm text-muted">{property.area} · {property.city}</p>
        <p className="mt-2 text-xs text-muted">{property.address}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <span className="text-xs font-semibold text-muted">{property.type}</span>
          <div className="flex items-center gap-2">
            <Link to={`/property/${property.id}`} className="inline-flex items-center justify-center rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-dark">View Details</Link>
            <button type="button" onClick={() => onContact?.(property)} className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 border border-stone-200 transition hover:bg-slate-50">Contact</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
