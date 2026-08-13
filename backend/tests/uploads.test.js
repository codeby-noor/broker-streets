const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const jwtService = require('../src/services/jwt.service');

describe('Upload Validation & Security', () => {
  let user, token;

  beforeEach(async () => {
    user = await User.create({
      name: 'Uploader User',
      mobile: '9876543210',
      city: 'Ahmedabad',
    });
    token = jwtService.generateAccessToken({ id: user._id, role: 'user', tokenVersion: 0 });
  });

  test('A file with a spoofed extension/MIME (e.g. a .txt file renamed to .jpg) is rejected by magic-byte check', async () => {
    // Plain text content disguised as image/jpeg
    const spoofedBuffer = Buffer.from('This is a plain text file pretending to be a JPG image');

    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', spoofedBuffer, {
        filename: 'fake_image.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.statusCode).toBe(415);
    expect(res.body.message).toMatch(/magic byte/i);
  });

  test('An oversized file is rejected', async () => {
    // Valid JPEG magic bytes header followed by oversized dummy data (> 5MB)
    const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    const padding = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const oversizedJpgBuffer = Buffer.concat([header, padding]);

    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', oversizedJpgBuffer, {
        filename: 'huge_image.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.statusCode).toBe(413);
  });
});
