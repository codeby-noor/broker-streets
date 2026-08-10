const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/broker-streets',
  corsOrigin: process.env.CORS_ORIGIN || 'http://127.0.0.1:4173',
  jwtSecret: process.env.JWT_SECRET || 'brokerstreets_jwt_secret_key_2026_dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'brokerstreets_jwt_refresh_secret_key_2026_dev',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  otpLength: parseInt(process.env.OTP_LENGTH || '6', 10),
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  otpLockMinutes: parseInt(process.env.OTP_LOCK_MINUTES || '10', 10),
  enableRealSms: process.env.ENABLE_REAL_SMS === 'true',
  smsProvider: process.env.SMS_PROVIDER || 'msg91',
  smsApiKey: process.env.SMS_API_KEY || '',
  smsSenderId: process.env.SMS_SENDER_ID || 'BRKRST',
  smsTemplateId: process.env.SMS_TEMPLATE_ID || '',
  uploadProvider: process.env.UPLOAD_PROVIDER || 'local',
  uploadMaxImageSizeMb: parseInt(process.env.UPLOAD_MAX_IMAGE_SIZE_MB || '5', 10),
  uploadMaxVideoSizeMb: parseInt(process.env.UPLOAD_MAX_VIDEO_SIZE_MB || '50', 10),
  uploadMaxDocumentSizeMb: parseInt(process.env.UPLOAD_MAX_DOCUMENT_SIZE_MB || '10', 10),
  uploadMaxAudioSizeMb: parseInt(process.env.UPLOAD_MAX_AUDIO_SIZE_MB || '10', 10),
  uploadMaxProfileImageSizeMb: parseInt(process.env.UPLOAD_MAX_PROFILE_IMAGE_SIZE_MB || '2', 10),
  uploadAllowedImageTypes: (process.env.UPLOAD_ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  uploadAllowedVideoTypes: (process.env.UPLOAD_ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm').split(','),
  uploadAllowedDocumentTypes: (process.env.UPLOAD_ALLOWED_DOCUMENT_TYPES || 'application/pdf,image/jpeg,image/png,image/webp').split(','),
  uploadAllowedAudioTypes: (process.env.UPLOAD_ALLOWED_AUDIO_TYPES || 'audio/webm,audio/mp3,audio/mpeg,audio/wav').split(','),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  adminDefaultEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@brokerstreets.com',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123',
};


const requiredEnvVars = ['MONGODB_URI'];
if (env.nodeEnv === 'production') {
  requiredEnvVars.push('JWT_SECRET', 'JWT_REFRESH_SECRET');
  if (env.uploadProvider === 'cloudinary') {
    requiredEnvVars.push('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET');
  }
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    if (env.nodeEnv === 'production') {
      throw new Error(`[FATAL] Missing mandatory environment variable in production: ${envVar}`);
    }
    console.warn(`[WARNING] Missing environment variable: ${envVar}. Using fallback default for development.`);
  }
}

module.exports = env;
