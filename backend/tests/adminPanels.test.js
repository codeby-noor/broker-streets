const request = require('supertest');
const app = require('../src/app');
const AdminUser = require('../src/models/AdminUser');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const BuyerLead = require('../src/models/BuyerLead');
const SellerLead = require('../src/models/SellerLead');
const Enquiry = require('../src/models/Enquiry');
const AdminActivityLog = require('../src/models/AdminActivityLog');
const jwtService = require('../src/services/jwt.service');

describe('Admin Panels Functionality (Stats, Users, Seller Leads, Activity Logs)', () => {
  let superAdmin, regularAdmin, testUser;
  let superAdminToken, regularAdminToken;

  beforeEach(async () => {
    superAdmin = await AdminUser.create({
      mobile: '9876543210',
      name: 'Super Admin',
      role: 'superadmin',
      isActive: true,
      tokenVersion: 0,
    });
    superAdminToken = jwtService.generateAccessToken(superAdmin);

    regularAdmin = await AdminUser.create({
      mobile: '9123456780',
      name: 'Regular Admin',
      role: 'admin',
      isActive: true,
      tokenVersion: 0,
    });
    regularAdminToken = jwtService.generateAccessToken(regularAdmin);

    testUser = await User.create({
      name: 'Test Site User',
      mobile: '9876500001',
      email: 'siteuser@example.com',
      city: 'Surat',
      district: 'Surat',
      role: 'user',
      isActive: true,
    });
  });

  test('GET /api/admin/dashboard/stats returns correct platform aggregates', async () => {
    // Seed listing
    await Listing.create({
      userId: testUser._id,
      title: 'Farmland in Surat',
      district: 'Surat',
      type: 'Agricultural Land',
      priceUnit: 'Vigha',
      priceAmount: 1500000,
      status: 'Available',
    });

    await Listing.create({
      userId: testUser._id,
      title: 'Sold Plot in Kamrej',
      district: 'Surat',
      type: 'Non-Agricultural Land',
      priceUnit: 'Vigha',
      priceAmount: 2500000,
      status: 'Sold',
    });

    // Seed buyer lead
    await BuyerLead.create({
      userId: testUser._id,
      userName: testUser.name,
      userMobile: testUser.mobile,
      district: 'Surat',
      taluka: 'Kamrej',
      preferredVillages: ['Kamrej', 'Bardoli'],
      propertyType: 'Agricultural Land',
      purpose: 'Investment',
    });

    // Seed seller lead
    await SellerLead.create({
      userId: testUser._id,
      district: 'Surat',
      type: 'Agricultural Land',
      status: 'New',
    });

    // Seed enquiry
    await Enquiry.create({
      buyerName: 'Buyer Person',
      message: 'Interested in this property',
    });

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProperties).toBe(2);
    expect(res.body.data.availableProperties).toBe(1);
    expect(res.body.data.soldProperties).toBe(1);
    expect(res.body.data.totalBuyers).toBe(1);
    expect(res.body.data.totalSellers).toBe(1);
    expect(res.body.data.totalEnquiries).toBe(1);
    expect(res.body.data.registeredUsers).toBe(1);
  });

  test('Admin Users: GET /api/admin/users and PATCH /api/admin/users/:id/status', async () => {
    // List users
    const listRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.meta.total).toBe(1);

    // Get user detail
    const detailRes = await request(app)
      .get(`/api/admin/users/${testUser._id}`)
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.data.name).toBe('Test Site User');

    // Deactivate user
    const toggleRes = await request(app)
      .patch(`/api/admin/users/${testUser._id}/status`)
      .set('Authorization', `Bearer ${regularAdminToken}`)
      .send({ isActive: false });

    expect(toggleRes.statusCode).toBe(200);
    expect(toggleRes.body.data.isActive).toBe(false);

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.isActive).toBe(false);
    expect(updatedUser.tokenVersion).toBe(1); // tokenVersion incremented on deactivation
  });

  test('Admin Seller Leads: Full CRUD and status management', async () => {
    // Create seller lead
    const lead = await SellerLead.create({
      userId: testUser._id,
      userName: testUser.name,
      userMobile: testUser.mobile,
      district: 'Navsari',
      subDistrict: 'Gandevi',
      village: 'Bilimora',
      type: 'Agricultural Land',
      status: 'New',
    });

    // List seller leads
    const listRes = await request(app)
      .get('/api/admin/seller-leads')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBe(1);

    // Get detail
    const detailRes = await request(app)
      .get(`/api/admin/seller-leads/${lead._id}`)
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.data.district).toBe('Navsari');

    // Update status
    const statusRes = await request(app)
      .patch(`/api/admin/seller-leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${regularAdminToken}`)
      .send({ status: 'Approved' });

    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.data.status).toBe('Approved');

    // Delete seller lead
    const deleteRes = await request(app)
      .delete(`/api/admin/seller-leads/${lead._id}`)
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(deleteRes.statusCode).toBe(204);

    const check = await SellerLead.findById(lead._id);
    expect(check).toBeNull();
  });

  test('Admin Activity Logs: Superadmin can view activity logs, regular admin is denied', async () => {
    // Seed some activity logs
    await AdminActivityLog.create({
      adminId: superAdmin._id,
      mobile: superAdmin.mobile,
      name: superAdmin.name,
      role: 'superadmin',
      type: 'login',
      status: 'Login',
    });

    await AdminActivityLog.create({
      adminId: regularAdmin._id,
      mobile: regularAdmin.mobile,
      name: regularAdmin.name,
      role: 'admin',
      type: 'logout',
      status: 'Logout',
    });

    // Superadmin fetches logs
    const superRes = await request(app)
      .get('/api/admin/activity')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(superRes.statusCode).toBe(200);
    expect(superRes.body.data.length).toBe(2);
    expect(superRes.body.meta.total).toBe(2);

    // Filter by mobile
    const filteredRes = await request(app)
      .get(`/api/admin/activity?mobile=${regularAdmin.mobile}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(filteredRes.statusCode).toBe(200);
    expect(filteredRes.body.data.length).toBe(1);
    expect(filteredRes.body.data[0].mobile).toBe(regularAdmin.mobile);

    // Regular admin is forbidden (superadmin only)
    const forbiddenRes = await request(app)
      .get('/api/admin/activity')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(forbiddenRes.statusCode).toBe(403);
  });
});
