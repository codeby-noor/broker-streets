export const STORAGE_KEYS = {
  buyerLeads: 'broker-streets-buyer-leads',
  buyerSubmitted: 'buyerFormSubmitted',
  sellerLeads: 'broker-streets-seller-leads',
  sellerSubmitted: 'sellerFormSubmitted',
  listings: 'broker-streets-listings',
  lastProperty: 'broker-streets-last-property',
  users: 'broker-streets-users',
  currentUserMobile: 'currentUserMobile',
  currentUserId: 'currentUserId',
};

export function readStorage(key, fallback = null) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    return JSON.parse(stored);
  } catch (error) {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

export function appendStorageArray(key, item) {
  const current = readStorage(key, []);
  const next = Array.isArray(current) ? [item, ...current] : [item];
  writeStorage(key, next);
  return next;
}

export function readUsers() {
  return readStorage(STORAGE_KEYS.users, []);
}

export function writeUsers(users) {
  return writeStorage(STORAGE_KEYS.users, users);
}

export function findUserByMobile(mobile) {
  const users = readUsers();
  if (!Array.isArray(users)) return null;
  return users.find((user) => String(user.mobile || '') === String(mobile));
}

