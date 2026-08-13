const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const SavedProperty = require('../src/models/SavedProperty');
const RecentlyViewed = require('../src/models/RecentlyViewed');
const Notification = require('../src/models/Notification');
const jwtService = require('../src/services/jwt.service');

describe('Phase 4 Modules (SavedProperty, RecentlyViewed, Notification)', () => {
  let user1, user2, token1, token2, listing1;

  beforeEach(async () => {
    user1 = await User.create({
      name: 'User One',
      mobile: '9876543210',
      email: 'user1@example.com',
      city: 'Ahmedabad',
    });
    token1 = jwtService.generateAccessToken({ id: user1._id, role: 'user', tokenVersion: 0 });

    user2 = await User.create({
      name: 'User Two',
      mobile: '9876543211',
      email: 'user2@example.com',
      city: 'Ahmedabad',
    });
    token2 = jwtService.generateAccessToken({ id: user2._id, role: 'user', tokenVersion: 0 });

    listing1 = await Listing.create({
      userId: user1._id,
      title: 'Sample Property',
      state: 'Gujarat',
      district: 'Anand',
      subDistrict: 'Anand',
      village: 'Mogri',
      type: 'Agricultural Land',
      priceUnit: 'Vigha',
      priceAmount: 450000,
      status: 'Available',
    });
  });

  test('Toggling save on the same listing twice unsaves it', async () => {
    // First save: saves property
    const saveRes = await request(app)
      .post('/api/saved-properties')
      .set('Authorization', `Bearer ${token1}`)
      .send({ listingId: listing1._id.toString() });

    expect(saveRes.statusCode).toBe(200);
    expect(saveRes.body.data.saved).toBe(true);

    // Check saved status
    const checkRes = await request(app)
      .get(`/api/saved-properties/${listing1._id}/check`)
      .set('Authorization', `Bearer ${token1}`);
    expect(checkRes.body.data.saved).toBe(true);

    // Second save: unsaves property
    const unsaveRes = await request(app)
      .post('/api/saved-properties')
      .set('Authorization', `Bearer ${token1}`)
      .send({ listingId: listing1._id.toString() });

    expect(unsaveRes.statusCode).toBe(200);
    expect(unsaveRes.body.data.saved).toBe(false);

    // Check saved status again
    const checkResAfter = await request(app)
      .get(`/api/saved-properties/${listing1._id}/check`)
      .set('Authorization', `Bearer ${token1}`);
    expect(checkResAfter.body.data.saved).toBe(false);
  });

  test('Saving the same listing twice concurrently doesn’t create duplicate rows (unique index holds)', async () => {
    // Attempt concurrent saves
    await Promise.allSettled([
      SavedProperty.create({ userId: user1._id, listingId: listing1._id }),
      SavedProperty.create({ userId: user1._id, listingId: listing1._id }),
    ]);

    const count = await SavedProperty.countDocuments({ userId: user1._id, listingId: listing1._id });
    expect(count).toBe(1);
  });

  test('Recently-viewed caps at 20 records and prunes the oldest', async () => {
    // Create 25 listings and view them in sequence
    const listings = [];
    for (let i = 0; i < 25; i++) {
      const l = await Listing.create({
        userId: user2._id,
        title: `Property ${i}`,
        state: 'Gujarat',
        district: 'Anand',
        subDistrict: 'Anand',
        village: 'Mogri',
        type: 'Agricultural Land',
        priceUnit: 'Vigha',
        priceAmount: 500000,
      });
      listings.push(l);
    }

    const recentlyViewedService = require('../src/services/recentlyViewed.service');
    for (let i = 0; i < 25; i++) {
      await recentlyViewedService.recordView(user1._id, listings[i]._id);
    }

    const listRes = await request(app)
      .get('/api/recently-viewed')
      .set('Authorization', `Bearer ${token1}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBe(20);

    // Oldest listings (0 to 4) should have been pruned
    const viewedListingIds = listRes.body.data.map((item) => item.listing.id);
    expect(viewedListingIds).toContain(listings[24]._id.toString());
    expect(viewedListingIds).not.toContain(listings[0]._id.toString());
  });

  test('Notifications: creating a buyer lead produces a notification for that user', async () => {
    const leadRes = await request(app)
      .post('/api/buyer-leads')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        district: 'Anand',
        taluka: 'Anand',
        preferredVillages: ['Mogri', 'Karamsad'],
        propertyType: 'Agricultural Land',
        purpose: 'Personal Farm',
      });

    expect(leadRes.statusCode).toBe(201);

    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token1}`);

    expect(notifRes.statusCode).toBe(200);
    expect(notifRes.body.data.length).toBeGreaterThan(0);
    expect(notifRes.body.data[0].category).toBe('buyer');
  });

  test('markAsRead only affects the calling user’s own notifications (regression test for Phase 1 fix)', async () => {
    // Global notification
    const globalNotif = await Notification.create({
      userId: null,
      type: 'Global Announcement',
      message: 'System maintenance scheduled',
      category: 'general',
    });

    // User 1's notification
    const user1Notif = await Notification.create({
      userId: user1._id,
      type: 'User Alert',
      message: 'Your property was viewed',
      category: 'general',
    });

    // User 2 attempts to mark global notification as read -> should return 404 (not allowed to mutate global document)
    const mutateGlobalRes = await request(app)
      .patch(`/api/notifications/${globalNotif._id}/read`)
      .set('Authorization', `Bearer ${token2}`);
    expect(mutateGlobalRes.statusCode).toBe(404);

    // User 2 attempts to mark User 1's notification as read -> 404
    const mutateUser1NotifRes = await request(app)
      .patch(`/api/notifications/${user1Notif._id}/read`)
      .set('Authorization', `Bearer ${token2}`);
    expect(mutateUser1NotifRes.statusCode).toBe(404);

    // User 1 marks own notification as read -> 200
    const ownerMutateRes = await request(app)
      .patch(`/api/notifications/${user1Notif._id}/read`)
      .set('Authorization', `Bearer ${token1}`);
    expect(ownerMutateRes.statusCode).toBe(200);
    expect(ownerMutateRes.body.data.read).toBe(true);
  });

  test('markAllAsRead doesn’t affect another user’s notifications', async () => {
    const user1Notif = await Notification.create({
      userId: user1._id,
      type: 'User 1 Alert',
      message: 'Alert 1',
      read: false,
    });

    const user2Notif = await Notification.create({
      userId: user2._id,
      type: 'User 2 Alert',
      message: 'Alert 2',
      read: false,
    });

    // User 1 marks all as read
    await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token1}`);

    // User 1's notification is read
    const updatedUser1Notif = await Notification.findById(user1Notif._id);
    expect(updatedUser1Notif.read).toBe(true);

    // User 2's notification remains unread
    const updatedUser2Notif = await Notification.findById(user2Notif._id);
    expect(updatedUser2Notif.read).toBe(false);
  });
});
