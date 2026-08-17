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
    expect(detailRes.body.data.role).toBe('Buyer'); // default fallback

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

  test('Admin Users: role filter properly filters by derived roles (Buyer, Seller, Buyer & Seller)', async () => {
    // Clean existing testUser to have a controlled set
    await User.deleteMany({});

    // 1. Buyer-only user
    const buyerUser = await User.create({
      name: 'Buyer Only User',
      mobile: '9800000001',
      email: 'buyer@example.com',
      city: 'Surat',
    });
    await BuyerLead.create({
      userId: buyerUser._id,
      userName: buyerUser.name,
      userMobile: buyerUser.mobile,
      district: 'Surat',
      taluka: 'Bardoli',
      preferredVillages: ['Bardoli', 'Kamrej'],
      propertyType: 'Agricultural Land',
      purpose: 'Investment',
    });

    // 2. Seller-only user (via Listing, covering listing seller path)
    const sellerUser = await User.create({
      name: 'Seller Only User',
      mobile: '9800000002',
      email: 'seller@example.com',
      city: 'Navsari',
    });
    await Listing.create({
      userId: sellerUser._id,
      ownerMobile: sellerUser.mobile,
      title: 'Farmland in Navsari',
      district: 'Navsari',
      type: 'Agricultural Land',
      priceUnit: 'Vigha',
      priceAmount: 1200000,
      status: 'Available',
    });

    // 3. Buyer & Seller user (has both BuyerLead and Listing/SellerLead)
    const bothUser = await User.create({
      name: 'Both Buyer and Seller User',
      mobile: '9800000003',
      email: 'both@example.com',
      city: 'Bardoli',
    });
    await BuyerLead.create({
      userId: bothUser._id,
      userName: bothUser.name,
      userMobile: bothUser.mobile,
      district: 'Surat',
      taluka: 'Bardoli',
      preferredVillages: ['Bardoli', 'Kamrej'],
      propertyType: 'Agricultural Land',
      purpose: 'Personal Farm',
    });
    await SellerLead.create({
      userId: bothUser._id,
      userName: bothUser.name,
      userMobile: bothUser.mobile,
      district: 'Surat',
      type: 'Agricultural Land',
      status: 'New',
    });

    // 4. Neither user (no activity -> defaults to 'Buyer' for parity)
    const neitherUser = await User.create({
      name: 'Inactive User Neither',
      mobile: '9800000004',
      email: 'neither@example.com',
      city: 'Kamrej',
    });

    // Query with role=buyer -> should match buyerUser AND neitherUser (fallback default)
    const buyerRes = await request(app)
      .get('/api/admin/users?role=buyer')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(buyerRes.statusCode).toBe(200);
    const buyerIds = buyerRes.body.data.map((u) => u.id);
    expect(buyerIds).toContain(buyerUser._id.toString());
    expect(buyerIds).toContain(neitherUser._id.toString());
    expect(buyerIds).not.toContain(sellerUser._id.toString());
    expect(buyerIds).not.toContain(bothUser._id.toString());

    // Query with role=seller -> should match sellerUser only
    const sellerRes = await request(app)
      .get('/api/admin/users?role=seller')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(sellerRes.statusCode).toBe(200);
    expect(sellerRes.body.data.length).toBe(1);
    expect(sellerRes.body.data[0].id).toBe(sellerUser._id.toString());
    expect(sellerRes.body.data[0].role).toBe('Seller');

    // Query with role=buyer & seller -> should match bothUser only
    const bothRes = await request(app)
      .get('/api/admin/users?role=buyer%20%26%20seller')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(bothRes.statusCode).toBe(200);
    expect(bothRes.body.data.length).toBe(1);
    expect(bothRes.body.data[0].id).toBe(bothUser._id.toString());
    expect(bothRes.body.data[0].role).toBe('Buyer & Seller');
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

  test('Admin Activity Logs: Groups logs into unified sessions, supports status filtering, superadmin-only', async () => {
    // Session 1: SuperAdmin login only (Active session)
    await AdminActivityLog.create({
      sessionId: 'session-super-1',
      adminId: superAdmin._id,
      mobile: superAdmin.mobile,
      name: superAdmin.name,
      role: 'superadmin',
      type: 'login',
      status: 'Login',
      createdAt: new Date('2026-08-17T10:00:00Z'),
    });

    // Session 2: SuperAdmin login + logout (Closed session)
    await AdminActivityLog.create({
      sessionId: 'session-super-2',
      adminId: superAdmin._id,
      mobile: superAdmin.mobile,
      name: superAdmin.name,
      role: 'superadmin',
      type: 'login',
      status: 'Login',
      createdAt: new Date('2026-08-17T08:00:00Z'),
    });
    await AdminActivityLog.create({
      sessionId: 'session-super-2',
      adminId: superAdmin._id,
      mobile: superAdmin.mobile,
      name: superAdmin.name,
      role: 'superadmin',
      type: 'logout',
      status: 'Logout',
      createdAt: new Date('2026-08-17T09:00:00Z'),
    });

    // Session 3: RegularAdmin login only (Different admin, active session)
    await AdminActivityLog.create({
      sessionId: 'session-reg-1',
      adminId: regularAdmin._id,
      mobile: regularAdmin.mobile,
      name: regularAdmin.name,
      role: 'admin',
      type: 'login',
      status: 'Login',
      createdAt: new Date('2026-08-17T11:00:00Z'),
    });

    // Superadmin fetches all sessions
    const superRes = await request(app)
      .get('/api/admin/activity')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(superRes.statusCode).toBe(200);
    // Should have 3 grouped session rows, not 4 raw log entries
    expect(superRes.body.data.length).toBe(3);
    expect(superRes.body.meta.total).toBe(3);

    // Verify session-super-1 details (Login only)
    const sessionSuper1 = superRes.body.data.find((s) => s.id === 'session-super-1');
    expect(sessionSuper1).toBeDefined();
    expect(sessionSuper1.status).toBe('Login');
    expect(sessionSuper1.loginAt).not.toBeNull();
    expect(sessionSuper1.logoutAt).toBeNull();
    expect(sessionSuper1.mobile).toBe(superAdmin.mobile);

    // Verify session-super-2 details (Login + Logout)
    const sessionSuper2 = superRes.body.data.find((s) => s.id === 'session-super-2');
    expect(sessionSuper2).toBeDefined();
    expect(sessionSuper2.status).toBe('Logged Out');
    expect(sessionSuper2.loginAt).not.toBeNull();
    expect(sessionSuper2.logoutAt).not.toBeNull();

    // Verify session-reg-1 (Regular admin)
    const sessionReg1 = superRes.body.data.find((s) => s.id === 'session-reg-1');
    expect(sessionReg1).toBeDefined();
    expect(sessionReg1.mobile).toBe(regularAdmin.mobile);

    // Filter by status=Active -> returns only Login status sessions (session-reg-1 and session-super-1)
    const activeRes = await request(app)
      .get('/api/admin/activity?status=Active')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(activeRes.statusCode).toBe(200);
    expect(activeRes.body.data.length).toBe(2);
    expect(activeRes.body.data.every((s) => s.status === 'Login')).toBe(true);

    // Filter by status=Logged Out -> returns only session-super-2
    const loggedOutRes = await request(app)
      .get('/api/admin/activity?status=Logged%20Out')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(loggedOutRes.statusCode).toBe(200);
    expect(loggedOutRes.body.data.length).toBe(1);
    expect(loggedOutRes.body.data[0].id).toBe('session-super-2');
    expect(loggedOutRes.body.data[0].status).toBe('Logged Out');

    // Filter by mobile
    const filteredRes = await request(app)
      .get(`/api/admin/activity?mobile=${regularAdmin.mobile}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(filteredRes.statusCode).toBe(200);
    expect(filteredRes.body.data.length).toBe(1);
    expect(filteredRes.body.data[0].id).toBe('session-reg-1');

    // Regular admin is forbidden (superadmin only)
    const forbiddenRes = await request(app)
      .get('/api/admin/activity')
      .set('Authorization', `Bearer ${regularAdminToken}`);

    expect(forbiddenRes.statusCode).toBe(403);
  });
});
