const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const path = require('path');
const corsOptions = require('./config/cors');
const env = require('./config/env');
const { apiRateLimiter } = require('./middleware/rateLimiter.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const listingRoutes = require('./routes/listing.routes');
const buyerLeadRoutes = require('./routes/buyerLead.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const uploadRoutes = require('./routes/upload.routes');
// Items 4, 5, 6: Require Phase 4 module routes
const savedPropertyRoutes = require('./routes/savedProperty.routes');
const recentlyViewedRoutes = require('./routes/recentlyViewed.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminAuthRoutes = require('./routes/admin/admin.auth.routes');
const adminPropertyRoutes = require('./routes/admin/admin.property.routes');
const adminBuyerLeadRoutes = require('./routes/admin/admin.buyerLead.routes');
const adminEnquiryRoutes = require('./routes/admin/admin.enquiry.routes');
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/ApiResponse');
const { HTTP_STATUS } = require('./utils/constants');

const app = express();

// Trust proxy header for Railway / reverse proxies
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors(corsOptions));

// Request logging
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Item 2: Removed unused authenticateToken import (routes handle their own auth)

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'ignore',
    index: false,
  })
);

// Rate limiting for API endpoints
app.use('/api', apiRateLimiter);

// Mount auth routes on both the documented /api/auth prefix and the
// legacy /auth prefix for backward compatibility.
app.use(['/auth', '/api/auth'], authRoutes);

// User profile routes
app.use('/api/users', userRoutes);

// Property module routes
app.use('/api/listings', listingRoutes);
app.use('/api/buyer-leads', buyerLeadRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/uploads', uploadRoutes);

// Phase 4 module routes (Items 4, 5, 6)
app.use('/api/saved-properties', savedPropertyRoutes);
app.use('/api/recently-viewed', recentlyViewedRoutes);
app.use('/api/notifications', notificationRoutes);

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/properties', adminPropertyRoutes);
app.use('/api/admin/buyer-leads', adminBuyerLeadRoutes);
app.use('/api/admin/enquiries', adminEnquiryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {

  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { status: 'healthy', timestamp: new Date().toISOString() }, 'Server is healthy'));
});

app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { status: 'healthy', timestamp: new Date().toISOString() }, 'API is healthy'));
});

// Handle 404 routes
app.use((req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
