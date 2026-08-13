const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const OtpSession = require('../src/models/OtpSession');

describe('Auth Endpoints & Workflows', () => {
  const testMobile = '9876543210';
  const testUser = {
    name: 'Test User',
    mobile: testMobile,
    city: 'Ahmedabad',
  };

  test('Registration issues OTP session', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mobile).toBe(testMobile);
    expect(res.body.data.devOtp).toBeDefined();

    const otpSession = await OtpSession.findOne({ mobile: testMobile, used: false });
    expect(otpSession).not.toBeNull();
    expect(otpSession.otp).toBeDefined();
  });

  test('Verify with correct OTP succeeds and returns JWT tokens', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const rawOtp = regRes.body.data.devOtp;

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ mobile: testMobile, otp: rawOtp });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.mobile).toBe(testMobile);
  });

  test('Verify with wrong OTP fails and decrements attempts', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ mobile: testMobile, otp: '000000' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    const otpSession = await OtpSession.findOne({ mobile: testMobile, used: false });
    expect(otpSession.attempts).toBe(1);
  });

  test('OTP locks out after OTP_MAX_ATTEMPTS wrong tries', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: '000000' });
    }

    const lockRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ mobile: testMobile, otp: '000000' });

    expect(lockRes.statusCode).toBe(429);
    expect(lockRes.body.message).toMatch(/locked/i);
  });

  test('Expired OTP is rejected', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const rawOtp = regRes.body.data.devOtp;

    // Set expiresAt in the past
    await OtpSession.updateOne(
      { mobile: testMobile, used: false },
      { expiresAt: new Date(Date.now() - 60000) }
    );

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ mobile: testMobile, otp: rawOtp });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  test('Logout invalidates the old access token via tokenVersion', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const rawOtp = regRes.body.data.devOtp;

    const authRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ mobile: testMobile, otp: rawOtp });

    const token = authRes.body.data.token;

    // Verify token works
    const meResBefore = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meResBefore.statusCode).toBe(200);

    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.statusCode).toBe(200);

    // Token should now be invalid
    const meResAfter = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meResAfter.statusCode).toBe(401);
  });

  test('Refresh token flow issues a new working access token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const rawOtp = regRes.body.data.devOtp;

    const authRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ mobile: testMobile, otp: rawOtp });

    const refreshToken = authRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken });

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body.data.token).toBeDefined();

    const newAccessToken = refreshRes.body.data.token;
    const meRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${newAccessToken}`);
    expect(meRes.statusCode).toBe(200);
  });
});
