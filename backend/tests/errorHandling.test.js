const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const jwtService = require('../src/services/jwt.service');

describe('Error Handling & Envelopes', () => {
  const testMobile = '9876543210';
  let user, token;

  beforeEach(async () => {
    user = await User.create({
      name: 'Test User',
      mobile: testMobile,
      city: 'Ahmedabad',
    });
    token = jwtService.generateAccessToken({ id: user._id, role: 'user', tokenVersion: 0 });
  });

  test('A duplicate mobile number on registration returns a clean 409, not a raw Mongo error', async () => {
    // Attempting to create a second user record with the exact same unique mobile
    let caughtError = null;
    try {
      await User.create({ name: 'Duplicate User', mobile: testMobile, city: 'Ahmedabad' });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.code).toBe(11000);

    // Verify global error handler translates 11000 duplicate key errors to 409 Conflict
    const errorHandler = require('../src/middleware/errorHandler.middleware');
    const req = { method: 'POST', originalUrl: '/api/auth/register' };
    let responseStatus, responseJson;
    const res = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseJson = data;
          },
        };
      },
    };

    errorHandler(caughtError, req, res, () => {});

    expect(responseStatus).toBe(409);
    expect(responseJson.success).toBe(false);
    expect(responseJson.message).toMatch(/duplicate/i);
  });

  test('An invalid ObjectId in a route param returns 400, not a 500', async () => {
    const invalidId = 'invalid-object-id-format';

    const res = await request(app)
      .get(`/api/listings/${invalidId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });
});
