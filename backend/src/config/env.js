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
};


const requiredEnvVars = ['MONGODB_URI'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`[WARNING] Missing environment variable: ${envVar}. Using fallback default.`);
  }
}

module.exports = env;
