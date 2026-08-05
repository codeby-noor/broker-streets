import { toast } from 'react-toastify';
import { STORAGE_KEYS } from './storage';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_LOCK_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const OTP_DEBUG = import.meta.env.DEV;

function logOtp(stage, details) {
  if (!OTP_DEBUG) return;
  console.info(`[OTP] ${stage}`, details);
}

export function normalizeMobile(mobile) {
  return String(mobile || '').replace(/\D/g, '');
}

export function getOtpSessionKey(mobile) {
  const normalizedMobile = normalizeMobile(mobile);
  return `${STORAGE_KEYS.otpSession || 'broker-streets-otp-session'}:${normalizedMobile}`;
}

function readSession(mobile) {
  const normalizedMobile = normalizeMobile(mobile);

  try {
    const sessionKey = getOtpSessionKey(normalizedMobile);
    const rawSession = window.localStorage.getItem(sessionKey);
    logOtp('readSession() localStorage lookup', { normalizedMobile, sessionKey, rawSession });

    if (!rawSession) return null;

    const session = JSON.parse(rawSession);
    logOtp('Session loaded from localStorage', { normalizedMobile, sessionKey, session });
    return session;
  } catch (error) {
    logOtp('Unable to load OTP session', { normalizedMobile, error });
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
    const sessionKey = getOtpSessionKey(normalizedMobile);
    const savedJson = JSON.stringify(payload);
    window.localStorage.setItem(sessionKey, savedJson);
    const rawSession = window.localStorage.getItem(sessionKey);
    const saved = rawSession === savedJson;
    logOtp('writeSession() localStorage write', {
      normalizedMobile,
      sessionKey,
      savedJson,
      rawSession,
      saved,
    });
    return saved;
  } catch (error) {
    logOtp('Unable to save OTP session', { normalizedMobile, error });
    return false;
  }
}

function clearSession(mobile) {
  const normalizedMobile = normalizeMobile(mobile);

  try {
    const sessionKey = getOtpSessionKey(normalizedMobile);
    logOtp('clearSession() called', { normalizedMobile, sessionKey });
    window.localStorage.removeItem(sessionKey);
    return true;
  } catch (error) {
    logOtp('Unable to clear OTP session', { normalizedMobile, error });
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
  const storedSession = readSession(normalizedMobile);
  const sessionPersisted = Boolean(
    storedSession
      && storedSession.mobile === normalizedMobile
      && storedSession.otp === otp
  );

  logOtp('sendOTP()', {
    normalizedMobile,
    generatedOtp: otp,
    sessionKey: getOtpSessionKey(normalizedMobile),
    session,
    saved,
    storedSession,
    sessionPersisted,
  });

  if (!saved || !sessionPersisted) {
    return {
      success: false,
      message: 'Unable to save OTP session. Please try again.',
    };
  }

  if (OTP_DEBUG) {
    console.info('Development OTP:', otp);
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

  logOtp('verifyOTP()', {
    normalizedMobile,
    sessionKey: getOtpSessionKey(normalizedMobile),
    storedOtp: session?.otp,
    enteredOtp: String(otp ?? ''),
    expiry: session?.expiresAt,
    attempts: session?.attempts,
    used: session?.used,
    locked: isLocked(session),
    session,
  });

  if (!session) {
    logOtp('Verification result', { success: false, reason: 'session not found' });
    return { success: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  if (isLocked(session)) {
    logOtp('Verification result', { success: false, reason: 'session locked' });
    return { success: false, message: 'Too many attempts. Please try again later.' };
  }

  if (session.used) {
    logOtp('Verification result', { success: false, reason: 'session already used' });
    return { success: false, message: 'OTP has already been used.' };
  }

  if (isExpired(session)) {
    clearSession(normalizedMobile);
    logOtp('Verification result', { success: false, reason: 'session expired' });
    return { success: false, message: 'OTP expired. Please request a new one.' };
  }

  const storedOtp = String(session.otp ?? '');
  const enteredOtp = String(otp ?? '').trim();
  const matches = storedOtp === enteredOtp;
  logOtp('OTP comparison', { storedOtp, enteredOtp, matches });

  if (!matches) {
    const nextAttempts = (session.attempts || 0) + 1;
    const nextSession = {
      ...session,
      attempts: nextAttempts,
      lockedUntil: nextAttempts >= MAX_ATTEMPTS ? Date.now() + OTP_LOCK_MS : null,
    };

    writeSession(normalizedMobile, nextSession);

    if (nextAttempts >= MAX_ATTEMPTS) {
      logOtp('Verification result', { success: false, reason: 'maximum attempts reached', attempts: nextAttempts });
      return { success: false, message: 'Too many attempts. Please try again later.' };
    }

    logOtp('Verification result', { success: false, reason: 'OTP mismatch', attempts: nextAttempts });
    return { success: false, message: 'Invalid OTP' };
  }

  const verifiedSession = {
    ...session,
    used: true,
    attempts: 0,
    lockedUntil: null,
  };

  writeSession(normalizedMobile, verifiedSession);

  logOtp('Verification result', { success: true });
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
