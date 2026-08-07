const FALLBACK_IMAGE = 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg';
const SESSION_CACHE = new Map();
const PENDING_REQUESTS = new Map();

const typeQueryMap = {
  'Agricultural Land': 'agriculture land india',
  'Non-Agricultural Land': 'empty land',
  'Residential Plot': 'residential plot',
  'Commercial Plot': 'commercial land',
  'Industrial Plot': 'industrial land',
  Farm: 'farmland india',
  'Banana Farm': 'banana plantation',
  'Mango Farm': 'mango farm',
  'Sugarcane Farm': 'sugarcane farm',
  'Cotton Farm': 'cotton farm',
  'Investment Plot': 'land investment',
  'Green Farm': 'green farmland',
  'Village Land': 'rural farmland',
  'Open Plot': 'open land',
  'NA Plot': 'non agricultural land',
};

const normalizeKey = (value) => String(value || '').trim();

const hasWindowStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeGetItem = (key) => {
  if (!hasWindowStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key, value) => {
  if (!hasWindowStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
};

const getSearchQuery = (property = {}) => {
  const type = normalizeKey(property.propertyType || property.type || property.category || property.title || 'Land');
  const mapped = typeQueryMap[type] || type;
  const parts = [mapped];

  if (property.city) {
    parts.push(property.city);
  }

  if (property.location && !String(property.location).toLowerCase().includes(String(property.city || '').toLowerCase())) {
    parts.push(property.location);
  }

  if (property.state && !String(property.state).toLowerCase().includes(String(property.city || '').toLowerCase())) {
    parts.push(property.state);
  }

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

const getCacheKey = (query) => `brokerstreets_pexels_image::${encodeURIComponent(String(query).toLowerCase().trim())}`;

export async function searchPexels(query) {
  const trimmedQuery = String(query || '').trim();
  if (!trimmedQuery) {
    return null;
  }

  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(trimmedQuery)}&per_page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const photo = data?.photos?.[0];
    return photo?.src?.large2x || photo?.src?.large || photo?.src?.medium || null;
  } catch {
    return null;
  }
}

export function getPropertyImageCacheKey(property) {
  return getCacheKey(getSearchQuery(property));
}

export async function getPropertyImage(property) {
  const query = getSearchQuery(property);
  const cacheKey = getCacheKey(query);

  if (SESSION_CACHE.has(cacheKey)) {
    return SESSION_CACHE.get(cacheKey);
  }

  const stored = safeGetItem(cacheKey);
  if (stored) {
    SESSION_CACHE.set(cacheKey, stored);
    return stored;
  }

  if (PENDING_REQUESTS.has(cacheKey)) {
    return PENDING_REQUESTS.get(cacheKey);
  }

  const request = (async () => {
    try {
      const imageUrl = await searchPexels(query);
      const result = imageUrl || FALLBACK_IMAGE;
      safeSetItem(cacheKey, result);
      SESSION_CACHE.set(cacheKey, result);
      return result;
    } catch {
      const result = FALLBACK_IMAGE;
      safeSetItem(cacheKey, result);
      SESSION_CACHE.set(cacheKey, result);
      return result;
    } finally {
      PENDING_REQUESTS.delete(cacheKey);
    }
  })();

  PENDING_REQUESTS.set(cacheKey, request);
  return request;
}
