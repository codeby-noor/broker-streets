const request = require('supertest');
const { Webhook } = require('svix');
const app = require('../src/app');
const User = require('../src/models/User');
const msg91Router = require('../src/routes/msg91.otp');
const env = require('../src/config/env');
const express = require('express');

describe('Clerk Auth & Profile Workflows', () => {
  const webhookSecret = 'whsec_dGVzdF9zZWNyZXRfa2V5XzEyMzQ1Njc4OTA=';
  process.env.CLERK_WEBHOOK_SECRET = webhookSecret;
  env.clerkWebhookSecret = webhookSecret;

  const mockClerkUserId = 'user_clerk_test_12345';
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      clerkUserId: mockClerkUserId,
      name: 'Test Clerk User',
      email: 'clerkuser@example.com',
      phoneNumber: '9876543210',
      mobile: '9876543210',
      city: 'Ahmedabad',
      role: 'user',
      isActive: true,
    });
  });

  describe('Mongo User Model & Clerk Identity', () => {
    test('User schema has clerkUserId, phoneNumber, and mobile synced', async () => {
      const user = await User.create({
        clerkUserId: 'user_new_clerk_id_999',
        name: 'New User',
        email: 'newuser@example.com',
        phoneNumber: '9123456780',
        city: 'Surat',
      });

      expect(user.clerkUserId).toBe('user_new_clerk_id_999');
      expect(user.phoneNumber).toBe('9123456780');
      expect(user.mobile).toBe('9123456780');
      expect(user.id).toBeDefined();
    });

    test('clerkUserId is unique in Mongo schema', async () => {
      let duplicateError = null;
      try {
        await User.create({
          clerkUserId: mockClerkUserId,
          name: 'Duplicate Clerk User',
          email: 'dup@example.com',
          phoneNumber: '9999999999',
        });
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).not.toBeNull();
      expect(duplicateError.code).toBe(11000);
    });
  });

  describe('PATCH /api/users/me/profile (Profile Completion Gate)', () => {
    test('Successfully updates phoneNumber and city', async () => {
      // Mock auth middleware for test
      const resolveDbUser = require('../src/middleware/auth.middleware').resolveDbUser;

      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, res, next) => {
        req.auth = () => ({ userId: mockClerkUserId });
        next();
      });
      testApp.use(resolveDbUser);
      testApp.patch('/api/users/me/profile', require('../src/controllers/user.controller').completeProfile);

      const res = await request(testApp)
        .patch('/api/users/me/profile')
        .send({ phoneNumber: '9898989898', city: 'Vadodara' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phoneNumber).toBe('9898989898');
      expect(res.body.data.user.mobile).toBe('9898989898');
      expect(res.body.data.user.city).toBe('Vadodara');

      const updatedInDb = await User.findOne({ clerkUserId: mockClerkUserId });
      expect(updatedInDb.phoneNumber).toBe('9898989898');
      expect(updatedInDb.city).toBe('Vadodara');
    });

    test('Derives or gracefully allows omitted city using geoip-lite without blocking', async () => {
      const resolveDbUser = require('../src/middleware/auth.middleware').resolveDbUser;

      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, res, next) => {
        req.auth = () => ({ userId: mockClerkUserId });
        next();
      });
      testApp.use(resolveDbUser);
      testApp.patch('/api/users/me/profile', require('../src/controllers/user.controller').completeProfile);

      const res = await request(testApp)
        .patch('/api/users/me/profile')
        .send({ phoneNumber: '9111111111' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phoneNumber).toBe('9111111111');
    });

    test('Rejects missing or invalid phone number with 400 Bad Request', async () => {
      const resolveDbUser = require('../src/middleware/auth.middleware').resolveDbUser;
      const errorHandler = require('../src/middleware/errorHandler.middleware');

      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, res, next) => {
        req.auth = () => ({ userId: mockClerkUserId });
        next();
      });
      testApp.use(resolveDbUser);
      testApp.patch('/api/users/me/profile', require('../src/controllers/user.controller').completeProfile);
      testApp.use(errorHandler);

      const resNoPhone = await request(testApp)
        .patch('/api/users/me/profile')
        .send({ city: 'Ahmedabad' });

      expect(resNoPhone.statusCode).toBe(400);
      expect(resNoPhone.body.message).toMatch(/phone/i);

      const resShortPhone = await request(testApp)
        .patch('/api/users/me/profile')
        .send({ phoneNumber: '123' });

      expect(resShortPhone.statusCode).toBe(400);
      expect(resShortPhone.body.message).toMatch(/valid/i);
    });
  });

  describe('POST /api/webhooks/clerk (Svix Webhook Verification)', () => {
    test('user.created webhook creates Mongo User document with empty phone and city', async () => {
      const newClerkId = 'user_webhook_test_88888';
      const payloadObj = {
        type: 'user.created',
        data: {
          id: newClerkId,
          first_name: 'Webhook',
          last_name: 'User',
          email_addresses: [
            { id: 'email_123', email_address: 'webhookuser@example.com' },
          ],
          primary_email_address_id: 'email_123',
          image_url: 'https://example.com/avatar.jpg',
        },
      };

      const payloadString = JSON.stringify(payloadObj);
      const msgId = 'msg_test_id_1';
      const timestamp = new Date();

      // Sign with Svix: sign(msgId, timestamp, payload)
      const wh = new Webhook(webhookSecret);
      const signature = wh.sign(msgId, timestamp, payloadString);

      const res = await request(app)
        .post('/api/webhooks/clerk')
        .set('svix-id', msgId)
        .set('svix-timestamp', Math.floor(timestamp.getTime() / 1000).toString())
        .set('svix-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadString);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const createdUser = await User.findOne({ clerkUserId: newClerkId });
      expect(createdUser).not.toBeNull();
      expect(createdUser.name).toBe('Webhook User');
      expect(createdUser.email).toBe('webhookuser@example.com');
      expect(createdUser.phoneNumber).toBe('');
      expect(createdUser.city).toBe('');
    });

    test('Rejects webhook request with invalid or missing Svix signature', async () => {
      const res = await request(app)
        .post('/api/webhooks/clerk')
        .set('svix-id', 'fake_id')
        .set('svix-timestamp', new Date().toISOString())
        .set('svix-signature', 'v1,invalid_signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'user.created', data: {} }));

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/verification failed/i);
    });
  });

  describe('Part 4 — MSG91 Placeholder Routes', () => {
    test('Stubbed unmounted MSG91 routes return 501 Not Implemented', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/auth/msg91', msg91Router);

      const sendRes = await request(testApp)
        .post('/api/auth/msg91/send-otp')
        .send({ mobile: '9876543210' });
      expect(sendRes.statusCode).toBe(501);
      expect(sendRes.body.message).toMatch(/DLT/i);

      const verifyRes = await request(testApp)
        .post('/api/auth/msg91/verify-otp')
        .send({ mobile: '9876543210', otp: '123456' });
      expect(verifyRes.statusCode).toBe(501);
      expect(verifyRes.body.message).toMatch(/DLT/i);
    });
  });
});
