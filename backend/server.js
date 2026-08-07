const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start HTTP Server
    server = app.listen(env.port, () => {
      logger.info(`Server running in [${env.nodeEnv}] mode on port ${env.port}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown Handler
const handleGracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});
