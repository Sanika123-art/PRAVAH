import { prisma } from './prisma';
import { hashPassword, verifyPassword } from '../utils/security';
import { UserRole, Region } from '@prisma/client';

export const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'AicteDev@2026!';

export interface PresetOfficer {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  region: Region;
  department: string;
}

export const PRESET_DEMO_OFFICERS: PresetOfficer[] = [
  {
    id: 'usr-scr-01',
    username: 'rk.sharma',
    email: 'rk.sharma@aicte.gov.in',
    fullName: 'Dr. R. K. Sharma',
    role: UserRole.SCRUTINY_OFFICER,
    region: Region.NORTH_WEST,
    department: 'Scrutiny Committee Desk',
  },
  {
    id: 'usr-scr-02',
    username: 'anjali.deshmukh',
    email: 'anjali.deshmukh@aicte.gov.in',
    fullName: 'Prof. Anjali Deshmukh',
    role: UserRole.SCRUTINY_OFFICER,
    region: Region.WESTERN,
    department: 'Western Scrutiny Cell',
  },
  {
    id: 'usr-scr-03',
    username: 's.narayanan',
    email: 's.narayanan@aicte.gov.in',
    fullName: 'Er. S. Narayanan',
    role: UserRole.SCRUTINY_OFFICER,
    region: Region.SOUTHERN,
    department: 'Re-Scrutiny Operations',
  },
  {
    id: 'usr-ro-01',
    username: 'neelesh.verma',
    email: 'neelesh.verma@aicte.gov.in',
    fullName: 'Dr. Neelesh Verma',
    role: UserRole.REGIONAL_OFFICER,
    region: Region.CENTRAL,
    department: 'Central Regional Office (CRO)',
  },
  {
    id: 'usr-evc-01',
    username: 'cm.rao',
    email: 'cm.rao@aicte.gov.in',
    fullName: 'Prof. C. M. Rao',
    role: UserRole.EVC_EXPERT,
    region: Region.SOUTH_WEST,
    department: 'Expert Visit Committee Panel',
  },
  {
    id: 'usr-sac-01',
    username: 'bn.panda',
    email: 'bn.panda@aicte.gov.in',
    fullName: 'Justice (Retd.) B. N. Panda',
    role: UserRole.SAC_SHC_MEMBER,
    region: Region.NORTHERN,
    department: 'Standing Appellate Committee (SAC)',
  },
  {
    id: 'usr-ms-01',
    username: 'rajendra.prasad',
    email: 'rajendra.prasad@aicte.gov.in',
    fullName: 'Prof. Rajendra Prasad',
    role: UserRole.MEMBER_SECRETARY,
    region: Region.NORTHERN,
    department: 'Council Headquarters / Approval Bureau',
  },
  {
    id: 'usr-adm-01',
    username: 'itadmin.saksham',
    email: 'itadmin.saksham@aicte.gov.in',
    fullName: 'Administrative IT Cell',
    role: UserRole.SYSTEM_ADMIN,
    region: Region.NORTHERN,
    department: 'AICTE e-Governance Division',
  },
];

/**
 * Initializes and verifies AICTE Officer demo accounts in PostgreSQL.
 * Safe, repeatable, and non-destructive: only manages predefined demo officer IDs.
 * Never deletes or modifies non-demo institutional users.
 */
export async function initializeDemoAccounts(): Promise<void> {
  try {
    const defaultHash = await hashPassword(DEMO_PASSWORD);

    for (const officer of PRESET_DEMO_OFFICERS) {
      const existing = await prisma.systemUser.findUnique({
        where: { id: officer.id },
      });

      if (!existing) {
        await prisma.systemUser.create({
          data: {
            id: officer.id,
            username: officer.username,
            email: officer.email,
            passwordHash: defaultHash,
            fullName: officer.fullName,
            role: officer.role,
            region: officer.region,
            department: officer.department,
            isActive: true,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      } else {
        // Check if password hash needs repair
        const isHashValid = await verifyPassword(existing.passwordHash, DEMO_PASSWORD);
        await prisma.systemUser.update({
          where: { id: officer.id },
          data: {
            username: officer.username,
            email: officer.email,
            fullName: officer.fullName,
            role: officer.role,
            region: officer.region,
            department: officer.department,
            isActive: true,
            failedLoginAttempts: 0,
            lockedUntil: null,
            ...(isHashValid ? {} : { passwordHash: defaultHash }),
          },
        });
      }
    }
    console.log('[Demo Accounts]: AICTE Officer demo accounts synchronized successfully.');
  } catch (err) {
    console.warn('[Demo Accounts Warning]: Could not ensure demo accounts on startup:', err);
  }
}
