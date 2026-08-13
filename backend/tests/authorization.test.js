const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const BuyerLead = require('../src/models/BuyerLead');
const jwtService = require('../src/services/jwt.service');

describe('Authorization & Access Control', () => {
  let user1, user2, adminUser;
  let token1, token2, adminToken;
  let listing1, buyerLead1;

  beforeEach(async () => {
    // Create User 1
    user1 = await User.create({
      name: 'Owner User',
      mobile: '9876543210',
      email: 'owner@example.com',
      city: 'Ahmedabad',
      role: 'user',
    });
    token1 = jwtService.generateAccessToken({ id: user1._id, role: user1.role, tokenVersion: user1.tokenVersion });

    // Create User 2
    user2 = await User.create({
      name: 'Other User',
      mobile: '9876543211',
      email: 'other@example.com',
      city: 'Ahmedabad',
      role: 'user',
    });
    token2 = jwtService.generateAccessToken({ id: user2._id, role: user2.role, tokenVersion: user2.tokenVersion });

    // Create Admin User
    adminUser = await User.create({
      name: 'Admin User',
      mobile: '9876543212',
      email: 'admin@example.com',
      city: 'Ahmedabad',
      role: 'admin',
    });
    adminToken = jwtService.generateAccessToken({ id: adminUser._id, role: adminUser.role, tokenVersion: adminUser.tokenVersion });

    // Create Listing owned by User 1
    listing1 = await Listing.create({
      userId: user1._id,
      title: 'Agricultural Land in Anand',
      state: 'Gujarat',
      district: 'Anand',
      subDistrict: 'Anand',
      village: 'Mogri',
      type: 'Agricultural Land',
      priceUnit: 'Vigha',
      priceAmount: 500000,
      status: 'Available',
    });

    // Create Buyer Lead owned by User 1
    buyerLead1 = await BuyerLead.create({
      userId: user1._id,
      userName: user1.name,
      userMobile: user1.mobile,
      userEmail: user1.email,
      state: 'Gujarat',
      district: 'Anand',
      taluka: 'Anand',
      preferredVillages: ['Mogri', 'Karamsad'],
      propertyType: 'Agricultural Land',
      purpose: 'Personal Farm',
      requirements: 'Need 5 acres',
      voiceRecording: '/uploads/audio/recording.mp3',
    });
  });

  test("A second user cannot update/delete a listing they don't own", async () => {
    // User 2 attempts to update User 1's listing
    const updateRes = await request(app)
      .put(`/api/listings/${listing1._id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked Title' });

    expect(updateRes.statusCode).toBe(403);

    // User 2 attempts to delete User 1's listing
    const deleteRes = await request(app)
      .delete(`/api/listings/${listing1._id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(deleteRes.statusCode).toBe(403);
  });

  test("A second user cannot see another user's buyer-lead contact fields on list/detail endpoints", async () => {
    // User 2 gets buyer leads list
    const listRes = await request(app)
      .get('/api/buyer-leads')
      .set('Authorization', `Bearer ${token2}`);

    expect(listRes.statusCode).toBe(200);
    const targetLeadInList = listRes.body.data.find((l) => l.id === buyerLead1._id.toString());
    expect(targetLeadInList).toBeDefined();
    expect(targetLeadInList.userMobile).toBeUndefined();
    expect(targetLeadInList.userEmail).toBeUndefined();
    expect(targetLeadInList.voiceRecording).toBeUndefined();

    // User 2 gets single buyer lead detail
    const detailRes = await request(app)
      .get(`/api/buyer-leads/${buyerLead1._id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.data.userMobile).toBeUndefined();
    expect(detailRes.body.data.userEmail).toBeUndefined();
    expect(detailRes.body.data.voiceRecording).toBeUndefined();
  });

  test('The lead owner and an admin CAN see contact fields', async () => {
    // Lead owner gets detail
    const ownerRes = await request(app)
      .get(`/api/buyer-leads/${buyerLead1._id}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(ownerRes.statusCode).toBe(200);
    expect(ownerRes.body.data.userMobile).toBe(user1.mobile);
    expect(ownerRes.body.data.userEmail).toBe(user1.email);
    expect(ownerRes.body.data.voiceRecording).toBe('/uploads/audio/recording.mp3');

    // Admin gets detail
    const adminRes = await request(app)
      .get(`/api/buyer-leads/${buyerLead1._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.body.data.userMobile).toBe(user1.mobile);
    expect(adminRes.body.data.userEmail).toBe(user1.email);
  });

  test('A non-admin hitting any /api/admin/* route gets 403', async () => {
    const res = await request(app)
      .get('/api/admin/properties')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(403);
  });
});
