import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../db/prisma';
import { hashPassword, verifyPassword } from '../utils/security';
import { initializeDemoAccounts } from '../db/seedDemoUsers';

function extractCookie(res: request.Response, prefix: string): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return '';
  const list = Array.isArray(cookies) ? cookies : [cookies];
  return list.find((c: string) => c.startsWith(prefix)) || '';
}

function extractAllCookies(res: request.Response): string[] {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  return Array.isArray(cookies) ? cookies : [cookies];
}

describe('SAKSHAM Authentication & Authorization (Phase 3A)', () => {
  const app = createApp();
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'AicteDev@2026!';

  beforeAll(async () => {
    // Synchronize all demo accounts (Officers + Institutions)
    await initializeDemoAccounts();

    // Ensure test users exist with known Argon2id hashed passwords
    const hashed = await hashPassword(demoPassword);

    await prisma.systemUser.upsert({
      where: { username: 'test.admin' },
      update: {
        passwordHash: hashed,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        id: 'usr-test-admin',
        username: 'test.admin',
        email: 'test.admin@aicte-india.org',
        fullName: 'Prof. Test Secretary',
        role: 'MEMBER_SECRETARY',
        department: 'Member Secretary Secretariat',
        passwordHash: hashed,
        isActive: true,
      },
    });

    await prisma.systemUser.upsert({
      where: { username: 'test.scrutiny' },
      update: {
        passwordHash: hashed,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        id: 'usr-test-scrutiny',
        username: 'test.scrutiny',
        email: 'test.scrutiny@aicte-india.org',
        fullName: 'Dr. Test Scrutiny Officer',
        role: 'SCRUTINY_OFFICER',
        department: 'Bureau of Approval',
        passwordHash: hashed,
        isActive: true,
      },
    });

    await prisma.systemUser.upsert({
      where: { username: 'test.ro' },
      update: {
        passwordHash: hashed,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        region: 'NORTHERN',
      },
      create: {
        id: 'usr-test-ro',
        username: 'test.ro',
        email: 'test.ro@aicte-india.org',
        fullName: 'Regional Officer North',
        role: 'REGIONAL_OFFICER',
        region: 'NORTHERN',
        department: 'Northern Regional Office',
        passwordHash: hashed,
        isActive: true,
      },
    });

    await prisma.systemUser.upsert({
      where: { username: 'test.disabled' },
      update: {
        passwordHash: hashed,
        isActive: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        id: 'usr-test-disabled',
        username: 'test.disabled',
        email: 'test.disabled@aicte-india.org',
        fullName: 'Deactivated User',
        role: 'SCRUTINY_OFFICER',
        passwordHash: hashed,
        isActive: false,
      },
    });
  });

  describe('Password Hashing & Integrity', () => {
    it('should hash passwords using Argon2id with secure memory and time parameters', async () => {
      const plain = 'TestPassword123!';
      const hash = await hashPassword(plain);

      expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536/);
      expect(await verifyPassword(hash, plain)).toBe(true);
      expect(await verifyPassword(hash, 'WrongPassword123!')).toBe(false);
    });
  });

  describe('Authentication Boundary: POST /api/auth/login', () => {
    it('should successfully authenticate valid officer credentials and set HttpOnly cookies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'test.admin',
          password: demoPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('test.admin');
      expect(res.body.data.user.role).toBe('MEMBER_SECRETARY');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');

      const tokenCookie = extractCookie(res, 'saksham_token=');
      expect(tokenCookie).toBeTruthy();
      expect(tokenCookie).toContain('HttpOnly');

      const csrfCookie = extractCookie(res, 'saksham_csrf_token=');
      expect(csrfCookie).toBeTruthy();
    });

    it('should reject invalid password with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'test.admin',
          password: 'IncorrectPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid username or password');
    });

    it('should reject non-existent username with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'unknown.ghost.user',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid username or password');
    });

    it('should reject deactivated account with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'test.disabled',
          password: demoPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('deactivated');
    });
  });

  describe('Session Verification & Restoration: GET /api/auth/me', () => {
    it('should restore session from valid HttpOnly saksham_token cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [tokenCookie]);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.username).toBe('test.admin');
      expect(meRes.body.data.user.role).toBe('MEMBER_SECRETARY');
    });

    it('should reject unauthenticated request to /api/auth/me with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject tampered or invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['saksham_token=tampered.token.value; Path=/']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Logout & Session Revocation: POST /api/auth/logout', () => {
    it('should clear cookies and invalidate token version in database', async () => {
      // 1. Log in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');
      const csrfCookie = extractCookie(loginRes, 'saksham_csrf_token=');
      const csrfToken = csrfCookie.split(';')[0].split('=')[1];

      // 2. Log out
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [tokenCookie, csrfCookie])
        .set('x-csrf-token', csrfToken);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify clear-cookie headers
      const logoutCookies = extractAllCookies(logoutRes);
      expect(logoutCookies.some((c: string) => c.includes('saksham_token=;'))).toBe(true);

      // 3. Attempting to use the old token must now be rejected (tokenVersion mismatch)
      const reuseRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [tokenCookie]);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error.message).toContain('invalidated');
    });
  });

  describe('Authoritative Server-Side RBAC Enforcement', () => {
    it('should permit MEMBER_SECRETARY to access /api/audit', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const auditRes = await request(app)
        .get('/api/audit')
        .set('Cookie', [tokenCookie]);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.success).toBe(true);
      expect(Array.isArray(auditRes.body.data)).toBe(true);
    });

    it('should forbid SCRUTINY_OFFICER from accessing /api/audit', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.scrutiny', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const auditRes = await request(app)
        .get('/api/audit')
        .set('Cookie', [tokenCookie]);

      expect(auditRes.status).toBe(403);
      expect(auditRes.body.success).toBe(false);
      expect(auditRes.body.error.message).toContain("Access forbidden for role 'SCRUTINY_OFFICER'");
    });

    it('should ignore role forgery attempts sent via request payload or headers', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.scrutiny', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const forgedRes = await request(app)
        .get('/api/audit')
        .set('Cookie', [tokenCookie])
        .set('X-User-Role', 'MEMBER_SECRETARY')
        .send({ role: 'MEMBER_SECRETARY', userRole: 'SYSTEM_ADMIN' });

      // Must remain forbidden because authoritative server session dictates permissions
      expect(forgedRes.status).toBe(403);
      expect(forgedRes.body.success).toBe(false);
    });
  });

  describe('Record-Level Regional Access Enforcement', () => {
    it('should prevent Regional Officer from accessing records from a different region', async () => {
      // Login as test.ro (NORTHERN region)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.ro', password: demoPassword });

      expect(loginRes.status).toBe(200);
      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      // Attempts to query WESTERN region records
      const foreignRes = await request(app)
        .get('/api/applications?region=WESTERN')
        .set('Cookie', [tokenCookie]);

      expect(foreignRes.status).toBe(403);
      expect(foreignRes.body.error.message).toContain('Jurisdiction violation');

      // Queries their own region records
      const ownRes = await request(app)
        .get('/api/applications?region=NORTHERN')
        .set('Cookie', [tokenCookie]);

      expect(ownRes.status).toBe(200);
      expect(ownRes.body.success).toBe(true);
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Protection', () => {
    it('should reject state-changing cookie requests missing x-csrf-token header', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');
      const csrfCookie = extractCookie(loginRes, 'saksham_csrf_token=');

      // Send POST without x-csrf-token header
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [tokenCookie, csrfCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('CSRF');
    });

    it('should reject state-changing cookie requests with mismatched x-csrf-token header', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');
      const csrfCookie = extractCookie(loginRes, 'saksham_csrf_token=');

      // Send POST with forged x-csrf-token header
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [tokenCookie, csrfCookie])
        .set('x-csrf-token', 'forged-token-value-12345678');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('CSRF');
    });
  });

  describe('AICTE Officer Portal Demo-Account Authentication & Role Validation', () => {
    it('should authenticate Scrutiny Officer by email and assign SCRUTINY_OFFICER role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'rk.sharma@aicte.gov.in', password: demoPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('SCRUTINY_OFFICER');
      expect(res.body.data.user.username).toBe('rk.sharma');
    });

    it('should authenticate Regional Officer by email and assign REGIONAL_OFFICER role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'neelesh.verma@aicte.gov.in', password: demoPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('REGIONAL_OFFICER');
      expect(res.body.data.user.username).toBe('neelesh.verma');
    });

    it('should authenticate EVC Expert by email and assign EVC_EXPERT role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'cm.rao@aicte.gov.in', password: demoPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('EVC_EXPERT');
      expect(res.body.data.user.username).toBe('cm.rao');
    });

    it('should authenticate Member Secretary by email and assign MEMBER_SECRETARY role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'rajendra.prasad@aicte.gov.in', password: demoPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('MEMBER_SECRETARY');
      expect(res.body.data.user.username).toBe('rajendra.prasad');
    });

    it('should allow officer authentication by username without domain suffix', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'neelesh.verma', password: demoPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('REGIONAL_OFFICER');
    });

    it('should reject officer demo login with an invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'rk.sharma@aicte.gov.in', password: 'WrongPassword!123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid username or password');
    });

    it('should safely self-repair a demo account with an outdated password hash', async () => {
      // Simulate outdated hash on rk.sharma
      await prisma.systemUser.update({
        where: { id: 'usr-scr-01' },
        data: {
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$c2FtcGxlc2FsdA$outdatedcorruptedhashvalue1234567890',
          failedLoginAttempts: 3,
        },
      });

      // Login with valid demo password should trigger safe self-repair
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'rk.sharma@aicte.gov.in', password: demoPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('SCRUTINY_OFFICER');

      // Verify repaired hash in database
      const repaired = await prisma.systemUser.findUnique({ where: { id: 'usr-scr-01' } });
      expect(repaired?.failedLoginAttempts).toBe(0);
      expect(repaired?.lockedUntil).toBeNull();
    });
  });

  describe('Production Cross-Origin & Bearer Token Authentication Regression', () => {
    it('returns token in login response and allows subsequent requests using Bearer token without cookies', async () => {
      // 1. Perform login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
      expect(typeof loginRes.body.data.token).toBe('string');
      expect(loginRes.body.data.token.length).toBeGreaterThan(20);

      const token = loginRes.body.data.token;

      // 2. GET /api/auth/me with Bearer token (no cookies attached)
      const authMeRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(authMeRes.status).toBe(200);
      expect(authMeRes.body.success).toBe(true);
      expect(authMeRes.body.data.user.username).toBe('test.admin');

      // 3. GET /api/me alias with Bearer token
      const meRes = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.username).toBe('test.admin');

      // 4. GET /api/metrics with Bearer token
      const metricsRes = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.success).toBe(true);
      expect(metricsRes.body.data.totalApplications).toBeDefined();

      // 5. GET /api/applications?limit=100 with Bearer token
      const appsRes = await request(app)
        .get('/api/applications?limit=100')
        .set('Authorization', `Bearer ${token}`);

      expect(appsRes.status).toBe(200);
      expect(appsRes.body.success).toBe(true);
      expect(Array.isArray(appsRes.body.data)).toBe(true);

      // 6. Anonymous request to /api/me should be rejected with 401
      const anonMeRes = await request(app).get('/api/me');
      expect(anonMeRes.status).toBe(401);
      expect(anonMeRes.body.success).toBe(false);
      expect(anonMeRes.body.error.message).toContain('Authentication required');

      // 7. Request with invalid Bearer token should be rejected with 401
      const invalidTokenRes = await request(app)
        .get('/api/me')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(invalidTokenRes.status).toBe(401);
      expect(invalidTokenRes.body.success).toBe(false);
    });
  });

  describe('Institutional Demo Accounts Authentication & Workflow Access', () => {
    it('authenticates Apex Institute demo account and accesses protected institution endpoints', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'director@apextech.ac.in',
          password: demoPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.role).toBe('INSTITUTION_USER');
      expect(loginRes.body.data.user.email).toBe('director@apextech.ac.in');
      expect(loginRes.body.data.user.permanentInstituteId).toBe('1-3489128');
      expect(loginRes.body.data.token).toBeDefined();

      const token = loginRes.body.data.token;

      // Access protected institution profile endpoint
      const profileRes = await request(app)
        .get('/api/institution/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.data.permanentInstituteId).toBe('1-3489128');
      expect(profileRes.body.data.name).toContain('Apex Institute');

      // Access protected institution applications endpoint
      const appsRes = await request(app)
        .get('/api/institution/applications')
        .set('Authorization', `Bearer ${token}`);

      expect(appsRes.status).toBe(200);
      expect(appsRes.body.success).toBe(true);
      expect(Array.isArray(appsRes.body.data)).toBe(true);
    });

    it('authenticates Sahyadri College demo account and accesses protected institution endpoints', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'principal@sahyadri.ac.in',
          password: demoPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.role).toBe('INSTITUTION_USER');
      expect(loginRes.body.data.user.email).toBe('principal@sahyadri.ac.in');
      expect(loginRes.body.data.user.permanentInstituteId).toBe('1-8491029');
      expect(loginRes.body.data.token).toBeDefined();

      const token = loginRes.body.data.token;

      // Access protected institution profile endpoint
      const profileRes = await request(app)
        .get('/api/institution/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.data.permanentInstituteId).toBe('1-8491029');
      expect(profileRes.body.data.name).toContain('Sahyadri');

      // Access protected institution applications endpoint
      const appsRes = await request(app)
        .get('/api/institution/applications')
        .set('Authorization', `Bearer ${token}`);

      expect(appsRes.status).toBe(200);
      expect(appsRes.body.success).toBe(true);
      expect(Array.isArray(appsRes.body.data)).toBe(true);
    });

    it('prevents institutional users from accessing internal officer endpoints (RBAC boundary)', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'director@apextech.ac.in',
          password: demoPassword,
        });

      const token = loginRes.body.data.token;

      // Institutional user calling officer audit endpoint
      const auditRes = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${token}`);

      expect(auditRes.status).toBe(403);
    });

    it('safely self-repairs and unlocks an institutional demo account on correct demo password', async () => {
      // Simulate outdated hash and locked account on Apex demo user
      await prisma.systemUser.update({
        where: { email: 'director@apextech.ac.in' },
        data: {
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$b3V0ZGF0ZWRzYWx0$dummyoutdatedhashinstitution1234567890',
          failedLoginAttempts: 5,
          lockedUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in future
        },
      });

      // Login attempt with valid demo password should auto-unlock and self-repair
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'director@apextech.ac.in',
          password: demoPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('INSTITUTION_USER');

      // Verify DB lock cleared
      const user = await prisma.systemUser.findUnique({
        where: { email: 'director@apextech.ac.in' },
      });
      expect(user?.lockedUntil).toBeNull();
      expect(user?.failedLoginAttempts).toBe(0);
    });
  });
});
