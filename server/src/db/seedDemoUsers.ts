import { prisma } from './prisma';
import { hashPassword, verifyPassword } from '../utils/security';
import {
  UserRole,
  Region,
  InstitutionType,
  ApplicationCategory,
  ApplicationStage,
  PriorityLevel,
} from '@prisma/client';

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

export interface PresetInstitution {
  id: string;
  permanentInstituteId: string;
  name: string;
  trustName: string;
  institutionType: InstitutionType;
  region: Region;
  state: string;
  district?: string;
  address?: string;
  pincode?: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface PresetInstitutionUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  institutionPid: string;
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

export const PRESET_DEMO_INSTITUTIONS: PresetInstitution[] = [
  {
    id: 'inst-demo-apex',
    permanentInstituteId: '1-3489128',
    name: 'Apex Institute of Technology & Management',
    trustName: 'Apex Technical Education Society',
    institutionType: InstitutionType.PRIVATE_SELF_FINANCED,
    region: Region.NORTH_WEST,
    state: 'Punjab',
    district: 'SAS Nagar (Mohali)',
    address: 'Sector 82, JLPL Industrial Area',
    pincode: '140306',
    contactEmail: 'director@apextech.ac.in',
    contactPhone: '+91-9876543210',
  },
  {
    id: 'inst-demo-sahyadri',
    permanentInstituteId: '1-8491029',
    name: 'Sahyadri Institute of Engineering & Research',
    trustName: 'Sahyadri Shikshan Sanstha',
    institutionType: InstitutionType.PRIVATE_SELF_FINANCED,
    region: Region.WESTERN,
    state: 'Maharashtra',
    district: 'Pune',
    address: 'Survey No. 45/2, Karve Road',
    pincode: '411038',
    contactEmail: 'principal@sahyadri.ac.in',
    contactPhone: '+91-9876543211',
  },
];

export const PRESET_DEMO_INSTITUTION_USERS: PresetInstitutionUser[] = [
  {
    id: 'usr-inst-apex',
    username: 'director.apex',
    email: 'director@apextech.ac.in',
    fullName: 'Dr. Vikram Malhotra',
    role: UserRole.INSTITUTION_USER,
    institutionPid: '1-3489128',
    department: 'Principal / Authorized Representative',
  },
  {
    id: 'usr-inst-sahyadri',
    username: 'principal.sahyadri',
    email: 'principal@sahyadri.ac.in',
    fullName: 'Dr. Ramesh Joshi',
    role: UserRole.INSTITUTION_USER,
    institutionPid: '1-8491029',
    department: 'Director / Authorized Signatory',
  },
];

/**
 * Initializes and verifies AICTE Officer & Institutional demo accounts in PostgreSQL.
 * Safe, repeatable, and non-destructive: only manages predefined demo accounts.
 * Never deletes or overwrites unrelated user accounts, institution records, or application data.
 */
export async function initializeDemoAccounts(): Promise<void> {
  try {
    const defaultHash = await hashPassword(DEMO_PASSWORD);

    // 1. Synchronize AICTE Officer Demo Accounts
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

    // 2. Synchronize Demo Institutions
    for (const instPreset of PRESET_DEMO_INSTITUTIONS) {
      let inst = await prisma.institution.findFirst({
        where: {
          OR: [
            { permanentInstituteId: instPreset.permanentInstituteId },
            { contactEmail: instPreset.contactEmail },
          ],
        },
      });

      if (!inst) {
        inst = await prisma.institution.create({
          data: {
            id: instPreset.id,
            permanentInstituteId: instPreset.permanentInstituteId,
            name: instPreset.name,
            trustName: instPreset.trustName,
            institutionType: instPreset.institutionType,
            region: instPreset.region,
            state: instPreset.state,
            district: instPreset.district,
            address: instPreset.address,
            pincode: instPreset.pincode,
            contactEmail: instPreset.contactEmail,
            contactPhone: instPreset.contactPhone,
            isVerified: true,
          },
        });
      } else {
        inst = await prisma.institution.update({
          where: { id: inst.id },
          data: {
            name: instPreset.name,
            trustName: instPreset.trustName,
            institutionType: instPreset.institutionType,
            region: instPreset.region,
            state: instPreset.state,
            isVerified: true,
          },
        });
      }
    }

    // 3. Synchronize Demo Institution Users
    for (const userPreset of PRESET_DEMO_INSTITUTION_USERS) {
      const inst = await prisma.institution.findFirst({
        where: {
          OR: [
            { permanentInstituteId: userPreset.institutionPid },
            { contactEmail: userPreset.email },
          ],
        },
      });

      if (!inst) {
        console.warn(`[Demo Accounts]: Could not link user '${userPreset.email}' - institution missing.`);
        continue;
      }

      const existingUser = await prisma.systemUser.findFirst({
        where: {
          OR: [
            { id: userPreset.id },
            { email: { equals: userPreset.email, mode: 'insensitive' } },
            { username: { equals: userPreset.username, mode: 'insensitive' } },
          ],
        },
      });

      if (!existingUser) {
        await prisma.systemUser.create({
          data: {
            id: userPreset.id,
            username: userPreset.username,
            email: userPreset.email,
            passwordHash: defaultHash,
            fullName: userPreset.fullName,
            role: userPreset.role,
            institutionId: inst.id,
            department: userPreset.department,
            isActive: true,
            isEmailVerified: true,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      } else {
        const isHashValid = await verifyPassword(existingUser.passwordHash, DEMO_PASSWORD);
        await prisma.systemUser.update({
          where: { id: existingUser.id },
          data: {
            username: userPreset.username,
            email: userPreset.email,
            fullName: userPreset.fullName,
            role: userPreset.role,
            institutionId: inst.id,
            department: userPreset.department,
            isActive: true,
            isEmailVerified: true,
            failedLoginAttempts: 0,
            lockedUntil: null,
            ...(isHashValid ? {} : { passwordHash: defaultHash }),
          },
        });
      }
    }

    // 4. Ensure demo institutions have linked applications
    const apexInst = await prisma.institution.findUnique({
      where: { permanentInstituteId: '1-3489128' },
    });
    if (apexInst) {
      const existingApexApp = await prisma.application.findFirst({
        where: { institutionId: apexInst.id },
      });
      if (!existingApexApp) {
        await prisma.application.create({
          data: {
            id: 'app-demo-apex-01',
            applicationNumber: 'AICTE/2026/NWRO/34891',
            permanentInstituteId: apexInst.permanentInstituteId,
            instituteName: apexInst.name,
            trustName: apexInst.trustName,
            category: ApplicationCategory.EOA_EXISTING,
            institutionType: apexInst.institutionType,
            region: apexInst.region,
            state: apexInst.state,
            currentStage: ApplicationStage.SCRUTINY,
            priority: PriorityLevel.NORMAL,
            totalAgeingDays: 12,
            stageAgeingDays: 4,
            submissionDate: new Date('2026-10-12T10:00:00Z'),
            assignedOfficer: 'Dr. R. K. Sharma (RO-NW)',
            pendingWithRole: UserRole.SCRUTINY_OFFICER,
            isDeficient: false,
            deficiencyCount: 0,
            landAreaAcres: 5.5,
            approvedIntake: 240,
            requestedIntake: 300,
            academicCycle: '2026-2027',
            isDraft: false,
            isDemo: true,
            institutionId: apexInst.id,
          },
        });
      }
    }

    const sahyadriInst = await prisma.institution.findUnique({
      where: { permanentInstituteId: '1-8491029' },
    });
    if (sahyadriInst) {
      const existingSahyadriApp = await prisma.application.findFirst({
        where: { institutionId: sahyadriInst.id },
      });
      if (!existingSahyadriApp) {
        await prisma.application.create({
          data: {
            id: 'app-demo-sahyadri-01',
            applicationNumber: 'AICTE/2026/WRO/84910',
            permanentInstituteId: sahyadriInst.permanentInstituteId,
            instituteName: sahyadriInst.name,
            trustName: sahyadriInst.trustName,
            category: ApplicationCategory.INTAKE_INCREASE,
            institutionType: sahyadriInst.institutionType,
            region: sahyadriInst.region,
            state: sahyadriInst.state,
            currentStage: ApplicationStage.SUBMITTED,
            priority: PriorityLevel.NORMAL,
            totalAgeingDays: 5,
            stageAgeingDays: 2,
            submissionDate: new Date('2026-10-19T14:30:00Z'),
            assignedOfficer: 'Prof. Anjali Deshmukh',
            pendingWithRole: UserRole.SCRUTINY_OFFICER,
            isDeficient: false,
            deficiencyCount: 0,
            landAreaAcres: 10.0,
            approvedIntake: 420,
            requestedIntake: 540,
            academicCycle: '2026-2027',
            isDraft: false,
            isDemo: true,
            institutionId: sahyadriInst.id,
          },
        });
      }
    }

    console.log('[Demo Accounts]: AICTE Officer and Institutional demo accounts synchronized successfully.');
  } catch (err) {
    console.warn('[Demo Accounts Warning]: Could not ensure demo accounts on startup:', err);
  }
}
