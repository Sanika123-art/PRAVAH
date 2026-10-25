import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { initializeDemoAccounts } from '../db/seedDemoUsers';
import { prisma } from '../db/prisma';

async function run() {
  console.log('--- Initializing AICTE Officer Demo Accounts ---');
  await initializeDemoAccounts();
  console.log('--- Completed Demo Accounts Initialization ---');
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Failed to initialize demo accounts:', err);
  process.exit(1);
});
