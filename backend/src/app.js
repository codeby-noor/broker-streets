const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const corsOptions = require('./config/cors');
const env = require('./config/env');
const { apiRateLimiter } = require('./middleware/rateLimiter.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
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

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// After (working):
app.use('/api', apiRateLimiter);

// Mount auth routes on both the documented /api/auth prefix and the
// legacy /auth prefix for backward compatibility.
app.use(['/auth', '/api/auth'], authRoutes);

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
