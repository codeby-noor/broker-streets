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
const listingRoutes = require('./routes/listing.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminPropertyRoutes = require('./routes/admin/admin.property.routes');
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/ApiResponse');
const { HTTP_STATUS } = require('./utils/constants');

const app = express();

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

const authenticateToken = require('./middleware/auth.middleware');

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

// Property module routes
app.use('/api/listings', listingRoutes);
app.use('/api/uploads', uploadRoutes);

// Admin property routes
app.use('/api/admin/properties', adminPropertyRoutes);

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
