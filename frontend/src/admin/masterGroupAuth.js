/**
 * MASTER GROUP AUTHENTICATION UTILITY
 * ====================================
 *
 * ⚠️ SECURITY NOTICE — DEVELOPMENT-ONLY IMPLEMENTATION ⚠️
 * --------------------------------------------------------
 * This project is a pure frontend Vite SPA with NO backend.
 * The OTP generation/verification and the approved-number whitelist
 * below are implemented in frontend JavaScript for DEVELOPMENT ONLY.
 *
 * THIS IS NOT SECURE FOR PRODUCTION.
 *
 * For production, the following MUST be moved server-side:
 *   1. The approved-number whitelist (APPROVED_MASTER_GROUP_MOBILES)
 *   2. OTP generation (sendMasterGroupOtp)
 *   3. OTP verification (verifyMasterGroupOtp)
 *   4. OTP expiry / attempt locking
 *   5. The authenticated session issuance
 *
 * The frontend should only send the mobile number to a backend API
 * and receive a session token back. Never expose the whitelist or
 * OTP secret in frontend JavaScript.
 */

import { readStorage, writeStorage } from '../utils/storage';

export const MASTER_GROUP_AUTH_KEY = 'broker-streets-admin-auth';
export const MASTER_GROUP_OTP_SESSION_PREFIX = 'broker-streets-master-group-otp-session';

/**
 * ⚠️ DEV-ONLY APPROVED WHITELIST
 * ------------------------------
 * These are the ONLY mobile numbers allowed to access the Master Group.
 * Any other number is rejected immediately.
 *
 * MUST BE MOVED SERVER-SIDE FOR PRODUCTION.
 */
const APPROVED_MASTER_GROUP_MOBILES = [
    '9876543210',
    '9123456780',
    '9988776655',
];

/**
 * ⚠️ DEV-ONLY SUPER ADMIN IDENTITY
 * --------------------------------
 * This is the ONLY mobile number that receives role: "super-admin".
 * MUST BE MOVED SERVER-SIDE FOR PRODUCTION.
 */
const SUPER_ADMIN_MOBILE = '9876543210';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;
const OTP_LOCK_MS = 10 * 60 * 1000; // 10 minutes

export function normalizeMobile(mobile) {
    return String(mobile || '').replace(/\D/g, '');
}

/**
 * Check if a mobile number is in the approved Master Group whitelist.
 * MUST BE MOVED SERVER-SIDE FOR PRODUCTION.
 */
export function isApprovedMasterGroupMobile(mobile) {
    const normalized = normalizeMobile(mobile);
    return APPROVED_MASTER_GROUP_MOBILES.includes(normalized);
}

function getOtpSessionKey(mobile) {
    const normalized = normalizeMobile(mobile);
    return `${MASTER_GROUP_OTP_SESSION_PREFIX}:${normalized}`;
}

function readOtpSession(mobile) {
    const normalized = normalizeMobile(mobile);
    try {
        const raw = window.localStorage.getItem(getOtpSessionKey(normalized));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeOtpSession(mobile, session) {
    const normalized = normalizeMobile(mobile);
    try {
        window.localStorage.setItem(getOtpSessionKey(normalized), JSON.stringify(session));
        return true;
    } catch {
        return false;
    }
}

function clearOtpSession(mobile) {
    const normalized = normalizeMobile(mobile);
    try {
        window.localStorage.removeItem(getOtpSessionKey(normalized));
        return true;
    } catch {
        return false;
    }
}

function isExpired(session) {
    return Boolean(session?.expiresAt && Date.now() > Number(session.expiresAt));
}

function isLocked(session) {
    return Boolean(session?.lockedUntil && Date.now() < Number(session.lockedUntil));
}

function generateOtp(length = 6) {
    const digits = Array.from({ length }, () => String(Math.floor(Math.random() * 10)));
    return digits.join('');
}

/**
 * Send an OTP to an approved Master Group mobile number.
 * MUST BE MOVED SERVER-SIDE FOR PRODUCTION.
 */
export function sendMasterGroupOtp(mobile) {
    const normalized = normalizeMobile(mobile);

    // Reject immediately if not approved
    if (!isApprovedMasterGroupMobile(normalized)) {
        return {
            success: false,
            message: 'This mobile number is not authorized for Master Group access.',
        };
    }

    const existing = readOtpSession(normalized);

    // Enforce resend cooldown
    if (existing?.resendAt && Date.now() < Number(existing.resendAt)) {
        const remainingMs = Number(existing.resendAt) - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        return {
            success: false,
            message: `Please wait ${remainingSec}s before requesting a new OTP.`,
            cooldownRemaining: remainingSec,
        };
    }

    const otp = generateOtp();
    const now = Date.now();

    const session = {
        mobile: normalized,
        otp,
        generatedAt: now,
        expiresAt: now + OTP_TTL_MS,
        resendAt: now + RESEND_COOLDOWN_MS,
        used: false,
        attempts: 0,
        lockedUntil: null,
    };

    const saved = writeOtpSession(normalized, session);

    if (!saved) {
        return { success: false, message: 'Unable to save OTP session. Please try again.' };
    }

    // DEV-ONLY: expose the OTP in the response for development.
    // MUST BE REMOVED when moving to a real backend.
    return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt: session.expiresAt,
        devOtp: otp,
    };
}

/**
 * Verify an OTP for a Master Group mobile number.
 * MUST BE MOVED SERVER-SIDE FOR PRODUCTION.
 */
export function verifyMasterGroupOtp({ mobile, otp }) {
    const normalized = normalizeMobile(mobile);
    const session = readOtpSession(normalized);

    // No session = expired or never requested
    if (!session) {
        return { success: false, message: 'OTP expired or not found. Please request a new one.' };
    }

    // Locked out
    if (isLocked(session)) {
        return { success: false, message: 'Too many attempts. Please try again later.' };
    }

    // Already used
    if (session.used) {
        return { success: false, message: 'OTP has already been used.' };
    }

    // Expired
    if (isExpired(session)) {
        clearOtpSession(normalized);
        return { success: false, message: 'OTP expired. Please request a new one.' };
    }

    // Empty OTP
    const enteredOtp = String(otp ?? '').trim();
    if (!enteredOtp) {
        return { success: false, message: 'Please enter the OTP.' };
    }

    const storedOtp = String(session.otp ?? '');
    const matches = storedOtp === enteredOtp;

    if (!matches) {
        const nextAttempts = (session.attempts || 0) + 1;
        const nextSession = {
            ...session,
            attempts: nextAttempts,
            lockedUntil: nextAttempts >= MAX_ATTEMPTS ? Date.now() + OTP_LOCK_MS : null,
        };

        writeOtpSession(normalized, nextSession);

        if (nextAttempts >= MAX_ATTEMPTS) {
            return { success: false, message: 'Too many attempts. Please try again later.' };
        }

        return { success: false, message: 'Invalid OTP. Access denied.' };
    }

    // Mark as used
    const verifiedSession = {
        ...session,
        used: true,
        attempts: 0,
        lockedUntil: null,
    };
    writeOtpSession(normalized, verifiedSession);

    return { success: true, message: 'OTP verified successfully' };
}

/**
 * Create the authenticated Master Group session.
 * Stores the verified mobile number under broker-streets-admin-auth.
 */
export function createMasterGroupSession(mobile) {
    const normalized = normalizeMobile(mobile);
    const isSuperAdmin = normalized === SUPER_ADMIN_MOBILE;
    const session = {
        role: isSuperAdmin ? 'super-admin' : 'master-group',
        mobile: normalized,
        verifiedAt: Date.now(),
    };
    writeStorage(MASTER_GROUP_AUTH_KEY, session);
    return session;
}

/**
 * Check if the current Master Group session is a Super Admin.
 */
export function isSuperAdminSession() {
    const session = readMasterGroupSession();
    return Boolean(session && session.role === 'super-admin');
}

/**
 * Read the current Master Group session.
 */
export function readMasterGroupSession() {
    return readStorage(MASTER_GROUP_AUTH_KEY, null);
}

/**
 * Clear the Master Group session (logout).
 */
export function clearMasterGroupSession() {
    try {
        window.localStorage.removeItem(MASTER_GROUP_AUTH_KEY);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get the dev OTP for an approved mobile (for development display).
 */
export function getMasterGroupDevOtp(mobile) {
    const normalized = normalizeMobile(mobile);
    const session = readOtpSession(normalized);
    return session?.otp ?? null;
}