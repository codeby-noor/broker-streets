const request = require('supertest');
const app = require('../src/app');
const AdminUser = require('../src/models/AdminUser');
const AdminActivityLog = require('../src/models/AdminActivityLog');
const OtpSession = require('../src/models/OtpSession');
const jwtService = require('../src/services/jwt.service');

describe('Admin Authentication & Workflows', () => {
  let superAdmin, regularAdmin;

  beforeEach(async () => {
    // Create Super Admin
    superAdmin = await AdminUser.create({
      mobile: '9876543210',
      name: 'Super Admin',
      role: 'superadmin',
      isActive: true,
      tokenVersion: 0,
    });

    // Create Regular Admin
    regularAdmin = await AdminUser.create({
      mobile: '9123456780',
      name: 'Regular Admin',
      role: 'admin',
      isActive: true,
      addedBy: superAdmin._id,
      tokenVersion: 0,
    });
  });

  test('bootstrapDefaultSuperAdmin creates the initial superadmin if none exists', async () => {
    await AdminUser.deleteMany({});
    expect(await AdminUser.countDocuments()).toBe(0);

    await AdminUser.bootstrapDefaultSuperAdmin();

    const created = await AdminUser.findOne({ role: 'superadmin' });
    expect(created).toBeDefined();
    expect(created.mobile).toBe('9876543210');
    expect(created.name).toBe('Super Admin');
    expect(created.tokenVersion).toBe(0);
  });

  test('POST /api/admin/auth/send-otp succeeds for authorized active admin mobile', async () => {
    const res = await request(app)
      .post('/api/admin/auth/send-otp')
      .send({ mobile: '9876543210' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mobile).toBe('9876543210');
    expect(res.body.data.expiresAt).toBeDefined();
  });

  test('POST /api/admin/auth/send-otp rejects unauthorized mobile with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/auth/send-otp')
      .send({ mobile: '9999999999' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not authorized for admin access');
  });

  test('POST /api/admin/auth/send-otp rejects deactivated admin with 403 Forbidden', async () => {
    regularAdmin.isActive = false;
    await regularAdmin.save();

    const res = await request(app)
      .post('/api/admin/auth/send-otp')
      .send({ mobile: regularAdmin.mobile });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/admin/auth/verify-otp issues tokens, updates lastLogin, and writes AdminActivityLog', async () => {
    // Send OTP first
    const sendRes = await request(app)
      .post('/api/admin/auth/send-otp')
      .send({ mobile: superAdmin.mobile });
    const rawOtp = sendRes.body.data.devOtp;

    const res = await request(app)
      .post('/api/admin/auth/verify-otp')
      .send({ mobile: superAdmin.mobile, otp: rawOtp });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.mobile).toBe(superAdmin.mobile);
    expect(res.body.data.user.role).toBe('superadmin');

    // Verify lastLogin was updated
    const updatedAdmin = await AdminUser.findById(superAdmin._id);
    expect(updatedAdmin.lastLogin).not.toBeNull();

    // Verify activity log was created
    const activityLog = await AdminActivityLog.findOne({
      adminId: superAdmin._id,
      type: 'login',
    });
    expect(activityLog).toBeDefined();
    expect(activityLog.mobile).toBe(superAdmin.mobile);
    expect(activityLog.role).toBe('superadmin');
  });

  test('Admin token can access protected admin routes (fixes tokenVersion bug)', async () => {
    const adminToken = jwtService.generateAccessToken(regularAdmin);

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Admin logout revokes token via tokenVersion increment', async () => {
    const adminToken = jwtService.generateAccessToken(regularAdmin);

    // Call protected route - should succeed
    const preLogoutRes = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(preLogoutRes.statusCode).toBe(200);

    // Call logout
    const logoutRes = await request(app)
      .post('/api/admin/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(logoutRes.statusCode).toBe(200);

    // Verify logout activity log
    const logoutLog = await AdminActivityLog.findOne({
      adminId: regularAdmin._id,
      type: 'logout',
    });
    expect(logoutLog).toBeDefined();

    // Call protected route again with old token - must be rejected
    const postLogoutRes = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(postLogoutRes.statusCode).toBe(401);
    expect(postLogoutRes.body.message).toContain('revoked');
  });

  test('POST /api/admin/auth/refresh-token provides new access tokens', async () => {
    const refreshToken = jwtService.generateRefreshToken(regularAdmin);

    const res = await request(app)
      .post('/api/admin/auth/refresh-token')
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Verify the new access token works on protected route
    const testRes = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${res.body.data.accessToken}`);
    expect(testRes.statusCode).toBe(200);
  });
});
