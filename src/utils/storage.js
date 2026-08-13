import logo from '../assets/images/logo.png';

export const STORAGE_KEYS = {
  buyerLeads: 'broker-streets-buyer-leads',
  buyerSubmitted: 'buyerFormSubmitted',
  sellerLeads: 'broker-streets-seller-leads',
  sellerSubmitted: 'sellerFormSubmitted',
  listings: 'broker-streets-listings',
  lastProperty: 'broker-streets-last-property',
  savedProperties: 'broker-streets-saved-properties',
  recentlyViewed: 'broker-streets-recently-viewed',
  notifications: 'broker-streets-notifications',
  users: 'broker-streets-users',
  currentUserMobile: 'currentUserMobile',
  currentUserId: 'currentUserId',
  pendingOtpMobile: 'broker-streets-pending-otp-mobile',
  otpSession: 'broker-streets-otp-session',
  adminActivity: 'broker-streets-admin-activity',
};

const FALLBACK_LAND_IMAGE = logo;

const isBlobUrl = (url) => typeof url === 'string' && url.trim().toLowerCase().startsWith('blob:');

const sanitizeListingObject = (item) => {
  if (!item || typeof item !== 'object') return item;
  const copy = { ...item };

  if (isBlobUrl(copy.image)) {
    copy.image = FALLBACK_LAND_IMAGE;
  }
  if (Array.isArray(copy.gallery)) {
    copy.gallery = copy.gallery.map((url) => (isBlobUrl(url) ? FALLBACK_LAND_IMAGE : url));
  }
  if (Array.isArray(copy.images)) {
    copy.images = copy.images.map((url) => (isBlobUrl(url) ? FALLBACK_LAND_IMAGE : url));
  }
  if (isBlobUrl(copy.documentUrl)) {
    copy.documentUrl = '#';
  }
  if (isBlobUrl(copy.pdf)) {
    copy.pdf = '#';
  }
  if (copy.propertyDocument && typeof copy.propertyDocument === 'object' && isBlobUrl(copy.propertyDocument.url)) {
    copy.propertyDocument = { ...copy.propertyDocument, url: '#' };
  }
  if (isBlobUrl(copy.audio)) {
    copy.audio = '';
  }
  if (isBlobUrl(copy.voiceRecording)) {
    copy.voiceRecording = '';
  }
  return copy;
};

export function sanitizeStorageData(key, data) {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeListingObject);
  }
  if (typeof data === 'object') {
    return sanitizeListingObject(data);
  }
  return data;
}

export function readStorage(key, fallback = null) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed = JSON.parse(stored);
    return sanitizeStorageData(key, parsed);
  } catch (error) {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      if (key === STORAGE_KEYS.savedProperties) {
        window.dispatchEvent(new Event(SAVED_PROPERTIES_EVENT));
      }
      if (key === STORAGE_KEYS.recentlyViewed) {
        window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
      }
      if (key === STORAGE_KEYS.listings) {
        window.dispatchEvent(new Event(LISTINGS_CHANGED_EVENT));
      }
      if (key === STORAGE_KEYS.buyerLeads) {
        window.dispatchEvent(new Event(BUYER_LEADS_CHANGED_EVENT));
      }
      if (key === STORAGE_KEYS.sellerLeads) {
        window.dispatchEvent(new Event(SELLER_LEADS_CHANGED_EVENT));
      }
      if (key === STORAGE_KEYS.users) {
        window.dispatchEvent(new Event(USERS_CHANGED_EVENT));
      }
      if (key === STORAGE_KEYS.notifications) {
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
      }
      if (key === STORAGE_KEYS.adminActivity) {
        window.dispatchEvent(new Event(ADMIN_ACTIVITY_CHANGED_EVENT));
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

const SAVED_PROPERTIES_EVENT = 'broker-streets-saved-properties-changed';
const RECENTLY_VIEWED_EVENT = 'broker-streets-recently-viewed-changed';
const LISTINGS_CHANGED_EVENT = 'broker-streets-listings-changed';
const BUYER_LEADS_CHANGED_EVENT = 'broker-streets-buyer-leads-changed';
const SELLER_LEADS_CHANGED_EVENT = 'broker-streets-seller-leads-changed';
const USERS_CHANGED_EVENT = 'broker-streets-users-changed';
const NOTIFICATIONS_CHANGED_EVENT = 'broker-streets-notifications-changed';
const ADMIN_ACTIVITY_CHANGED_EVENT = 'broker-streets-admin-activity-changed';

function notifySavedPropertiesChanged() {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event(SAVED_PROPERTIES_EVENT));
  }
}

function notifyRecentlyViewedChanged() {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  }
}

function notifyListingsChanged() {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event(LISTINGS_CHANGED_EVENT));
  }
}

function notifyBuyerLeadsChanged() {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event(BUYER_LEADS_CHANGED_EVENT));
  }
}

function notifyNotificationsChanged() {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}

function notifyAdminActivityChanged() {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event(ADMIN_ACTIVITY_CHANGED_EVENT));
  }
}

export function appendStorageArray(key, item) {
  const current = readStorage(key, []);
  const next = Array.isArray(current) ? [item, ...current] : [item];
  writeStorage(key, next);
  return next;
}

export function getListings() {
  return readStorage(STORAGE_KEYS.listings, []);
}

export function updateListing(updatedListing) {
  if (!updatedListing || !updatedListing.id) return getListings();
  const current = getListings();
  const next = current.map((item) => (String(item.id) === String(updatedListing.id) ? updatedListing : item));
  writeStorage(STORAGE_KEYS.listings, next);
  return next;
}

export function getSavedProperties() {
  return readStorage(STORAGE_KEYS.savedProperties, []);
}

export function isPropertySaved(id) {
  if (!id) return false;
  const saved = getSavedProperties();
  return Array.isArray(saved) && saved.some((p) => String(p.id) === String(id));
}

export function toggleSavedProperty(property) {
  if (!property || !property.id) return getSavedProperties();
  const saved = getSavedProperties();
  const exists = saved.findIndex((p) => String(p.id) === String(property.id));
  let next;
  if (exists >= 0) {
    next = saved.filter((p) => String(p.id) !== String(property.id));
  } else {
    next = [property, ...saved];
  }
  writeStorage(STORAGE_KEYS.savedProperties, next);
  notifySavedPropertiesChanged();
  return next;
}

export function removeSavedProperty(id) {
  if (!id) return getSavedProperties();
  const saved = getSavedProperties();
  const next = saved.filter((p) => String(p.id) !== String(id));
  writeStorage(STORAGE_KEYS.savedProperties, next);
  notifySavedPropertiesChanged();
  return next;
}

export function addRecentlyViewed(property, max = 20) {
  if (!property || !property.id) return getRecentlyViewed();
  const current = readStorage(STORAGE_KEYS.recentlyViewed, []);
  const filtered = Array.isArray(current) ? current.filter((p) => String(p.id) !== String(property.id)) : [];
  const entry = { ...property, viewedAt: new Date().toISOString() };
  const next = [entry, ...filtered].slice(0, max);
  writeStorage(STORAGE_KEYS.recentlyViewed, next);
  notifyRecentlyViewedChanged();
  return next;
}

export function getRecentlyViewed() {
  return readStorage(STORAGE_KEYS.recentlyViewed, []);
}

export function onSavedPropertiesChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(SAVED_PROPERTIES_EVENT, handler);
    return () => window.removeEventListener(SAVED_PROPERTIES_EVENT, handler);
  }
  return () => { };
}

export function onRecentlyViewedChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(RECENTLY_VIEWED_EVENT, handler);
    return () => window.removeEventListener(RECENTLY_VIEWED_EVENT, handler);
  }
  return () => { };
}

export function onListingsChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(LISTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(LISTINGS_CHANGED_EVENT, handler);
  }
  return () => { };
}

export function onBuyerLeadsChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(BUYER_LEADS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(BUYER_LEADS_CHANGED_EVENT, handler);
  }
  return () => { };
}

export function onSellerLeadsChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(SELLER_LEADS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SELLER_LEADS_CHANGED_EVENT, handler);
  }
  return () => { };
}

export function onUsersChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(USERS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(USERS_CHANGED_EVENT, handler);
  }
  return () => { };
}

export function onNotificationsChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
  }
  return () => { };
}

export function onAdminActivityChanged(handler) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener(ADMIN_ACTIVITY_CHANGED_EVENT, handler);
    return () => window.removeEventListener(ADMIN_ACTIVITY_CHANGED_EVENT, handler);
  }
  return () => { };
}

export function readUsers() {
  return readStorage(STORAGE_KEYS.users, []);
}

export function writeUsers(users) {
  return writeStorage(STORAGE_KEYS.users, users);
}

export function getNotifications() {
  return readStorage(STORAGE_KEYS.notifications, []);
}

export function appendNotification(notification) {
  const current = readStorage(STORAGE_KEYS.notifications, []);
  const next = Array.isArray(current) ? [notification, ...current] : [notification];
  writeStorage(STORAGE_KEYS.notifications, next);
  return next;
}

export function getBuyerLeads() {
  return readStorage(STORAGE_KEYS.buyerLeads, []);
}

export function removeBuyerLead(id) {
  if (!id) return getBuyerLeads();
  const current = getBuyerLeads();
  const next = current.filter((item) => String(item.id) !== String(id));
  writeStorage(STORAGE_KEYS.buyerLeads, next);
  return next;
}

export function updateBuyerLead(updatedLead) {
  if (!updatedLead || !updatedLead.id) return getBuyerLeads();
  const current = getBuyerLeads();
  const next = current.map((item) => (String(item.id) === String(updatedLead.id) ? updatedLead : item));
  writeStorage(STORAGE_KEYS.buyerLeads, next);
  return next;
}

export function findUserByMobile(mobile) {
  const normalizedMobile = String(mobile || '').replace(/\D/g, '');
  const users = readUsers();
  if (!Array.isArray(users)) return null;
  return users.find((user) => String(user.mobile || '').replace(/\D/g, '') === normalizedMobile);
}

export function readPendingOtpMobile() {
  const pendingMobile = readStorage(STORAGE_KEYS.pendingOtpMobile, null);
  return pendingMobile ? String(pendingMobile).replace(/\D/g, '') : '';
}

export function writePendingOtpMobile(mobile) {
  const normalizedMobile = String(mobile || '').replace(/\D/g, '');
  return writeStorage(STORAGE_KEYS.pendingOtpMobile, normalizedMobile);
}

// ============================================================
// ADMIN ACTIVITY LOG (DEVELOPMENT ONLY)
// ============================================================
// ⚠️ SECURITY NOTICE — DEVELOPMENT-ONLY IMPLEMENTATION ⚠️
// This is a pure frontend Vite SPA with localStorage authentication.
// Admin login/logout activity logging is implemented in frontend
// JavaScript for DEVELOPMENT ONLY. This is NOT secure for production.
// For production, admin activity audit logs MUST be moved to a
// backend/database.

export function getAdminActivity() {
  return readStorage(STORAGE_KEYS.adminActivity, []);
}

/**
 * Append an admin activity entry.
 * Deduplicates identical entries (same mobile, type, loginAt) so React
 * StrictMode double-invocation or rapid re-renders never create duplicates.
 */
export function appendAdminActivity(entry) {
  if (!entry || !entry.mobile) return getAdminActivity();
  const current = getAdminActivity();
  const list = Array.isArray(current) ? current : [];
  const duplicate = list.some((item) =>
    String(item.mobile) === String(entry.mobile) &&
    String(item.type) === String(entry.type) &&
    String(item.loginAt || item.logoutAt || '') === String(entry.loginAt || entry.logoutAt || '')
  );
  if (duplicate) return list;
  const next = [entry, ...list];
  writeStorage(STORAGE_KEYS.adminActivity, next);
  return next;
}

export function updateAdminActivity(updatedEntry) {
  if (!updatedEntry || !updatedEntry.id) return getAdminActivity();
  const current = getAdminActivity();
  const next = current.map((item) => (String(item.id) === String(updatedEntry.id) ? updatedEntry : item));
  writeStorage(STORAGE_KEYS.adminActivity, next);
  return next;
}

