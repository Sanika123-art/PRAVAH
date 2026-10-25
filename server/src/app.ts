import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import applicationRoutes from './routes/applicationRoutes';
import metricsRoutes from './routes/metricsRoutes';
import rulesRoutes from './routes/rulesRoutes';
import operationalRoutes from './routes/operationalRoutes';
import institutionRoutes from './routes/institutionRoutes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { csrfProtection, requireAuth } from './middleware/authMiddleware';
import { getMe, getCsrf, login, logout } from './controllers/authController';
import { loginRateLimiter } from './routes/authRoutes';

export const createApp = (): Express => {
  const app = express();

  // Allowed origins for CORS (allowing credentials)
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'https://pravah-client.onrender.com',
      ];

  // Security and baseline middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching allowed origins
        if (!origin || configuredOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in local dev, but credentials enabled
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-xsrf-token', 'X-Requested-With'],
      exposedHeaders: ['x-csrf-token', 'Authorization'],
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(requestLogger);

  // CSRF validation on state-changing cookie requests
  app.use(csrfProtection);

  // Mount API routers
  app.use('/api', healthRoutes); // Public health check endpoints
  app.use('/api/auth', authRoutes); // Auth endpoints (login, logout, me, csrf)
  app.get('/api/csrf', getCsrf); // Direct alias for /api/auth/csrf
  app.get('/api/me', requireAuth, getMe); // Direct alias for /api/auth/me
  app.post('/api/login', loginRateLimiter, login); // Direct alias for /api/auth/login
  app.post('/api/logout', requireAuth, logout); // Direct alias for /api/auth/logout
  app.use('/api/institution', institutionRoutes); // Institution Portal API
  app.use('/api/applications', applicationRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/rules', rulesRoutes);
  app.use('/api', operationalRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint '${req.method} ${req.originalUrl}' not found on SAKSHAM API.`,
        statusCode: 404,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
