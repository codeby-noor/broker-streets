import { useEffect, useState } from 'react';
import { getPropertyImage } from '../services/imageService';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg';
const isBlobUrl = (url) => typeof url === 'string' && url.trim().toLowerCase().startsWith('blob:');

function AsyncImage({ property, src, alt, className = '', containerClassName = '', ...props }) {
  const safeInitialSrc = isBlobUrl(src) ? FALLBACK_IMAGE : (src || FALLBACK_IMAGE);
  const [imageUrl, setImageUrl] = useState(safeInitialSrc);
  const [loaded, setLoaded] = useState(false);
  const [isPending, setIsPending] = useState(Boolean(property));

  useEffect(() => {
    let isMounted = true;
    const currentSrc = isBlobUrl(src) ? FALLBACK_IMAGE : (src || FALLBACK_IMAGE);

    if (!property) {
      setIsPending(false);
      setImageUrl(currentSrc);
      setLoaded(Boolean(currentSrc));
      return undefined;
    }

    setIsPending(true);
    setLoaded(false);

    getPropertyImage(property)
      .then((result) => {
        if (!isMounted) return;
        const validResult = isBlobUrl(result) ? FALLBACK_IMAGE : (result || FALLBACK_IMAGE);
        setImageUrl(validResult);
        setIsPending(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setImageUrl(FALLBACK_IMAGE);
        setIsPending(false);
      });

    return () => {
      isMounted = false;
    };
  }, [property, src]);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {isPending && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover transition duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (imageUrl !== FALLBACK_IMAGE) {
            setImageUrl(FALLBACK_IMAGE);
          }
          setLoaded(true);
        }}
        {...props}
      />
      {!loaded && !isPending && (
        <div className="absolute inset-0 bg-slate-200" />
      )}
    </div>
  );
}

export default AsyncImage;
