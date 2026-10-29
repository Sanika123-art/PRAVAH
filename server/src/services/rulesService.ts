import { prisma } from '../db/prisma';
import { MOCK_REGULATORY_RULES } from '@saksham/shared';
import { ApplicationCategory, Prisma } from '@prisma/client';

export interface RulesFilterParams {
  category?: string;
  verificationStatus?: string;
}

export const getRegulatoryRulesFromDb = async (filters: RulesFilterParams) => {
  const where: Prisma.RegulatoryRuleWhereInput = {
    isActive: true,
  };

  if (filters.category && Object.values(ApplicationCategory).includes(filters.category as ApplicationCategory)) {
    where.applicationCategory = filters.category as ApplicationCategory;
  }

  if (filters.verificationStatus && ['VERIFIED', 'PENDING_VERIFICATION'].includes(filters.verificationStatus)) {
    where.verificationStatus = filters.verificationStatus;
  }

  try {
    const rules = await prisma.regulatoryRule.findMany({
      where,
      orderBy: [
        { ruleCode: 'asc' },
      ],
    });

    return {
      total: rules.length,
      data: rules.map((r) => ({
        id: r.id,
        ruleCode: r.ruleCode,
        applicationCategory: r.applicationCategory,
        requirementTitle: r.requirementTitle,
        responsibleRole: r.responsibleRole,
        sourceTitle: r.sourceTitle,
        chapterSectionPage: r.chapterSectionPage,
        sourceVersion: r.sourceVersion,
        effectivePeriod: r.effectivePeriod,
        verificationStatus: r.verificationStatus as 'VERIFIED' | 'PENDING_VERIFICATION',
        slaDays: r.slaDays,
        escalationIntervalDays: r.escalationIntervalDays,
        notes: r.notes,
      })),
    };
  } catch (dbError) {
    console.warn('[RulesService] Database offline, serving curated dataset from @saksham/shared');
    let data = [...MOCK_REGULATORY_RULES];
    if (filters.category) data = data.filter((r) => r.applicationCategory === filters.category);
    if (filters.verificationStatus) data = data.filter((r) => r.verificationStatus === filters.verificationStatus);
    return { total: data.length, data: data as any };
  }
};
