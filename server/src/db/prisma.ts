import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

let lastDbCheckTime = 0;
let cachedDbOnline: boolean | null = null;

export const isDatabaseAvailable = async (): Promise<boolean> => {
  const now = Date.now();
  if (cachedDbOnline !== null && now - lastDbCheckTime < 15000) {
    return cachedDbOnline;
  }
  lastDbCheckTime = now;
  try {
    await prisma.$queryRaw`SELECT 1`;
    cachedDbOnline = true;
    return true;
  } catch {
    cachedDbOnline = false;
    return false;
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  return isDatabaseAvailable();
};

