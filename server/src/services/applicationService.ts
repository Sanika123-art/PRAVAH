import { prisma } from '../db/prisma';
import { MOCK_APPLICATIONS } from '@saksham/shared';
import {
  ApplicationStage,
  ApplicationCategory,
  Region,
  PriorityLevel,
  UserRole,
  Prisma,
} from '@prisma/client';
import { recordAuditEvent } from './auditService';

export interface ApplicationFilterParams {
  search?: string;
  stage?: string;
  region?: string;
  priority?: string;
  category?: string;
  includeDrafts?: boolean;
  recordType?: 'ALL' | 'REAL' | 'DEMO';
  limit?: number;
  offset?: number;
}

export const getApplicationsFromDb = async (filters: ApplicationFilterParams) => {
  const where: Prisma.ApplicationWhereInput = {};

  // By default, officers only view submitted applications (drafts remain private to institutions)
  if (!filters.includeDrafts) {
    where.isDraft = false;
  }
  if (filters.recordType === 'REAL') where.isDemo = false;
  if (filters.recordType === 'DEMO') where.isDemo = true;

  if (filters.search && typeof filters.search === 'string') {
    const q = filters.search.trim();
    where.OR = [
      { applicationNumber: { contains: q, mode: 'insensitive' } },
      { instituteName: { contains: q, mode: 'insensitive' } },
      { permanentInstituteId: { contains: q, mode: 'insensitive' } },
      { state: { contains: q, mode: 'insensitive' } },
      { trustName: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (filters.stage && Object.values(ApplicationStage).includes(filters.stage as ApplicationStage)) {
    where.currentStage = filters.stage as ApplicationStage;
  }

  if (filters.region && Object.values(Region).includes(filters.region as Region)) {
    where.region = filters.region as Region;
  }

  if (filters.priority && Object.values(PriorityLevel).includes(filters.priority as PriorityLevel)) {
    where.priority = filters.priority as PriorityLevel;
  }

  if (filters.category && Object.values(ApplicationCategory).includes(filters.category as ApplicationCategory)) {
    where.category = filters.category as ApplicationCategory;
  }

  try {
    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          documents: true,
          deficiencyNotices: true,
        },
        orderBy: [
          { priority: 'desc' },
          { stageAgeingDays: 'desc' },
          { submissionDate: 'desc' },
        ],
        take: filters.limit ? Math.min(Math.max(1, filters.limit), 100) : 50,
        skip: filters.offset ? Math.max(0, filters.offset) : 0,
      }),
    ]);

    return { total, data: applications };
  } catch (dbError) {
    console.warn('[ApplicationService] Database offline, serving curated dataset from @saksham/shared');
    let apps = [...MOCK_APPLICATIONS];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.instituteName.toLowerCase().includes(q) ||
          a.applicationNumber.toLowerCase().includes(q) ||
          a.permanentInstituteId.toLowerCase().includes(q) ||
          a.trustName.toLowerCase().includes(q)
      );
    }
    if (filters.stage) apps = apps.filter((a) => a.currentStage === filters.stage);
    if (filters.region) apps = apps.filter((a) => a.region === filters.region);
    if (filters.priority) apps = apps.filter((a) => a.priority === filters.priority);
    if (filters.category) apps = apps.filter((a) => a.category === filters.category);

    const total = apps.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return {
      total,
      data: apps.slice(offset, offset + limit).map((a) => ({
        ...a,
        documents: [],
        deficiencyNotices: [],
      })) as any,
    };
  }
};

export const getApplicationByIdFromDb = async (id: string) => {
  if (!id || typeof id !== 'string') {
    return null;
  }

  try {
    return await prisma.application.findFirst({
      where: {
        OR: [
          { id },
          { applicationNumber: id },
        ],
      },
      include: {
        institution: true,
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        deficiencyNotices: {
          orderBy: { createdAt: 'desc' },
        },
        scrutinyFindings: true,
        evcInspections: {
          include: {
            expertMembers: true,
          },
        },
        complianceItems: true,
        validityDocuments: true,
      },
    });
  } catch (dbError) {
    const app = MOCK_APPLICATIONS.find((a) => a.id === id || a.applicationNumber === id);
    if (!app) return null;
    return {
      ...app,
      documents: [],
      deficiencyNotices: [],
      scrutinyFindings: [],
      evcInspections: [],
      complianceItems: [],
      validityDocuments: [],
      institution: null,
    } as any;
  }
};

export const transitionApplicationStage = async (
  applicationId: string,
  newStage: ApplicationStage,
  officerId: string,
  officerName: string,
  officerRole: UserRole,
  remarks?: string
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentStage: newStage,
      stageAgeingDays: 0,
      lastUpdated: new Date(),
    },
  });

  await recordAuditEvent({
    actorId: officerId,
    actorName: officerName,
    actorRole: officerRole,
    actionCode: 'APPLICATION_STAGE_TRANSITION',
    actionTitle: 'Workflow Stage Transitioned',
    entityType: 'APPLICATION',
    entityId: application.id,
    details: `Stage updated from '${application.currentStage}' to '${newStage}'. Remarks: ${remarks || 'None'}.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return updated;
};
