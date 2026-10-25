import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createApp } from './app';
import { initializeDemoAccounts } from './db/seedDemoUsers';

const PORT = process.env.PORT || 5000;
const app = createApp();

const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(` SAKSHAM API Server running on port ${PORT}`);
  console.log(` Health Probe:   http://localhost:${PORT}/api/health`);
  console.log(` Readiness:      http://localhost:${PORT}/api/health/ready`);
  console.log(` Metrics API:    http://localhost:${PORT}/api/metrics`);
  console.log(` Applications:   http://localhost:${PORT}/api/applications`);
  console.log(`=======================================================`);

  // Ensure AICTE Officer demo accounts are safely populated and valid in PostgreSQL
  await initializeDemoAccounts();
});

const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down SAKSHAM API gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
