import { toast } from 'react-toastify';
import { STORAGE_KEYS } from './storage';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_LOCK_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const DEV_OTP_LOG = import.meta.env.DEV;

export function normalizeMobile(mobile) {
  return String(mobile || '').replace(/\D/g, '');
}

function getSessionKey(mobile) {
  const normalizedMobile = normalizeMobile(mobile);
  return `${STORAGE_KEYS.otpSession || 'broker-streets-otp-session'}:${normalizedMobile}`;
}

function readSession(mobile) {
  const normalizedMobile = normalizeMobile(mobile);

  try {
    const stored = window.localStorage.getItem(getSessionKey(normalizedMobile));
    if (stored) {
      return JSON.parse(stored);
    }

    const activeSession = window.localStorage.getItem(STORAGE_KEYS.activeOtpSession);
    if (!activeSession) return null;

    const parsed = JSON.parse(activeSession);
    if (parsed && normalizeMobile(parsed.mobile) === normalizedMobile) {
      return parsed;
    }

    return null;
  } catch (error) {
    return null;
  }
}

function writeSession(mobile, session) {
  const normalizedMobile = normalizeMobile(mobile);

  try {
    const payload = {
      ...session,
      mobile: normalizedMobile,
    };
    window.localStorage.setItem(getSessionKey(normalizedMobile), JSON.stringify(payload));
    window.localStorage.setItem(STORAGE_KEYS.activeOtpSession, JSON.stringify(payload));
    return true;
  } catch (error) {
    return false;
  }
}

function clearSession(mobile) {
  const normalizedMobile = normalizeMobile(mobile);

  try {
    window.localStorage.removeItem(getSessionKey(normalizedMobile));
    const activeSession = window.localStorage.getItem(STORAGE_KEYS.activeOtpSession);
    if (activeSession) {
      const parsed = JSON.parse(activeSession);
      if (normalizeMobile(parsed.mobile) === normalizedMobile) {
        window.localStorage.removeItem(STORAGE_KEYS.activeOtpSession);
      }
    }
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
  const normalizedMobile = normalizeMobile(mobile);
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

  const saved = writeSession(normalizedMobile, session);

  if (!saved) {
    return {
      success: false,
      message: 'Unable to save OTP session. Please try again.',
    };
  }

  if (DEV_OTP_LOG) {
    console.info(`[OTP] Development OTP: ${otp}`);
    toast.info(`Development OTP: ${otp}`);
  }

  return {
    success: true,
    otp,
    expiresAt: session.expiresAt,
    message: 'OTP sent successfully',
  };
}

export function verifyOTP({ mobile, otp }) {
  const normalizedMobile = normalizeMobile(mobile);
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
  const session = readSession(normalizeMobile(mobile));

  if (!session?.expiresAt) return 0;

  const remaining = Math.max(0, Number(session.expiresAt) - Date.now());
  return Math.ceil(remaining / 1000);
}
