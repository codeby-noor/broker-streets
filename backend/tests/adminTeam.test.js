const request = require('supertest');
const app = require('../src/app');
const AdminUser = require('../src/models/AdminUser');
const User = require('../src/models/User');
const jwtService = require('../src/services/jwt.service');

describe('Super Admin Team Management (/api/admin/team)', () => {
  let superAdmin, regularAdmin, standardUser;
  let superAdminToken, regularAdminToken, standardUserToken;

  beforeEach(async () => {
    // Superadmin
    superAdmin = await AdminUser.create({
      mobile: '9876543210',
      name: 'Primary Super Admin',
      role: 'superadmin',
      isActive: true,
      tokenVersion: 0,
    });
    superAdminToken = jwtService.generateAccessToken(superAdmin);

    // Regular admin
    regularAdmin = await AdminUser.create({
      mobile: '9123456780',
      name: 'Regular Admin 1',
      role: 'admin',
      isActive: true,
      addedBy: superAdmin._id,
      tokenVersion: 0,
    });
    regularAdminToken = jwtService.generateAccessToken(regularAdmin);

    // Standard user
    standardUser = await User.create({
      mobile: '9876500001',
      name: 'Standard User',
      city: 'Ahmedabad',
      role: 'user',
      isActive: true,
    });
    standardUserToken = jwtService.generateAccessToken(standardUser);
  });

  test('Superadmin can view the admin team list', async () => {
    const res = await request(app)
      .get('/api/admin/team')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('Regular admin hitting /api/admin/team gets 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/team')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('Super admin authorization required');
  });

  test('Non-admin user hitting /api/admin/team gets 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/team')
      .set('Authorization', `Bearer ${standardUserToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Superadmin can add a new admin team member', async () => {
    const res = await request(app)
      .post('/api/admin/team')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        mobile: '9988776655',
        name: 'New Admin Member',
        role: 'admin',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mobile).toBe('9988776655');
    expect(res.body.data.name).toBe('New Admin Member');
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.addedBy).toBeDefined();

    // Verify it exists in database
    const inDb = await AdminUser.findOne({ mobile: '9988776655' });
    expect(inDb).toBeDefined();
  });

  test('Reject adding admin with duplicate mobile with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/admin/team')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        mobile: '9123456780', // already exists
        name: 'Duplicate Admin',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toContain('already exists');
  });

  test('Superadmin can toggle status of regular admin', async () => {
    const res = await request(app)
      .patch(`/api/admin/team/${regularAdmin._id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ isActive: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isActive).toBe(false);

    const updated = await AdminUser.findById(regularAdmin._id);
    expect(updated.isActive).toBe(false);
  });

  test('Superadmin cannot deactivate own account (self-protection)', async () => {
    const res = await request(app)
      .patch(`/api/admin/team/${superAdmin._id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ isActive: false });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('cannot deactivate own account');
  });

  test('Superadmin cannot delete own account (self-protection)', async () => {
    const res = await request(app)
      .delete(`/api/admin/team/${superAdmin._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('cannot delete own account');
  });

  test('Cannot deactivate the last remaining active superadmin', async () => {
    // Create a 2nd superadmin
    const superAdmin2 = await AdminUser.create({
      mobile: '9777777777',
      name: 'Second Super Admin',
      role: 'superadmin',
      isActive: true,
      tokenVersion: 0,
    });
    const superAdmin2Token = jwtService.generateAccessToken(superAdmin2);

    // Deactivating superAdmin2 from superAdmin succeeds (2 active superadmins exist)
    const deact1 = await request(app)
      .patch(`/api/admin/team/${superAdmin2._id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ isActive: false });
    expect(deact1.statusCode).toBe(200);

    // Now superAdmin is the only remaining active superadmin (count is 1)
    // Further deactivation on superadmin returns 400
    const deactLast = await request(app)
      .patch(`/api/admin/team/${superAdmin2._id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ isActive: false });
    expect(deactLast.statusCode).toBe(400);
    expect(deactLast.body.message).toContain('last remaining active super admin');
  });

  test('Superadmin can delete a regular admin', async () => {
    const res = await request(app)
      .delete(`/api/admin/team/${regularAdmin._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.statusCode).toBe(204);

    const check = await AdminUser.findById(regularAdmin._id);
    expect(check).toBeNull();
  });
});
