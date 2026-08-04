import { STORAGE_KEYS } from './storage';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_LOCK_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const DEV_OTP_LOG = true;

function getSessionKey(mobile) {
  return `${STORAGE_KEYS.otpSession || 'broker-streets-otp-session'}:${mobile}`;
}

function readSession(mobile) {
  try {
    const stored = window.localStorage.getItem(getSessionKey(mobile));
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function writeSession(mobile, session) {
  try {
    window.localStorage.setItem(getSessionKey(mobile), JSON.stringify(session));
    return true;
  } catch (error) {
    return false;
  }
}

function clearSession(mobile) {
  try {
    window.localStorage.removeItem(getSessionKey(mobile));
    return true;
  } catch (error) {
    return false;
  }
}

function isExpired(session) {
  return Boolean(session?.expiresAt && Date.now() > Number(session.expiresAt));
}

function isLocked(session) {
  return Boolean(session?.lockedUntil && Date.now() < Number(session.lockedUntil));
}

export function generateOTP(length = 6) {
  const digits = Array.from({ length }, () => String(Math.floor(Math.random() * 10)));
  return digits.join('');
}

export function sendOTP(mobile) {
  const normalizedMobile = String(mobile || '').replace(/\D/g, '');
  const otp = generateOTP();
  const now = Date.now();

  const session = {
    mobile: normalizedMobile,
    otp,
    generatedAt: now,
    expiresAt: now + OTP_TTL_MS,
    used: false,
    attempts: 0,
    lockedUntil: null,
  };

  writeSession(normalizedMobile, session);

  if (DEV_OTP_LOG) {
    console.info(`[OTP] Development OTP: ${otp}`);
  }

  return {
    success: true,
    otp,
    expiresAt: session.expiresAt,
    message: 'OTP sent successfully',
  };
}

export function verifyOTP({ mobile, otp }) {
  const normalizedMobile = String(mobile || '').replace(/\D/g, '');
  const session = readSession(normalizedMobile);

  if (!session) {
    return { success: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  if (isLocked(session)) {
    return { success: false, message: 'Too many attempts. Please try again later.' };
  }

  if (session.used) {
    return { success: false, message: 'OTP has already been used.' };
  }

  if (isExpired(session)) {
    clearSession(normalizedMobile);
    return { success: false, message: 'OTP expired. Please request a new one.' };
  }

  if (String(session.otp) !== String(otp)) {
    const nextAttempts = (session.attempts || 0) + 1;
    const nextSession = {
      ...session,
      attempts: nextAttempts,
      lockedUntil: nextAttempts >= MAX_ATTEMPTS ? Date.now() + OTP_LOCK_MS : null,
    };

    writeSession(normalizedMobile, nextSession);

    if (nextAttempts >= MAX_ATTEMPTS) {
      return { success: false, message: 'Too many attempts. Please try again later.' };
    }

    return { success: false, message: 'Invalid OTP' };
  }

  const verifiedSession = {
    ...session,
    used: true,
    attempts: 0,
    lockedUntil: null,
  };

  writeSession(normalizedMobile, verifiedSession);

  return { success: true, message: 'OTP verified successfully' };
}

export function resendOTP(mobile) {
  return sendOTP(mobile);
}

export function getOtpTimeRemaining(mobile) {
  const session = readSession(String(mobile || '').replace(/\D/g, ''));

  if (!session?.expiresAt) return 0;

  const remaining = Math.max(0, Number(session.expiresAt) - Date.now());
  return Math.ceil(remaining / 1000);
}
