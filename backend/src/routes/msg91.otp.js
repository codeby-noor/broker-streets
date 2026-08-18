/**
 * MSG91 OTP Flow Placeholder (DLT-Compliant Ticket-Based Auth)
 * ==========================================================
 * STATUS: Unmounted Placeholder (Pending DLT / Regulatory Approval).
 * DO NOT MOUNT OR IMPLEMENT ACTUAL SMS SEND/VERIFY AT THIS TIME.
 *
 * Future Architecture & Integration Flow:
 * ---------------------------------------
 * 1. User submits their mobile phone number to the backend endpoint (/api/auth/msg91/send-otp).
 * 2. Backend dispatches an OTP via MSG91 SMS API and verifies the OTP code MSG91-side
 *    (fully compliant with Indian telecom DLT regulations and sender headers).
 * 3. Upon successful MSG91 OTP verification, the backend calls Clerk's Backend API:
 *      const ticket = await clerkClient.signInTokens.createSignInToken({
 *        userId: clerkUser.id,
 *        expiresInSeconds: 300,
 *      });
 *    and returns the minted sign-in ticket to the frontend client.
 * 4. The frontend React application invokes Clerk's ticket authentication strategy:
 *      await signIn.create({
 *        strategy: 'ticket',
 *        ticket: response.data.ticket,
 *      });
 *    to establish a first-class, official Clerk session token without any Clerk-side SMS ever being sent.
 *
 * Environment Variable:
 *   MSG91_AUTH_KEY (keep commented in .env until DLT registration is finalized).
 */

const express = require('express');
const router = express.Router();

/**
 * Stub route: Send OTP via MSG91
 * Expected payload: { mobile: string }
 */
router.post('/send-otp', (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'MSG91 OTP service is pending DLT regulatory approval and is not active yet.',
  });
});

/**
 * Stub route: Verify OTP via MSG91 and mint Clerk sign-in ticket
 * Expected payload: { mobile: string, otp: string }
 */
router.post('/verify-otp', (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'MSG91 OTP verification is pending DLT regulatory approval and is not active yet.',
  });
});

module.exports = router;
