import {
  ApplicationStage,
  OfficerDecisionType,
  ScrutinyFindingSeverity,
  ScrutinyReviewState,
  UserRole,
  Prisma,
  DocumentType,
} from '@prisma/client';
import { CATEGORY_DOCUMENT_CHECKLIST } from '@saksham/shared';
import { prisma } from '../db/prisma';
import { SCRUTINY_FIELD_RULES, SCRUTINY_RECOMMENDATIONS } from '../config/scrutinyRules';
import { recordAuditEvent } from './auditService';

export class ScrutinyWorkflowError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
    this.name = 'ScrutinyWorkflowError';
  }
}

type ReviewDocument = {
  id: string;
  documentType: DocumentType;
  title: string;
  verificationStatus: string;
  detectedDocumentType: DocumentType | null;
  extractedFields: Prisma.JsonValue | null;
  validationResults: Prisma.JsonValue | null;
  verificationExplanation: string | null;
  ocrConfidence: number | null;
  ocrEvidence: Prisma.JsonValue | null;
};

type FindingInput = {
  documentId: string | null;
  fieldName: string;
  applicationValue: string | null;
  documentValue: string | null;
  findingType: string;
  severity: ScrutinyFindingSeverity;
  reason: string;
  evidence: string | null;
  evidencePage: number | null;
  ocrConfidence: number | null;
  recommendedAction: string;
};

type ScrutinyApplication = {
  id: string;
  applicationNumber: string;
  permanentInstituteId: string;
  instituteName: string;
  trustName: string;
  category: keyof typeof CATEGORY_DOCUMENT_CHECKLIST;
  region: string;
  state: string;
  currentStage: ApplicationStage;
  landAreaAcres: number;
  isDraft: boolean;
  isDemo: boolean;
  institutionId: string | null;
  institution: { name: string; trustName: string; address: string | null; district: string | null } | null;
  documents: ReviewDocument[];
  deficiencyNotices: Array<{ id: string; noticeNumber: string; title: string; description: string; status: string; createdAt: Date }>;
  scrutinyRuns: Array<{ id: string; officerId: string; officerName: string; createdAt: Date; findings: unknown[] }>;
  officerDecisions: Array<{ id: string; decision: OfficerDecisionType; officerId: string; officerName: string; remarks: string; previousStage: ApplicationStage; resultingStage: ApplicationStage; createdAt: Date; overriddenFindingIds: string[] }>;
};

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

const editDistance = (a: string, b: string): number => {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (a[row - 1] === b[column - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return previous[b.length];
};

export type ScrutinyComparison = {
  fieldName: string;
  label: string;
  applicationValue: string | null;
  documentValue: string | null;
  result: 'EXACT_MATCH' | 'NORMALIZED_MATCH' | 'POSSIBLE_SPELLING_DIFFERENCE' | 'CONFLICT' | 'NOT_EXTRACTED' | 'NOT_COMPARABLE';
  explanation: string;
};

export const compareScrutinyValues = (
  fieldName: string,
  label: string,
  applicationValue: string | null,
  documentValue: string | null
): ScrutinyComparison => {
  if (applicationValue === null || applicationValue.trim() === '') {
    return { fieldName, label, applicationValue, documentValue, result: 'NOT_COMPARABLE', explanation: 'The application does not provide a value for this configured comparison.' };
  }
  if (documentValue === null || documentValue.trim() === '') {
    return { fieldName, label, applicationValue, documentValue, result: 'NOT_EXTRACTED', explanation: 'OCR did not extract a comparable value; this is not evidence that the value is absent from the original document.' };
  }
  if (applicationValue === documentValue) {
    return { fieldName, label, applicationValue, documentValue, result: 'EXACT_MATCH', explanation: 'The extracted value exactly matches the application value.' };
  }
  const normalizedApplication = normalize(applicationValue);
  const normalizedDocument = normalize(documentValue);
  if (normalizedApplication === normalizedDocument) {
    return { fieldName, label, applicationValue, documentValue, result: 'NORMALIZED_MATCH', explanation: 'The values match after ignoring case, punctuation, and repeated whitespace.' };
  }
  const distance = editDistance(normalizedApplication, normalizedDocument);
  const spellingThreshold = Math.max(1, Math.floor(Math.max(normalizedApplication.length, normalizedDocument.length) * 0.12));
  if (distance <= spellingThreshold) {
    return { fieldName, label, applicationValue, documentValue, result: 'POSSIBLE_SPELLING_DIFFERENCE', explanation: `The values differ by ${distance} character-level edit${distance === 1 ? '' : 's'}; verify against the original evidence rather than treating this as a confirmed conflict.` };
  }
  return { fieldName, label, applicationValue, documentValue, result: 'CONFLICT', explanation: 'The application and OCR-extracted values differ; an officer must verify the original evidence.' };
};

const asJsonObject = (value: Prisma.JsonValue | null): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const asJsonObjectArray = (value: Prisma.JsonValue | null): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) return [];
  const entries: Record<string, unknown>[] = [];
  for (const item of value) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      entries.push(item as Record<string, unknown>);
    }
  }
  return entries;
};

const fieldValue = (fields: Record<string, unknown>, key: string): string | null => {
  const value = fields[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const evidenceFor = (document: ReviewDocument, query?: string | null) => {
  const evidence = Array.isArray(document.ocrEvidence) ? document.ocrEvidence : [];
  const candidates = evidence.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.excerpt !== 'string' || typeof record.page !== 'number') return [];
    return [{
      page: record.page,
      excerpt: record.excerpt,
      confidence: typeof record.confidence === 'number' ? record.confidence : null,
    }];
  });
  const selected = query
    ? candidates.find((item) => item.excerpt.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    : undefined;
  const result = selected || candidates[0];
  return result ? { evidence: result.excerpt.slice(0, 600), page: result.page, confidence: result.confidence } : { evidence: null, page: null, confidence: document.ocrConfidence };
};

const addFinding = (
  findings: FindingInput[],
  document: ReviewDocument | null,
  input: Omit<FindingInput, 'documentId' | 'evidence' | 'evidencePage' | 'ocrConfidence'>
) => {
  const evidence = document ? evidenceFor(document, input.documentValue) : { evidence: null, page: null, confidence: null };
  findings.push({
    ...input,
    documentId: document?.id ?? null,
    evidence: evidence.evidence,
    evidencePage: evidence.page,
    ocrConfidence: evidence.confidence,
  });
};

const ruleFindingsForDocument = (
  application: ScrutinyApplication,
  document: ReviewDocument,
  findings: FindingInput[]
) => {
  const fields = asJsonObject(document.extractedFields);
  const results = asJsonObjectArray(document.validationResults);
  const failedResults = results.filter((entry) => {
    const passed = typeof entry.passed === 'boolean' ? entry.passed : true;
    return !passed;
  });
  const mismatch = document.detectedDocumentType && document.detectedDocumentType !== document.documentType;

  if (mismatch || failedResults.some((result) => result.rule === 'Expected document type')) {
    addFinding(findings, document, {
      fieldName: 'documentType',
      applicationValue: document.documentType.replace(/_/g, ' '),
      documentValue: document.detectedDocumentType?.replace(/_/g, ' ') || null,
      findingType: 'WRONG_DOCUMENT_TYPE',
      severity: ScrutinyFindingSeverity.CRITICAL,
      reason: `This upload was requested as ${document.documentType.replace(/_/g, ' ')} but automated content analysis${document.detectedDocumentType ? ` detected ${document.detectedDocumentType.replace(/_/g, ' ')}` : ' could not confirm the requested type'}.`,
      recommendedAction: SCRUTINY_RECOMMENDATIONS.wrongType,
    });
  }

  if (document.verificationStatus === 'MANUAL_REVIEW') {
    addFinding(findings, document, {
      fieldName: 'documentReadability',
      applicationValue: null,
      documentValue: null,
      findingType: 'UNREADABLE_DOCUMENT',
      severity: ScrutinyFindingSeverity.HIGH,
      reason: document.verificationExplanation || 'OCR could not reliably read this upload. The scan requires human inspection.',
      recommendedAction: SCRUTINY_RECOMMENDATIONS.unreadable,
    });
  }

  if (document.ocrConfidence !== null && document.ocrConfidence < 60) {
    addFinding(findings, document, {
      fieldName: 'ocrConfidence',
      applicationValue: 'At least 60%',
      documentValue: `${document.ocrConfidence.toFixed(1)}%`,
      findingType: 'LOW_CONFIDENCE_OCR',
      severity: ScrutinyFindingSeverity.MEDIUM,
      reason: `OCR confidence was ${document.ocrConfidence.toFixed(1)}%; values need officer confirmation.`,
      recommendedAction: SCRUTINY_RECOMMENDATIONS.lowConfidence,
    });
  }

  for (const result of failedResults) {
    const label = typeof result.rule === 'string' ? result.rule : 'Mandatory document rule';
    if (label === 'Expected document type' || label === 'Unambiguous document type' || label === 'Readable document text') continue;
    const requiredField = label.toLocaleLowerCase().includes('number') || label.toLocaleLowerCase().includes('identifier');
    const explanation = typeof result.explanation === 'string'
      ? result.explanation
      : `Required rule "${label}" did not pass.`;
    addFinding(findings, document, {
      fieldName: label,
      applicationValue: null,
      documentValue: null,
      findingType: 'MISSING_REQUIRED_FIELD',
      severity: requiredField ? ScrutinyFindingSeverity.HIGH : ScrutinyFindingSeverity.MEDIUM,
      reason: explanation,
      recommendedAction: SCRUTINY_RECOMMENDATIONS.missingRequiredField,
    });
  }

  const configuredFields = SCRUTINY_FIELD_RULES[document.documentType];
  for (const rule of configuredFields) {
    const applicationValue = rule.applicationKey === 'institutionAddress'
      ? [application.institution?.address, application.institution?.district, application.state].filter(Boolean).join(', ') || null
      : rule.applicationKey === 'landAreaAcres'
        ? String(application.landAreaAcres)
        : String(application[rule.applicationKey as keyof ScrutinyApplication] ?? '') || null;
    const documentValue = fieldValue(fields, rule.documentKey);
    if (!documentValue) continue;
    const comparison = compareScrutinyValues(rule.fieldName, rule.label, applicationValue, documentValue);
    if (comparison.result !== 'CONFLICT' && comparison.result !== 'POSSIBLE_SPELLING_DIFFERENCE') continue;
    addFinding(findings, document, {
      fieldName: rule.fieldName,
      applicationValue,
      documentValue,
      findingType: comparison.result,
      severity: comparison.result === 'CONFLICT'
        ? rule.severity === 'LOW' ? ScrutinyFindingSeverity.LOW : rule.severity === 'MEDIUM' ? ScrutinyFindingSeverity.HIGH : ScrutinyFindingSeverity.HIGH
        : ScrutinyFindingSeverity.MEDIUM,
      reason: comparison.explanation,
      recommendedAction: comparison.result === 'CONFLICT' ? SCRUTINY_RECOMMENDATIONS.conflictingValue : rule.recommendation,
    });
  }
};

export const buildScrutinyFindings = (
  application: ScrutinyApplication,
  documents: ReviewDocument[]
): FindingInput[] => {
  const findings: FindingInput[] = [];
  const requiredDocuments = (CATEGORY_DOCUMENT_CHECKLIST[application.category] || []).filter((rule) => rule.mandatory);
  const requiredTypes = new Set(requiredDocuments.map((rule) => rule.documentType));

  for (const requirement of requiredDocuments) {
    if (!documents.some((document) => document.documentType === requirement.documentType)) {
      addFinding(findings, null, {
        fieldName: requirement.documentType,
        applicationValue: requirement.title,
        documentValue: null,
        findingType: 'MISSING_REQUIRED_DOCUMENT',
        severity: ScrutinyFindingSeverity.CRITICAL,
        reason: `No ${requirement.title} has been uploaded for this application.`,
        recommendedAction: SCRUTINY_RECOMMENDATIONS.missingDocument,
      });
    }
  }

  for (const document of documents) {
    if (!requiredTypes.has(document.documentType)) {
      addFinding(findings, document, {
        fieldName: 'documentType',
        applicationValue: null,
        documentValue: document.documentType.replace(/_/g, ' '),
        findingType: 'UNSUPPORTED_DOCUMENT',
        severity: ScrutinyFindingSeverity.HIGH,
        reason: 'This document type is not configured for the application category.',
        recommendedAction: 'Confirm the document category and applicable application requirements.',
      });
      continue;
    }
    ruleFindingsForDocument(application, document, findings);
  }

  const documentsByType = new Map<string, ReviewDocument[]>();
  for (const document of documents) {
    documentsByType.set(document.documentType, [...(documentsByType.get(document.documentType) || []), document]);
  }
  for (const [documentType, matching] of documentsByType) {
    if (matching.length < 2) continue;
    for (const duplicate of matching.slice(1)) {
      addFinding(findings, duplicate, {
        fieldName: documentType,
        applicationValue: 'One current document',
        documentValue: `${matching.length} uploads`,
        findingType: 'DUPLICATE_DOCUMENT',
        severity: ScrutinyFindingSeverity.MEDIUM,
        reason: `${matching.length} documents of this type are uploaded; an officer should confirm which is current.`,
        recommendedAction: SCRUTINY_RECOMMENDATIONS.duplicateDocument,
      });
    }
  }
  return findings;
};

const applicationInclude = {
  institution: { select: { name: true, trustName: true, address: true, district: true } },
  documents: { orderBy: { createdAt: 'desc' as const } },
  deficiencyNotices: { orderBy: { createdAt: 'desc' as const }, select: { id: true, noticeNumber: true, title: true, description: true, status: true, createdAt: true } },
  scrutinyRuns: { orderBy: { createdAt: 'desc' as const }, include: { findings: { include: { reviewEvents: { orderBy: { createdAt: 'asc' as const } } } } } },
  officerDecisions: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.ApplicationInclude;

const loadApplication = async (applicationId: string, role: UserRole, region: string | null) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: applicationInclude,
  });
  if (!application) throw new ScrutinyWorkflowError('Application not found.', 404);
  if (role === UserRole.REGIONAL_OFFICER && application.region !== region) {
    throw new ScrutinyWorkflowError('Access denied outside the officer assigned region.', 403);
  }
  return application;
};

const assertActionable = (application: { isDraft: boolean; isDemo: boolean; currentStage: ApplicationStage }) => {
  if (application.isDemo) throw new ScrutinyWorkflowError('Demo records are read-only and cannot be used for officer decisions.', 409);
  if (application.isDraft) throw new ScrutinyWorkflowError('Draft applications cannot enter officer scrutiny.', 409);
  const actionableStages: ApplicationStage[] = [ApplicationStage.SUBMITTED, ApplicationStage.SCRUTINY, ApplicationStage.RE_SCRUTINY];
  if (!actionableStages.includes(application.currentStage)) {
    throw new ScrutinyWorkflowError('This application is not in an officer scrutiny decision stage.', 409);
  }
};

export const getScrutinyWorkbench = async (applicationId: string, role: UserRole, region: string | null) => {
  const application = await loadApplication(applicationId, role, region);
  const latestRun = application.scrutinyRuns[0];
  const comparisons = application.documents.flatMap((document) => {
    const fields = asJsonObject(document.extractedFields);
    return SCRUTINY_FIELD_RULES[document.documentType].map((rule) => {
      const applicationValue = rule.applicationKey === 'institutionAddress'
        ? [application.institution?.address, application.institution?.district, application.state].filter(Boolean).join(', ') || null
        : rule.applicationKey === 'landAreaAcres'
          ? String(application.landAreaAcres)
          : String(application[rule.applicationKey as keyof typeof application] ?? '') || null;
      return {
        documentId: document.id,
        documentType: document.documentType,
        ...compareScrutinyValues(rule.fieldName, rule.label, applicationValue, fieldValue(fields, rule.documentKey)),
      };
    });
  });
  return {
    application,
    latestRun,
    comparisons,
  };
};

export const analyzeApplicationScrutiny = async (
  applicationId: string,
  officer: { id: string; fullName: string; role: UserRole; region: string | null }
) => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} FOR UPDATE`;
    const application = await tx.application.findUnique({ where: { id: applicationId }, include: applicationInclude });
    if (!application) throw new ScrutinyWorkflowError('Application not found.', 404);
    if (officer.role === UserRole.REGIONAL_OFFICER && application.region !== officer.region) {
      throw new ScrutinyWorkflowError('Access denied outside the officer assigned region.', 403);
    }
    assertActionable(application);
    const findingInputs = buildScrutinyFindings(application as unknown as ScrutinyApplication, application.documents as ReviewDocument[]);
    if (application.currentStage === ApplicationStage.SUBMITTED) {
      await tx.application.update({
        where: { id: application.id },
        data: {
          currentStage: ApplicationStage.SCRUTINY,
          pendingWithRole: UserRole.SCRUTINY_OFFICER,
          stageAgeingDays: 0,
          lastUpdated: new Date(),
        },
      });
    }
    const run = await tx.applicationScrutinyRun.create({
      data: { applicationId: application.id, officerId: officer.id, officerName: officer.fullName },
    });
    if (findingInputs.length) {
      await tx.applicationReviewFinding.createMany({
        data: findingInputs.map((finding) => ({ ...finding, runId: run.id, applicationId: application.id })),
      });
    }
    return tx.applicationScrutinyRun.findUniqueOrThrow({
      where: { id: run.id },
      include: { findings: { orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }] } },
    });
  });
  await recordAuditEvent({
    actorId: officer.id,
    actorName: officer.fullName,
    actorRole: officer.role,
    actionCode: 'APPLICATION_SCRUTINY_ANALYZED',
    actionTitle: 'Officer Scrutiny Analysis Completed',
    entityType: 'APPLICATION',
    entityId: applicationId,
    details: `Rule-based OCR scrutiny run ${result.id} created with ${result.findings.length} findings.`,
    ipAddressMasked: '127.0.0.xxx',
  });
  return result;
};

export const reviewScrutinyFinding = async (
  applicationId: string,
  findingId: string,
  input: { reviewState: ScrutinyReviewState; note: string },
  officer: { id: string; fullName: string; role: UserRole; region: string | null }
) => {
  const note = input.note.trim();
  if (note.length < 5 || note.length > 2000) throw new ScrutinyWorkflowError('A review note of 5 to 2,000 characters is required.');

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} FOR UPDATE`;
    const application = await tx.application.findUnique({ where: { id: applicationId }, include: { scrutinyRuns: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    if (!application) throw new ScrutinyWorkflowError('Application not found.', 404);
    if (officer.role === UserRole.REGIONAL_OFFICER && application.region !== officer.region) throw new ScrutinyWorkflowError('Access denied outside the officer assigned region.', 403);
    assertActionable(application);
    const finding = await tx.applicationReviewFinding.findFirst({
      where: { id: findingId, applicationId, runId: application.scrutinyRuns[0]?.id },
    });
    if (!finding) throw new ScrutinyWorkflowError('Finding not found in the current scrutiny run.', 404);
    if (finding.reviewState === ScrutinyReviewState.RESOLVED || (finding.reviewState === ScrutinyReviewState.DISMISSED && input.reviewState !== ScrutinyReviewState.RESOLVED)) {
      throw new ScrutinyWorkflowError('This finding cannot transition from its current review state.', 409);
    }
    if (input.reviewState === finding.reviewState) throw new ScrutinyWorkflowError('The finding already has this review state.', 409);
    const updated = await tx.applicationReviewFinding.update({
      where: { id: finding.id },
      data: {
        reviewState: input.reviewState,
        officerNotes: note,
        reviewedById: officer.id,
        reviewedByName: officer.fullName,
        reviewedAt: new Date(),
      },
    });
    await tx.applicationFindingReviewEvent.create({
      data: {
        findingId: finding.id,
        officerId: officer.id,
        officerName: officer.fullName,
        fromState: finding.reviewState,
        toState: input.reviewState,
        note,
      },
    });
    return updated;
  });
};

export const recordOfficerDecision = async (
  applicationId: string,
  input: {
    decision: OfficerDecisionType;
    remarks: string;
    affectedFindingIds?: string[];
    overrideFindingIds?: string[];
    overrideReason?: string;
  },
  officer: { id: string; fullName: string; role: UserRole; region: string | null }
) => {
  const remarks = input.remarks.trim();
  if (remarks.length < 10 || remarks.length > 4000) throw new ScrutinyWorkflowError('Final remarks must contain 10 to 4,000 characters.');
  const affectedFindingIds = Array.isArray(input.affectedFindingIds) ? [...new Set(input.affectedFindingIds)] : [];
  const overrideFindingIds = Array.isArray(input.overrideFindingIds) ? [...new Set(input.overrideFindingIds)] : [];
  if (input.decision === OfficerDecisionType.REQUEST_CORRECTION && affectedFindingIds.length === 0) {
    throw new ScrutinyWorkflowError('Select at least one finding or document that requires correction.');
  }
  if (input.decision === OfficerDecisionType.REJECT && affectedFindingIds.length === 0) {
    throw new ScrutinyWorkflowError('Select at least one finding or document supporting the rejection.');
  }
  if (overrideFindingIds.length && officer.role !== UserRole.SYSTEM_ADMIN) {
    throw new ScrutinyWorkflowError('Only a system administrator may override blocking findings.', 403);
  }
  const overrideReason = input.overrideReason?.trim() || '';
  if (overrideFindingIds.length && overrideReason.length < 10) {
    throw new ScrutinyWorkflowError('A specific reason of at least 10 characters is required for each authorized override.');
  }

  const decisionResult = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} FOR UPDATE`;
    const application = await tx.application.findUnique({ where: { id: applicationId }, include: { institution: true, scrutinyRuns: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    if (!application) throw new ScrutinyWorkflowError('Application not found.', 404);
    if (officer.role === UserRole.REGIONAL_OFFICER && application.region !== officer.region) throw new ScrutinyWorkflowError('Access denied outside the officer assigned region.', 403);
    assertActionable(application);
    const currentRun = application.scrutinyRuns[0];
    if (!currentRun) throw new ScrutinyWorkflowError('Run scrutiny analysis before recording a decision.', 409);
    const findings = await tx.applicationReviewFinding.findMany({ where: { applicationId, runId: currentRun.id } });
    const referencedIds = new Set(findings.map((finding) => finding.id));
    if ([...affectedFindingIds, ...overrideFindingIds].some((findingId) => !referencedIds.has(findingId))) {
      throw new ScrutinyWorkflowError('The decision references a finding outside the current scrutiny run.');
    }

    for (const findingId of overrideFindingIds) {
      const finding = findings.find((item) => item.id === findingId)!;
      if (finding.reviewState === ScrutinyReviewState.DISMISSED || finding.reviewState === ScrutinyReviewState.RESOLVED) {
        throw new ScrutinyWorkflowError('Only unresolved findings can be overridden.');
      }
      await tx.applicationReviewFinding.update({
        where: { id: finding.id },
        data: {
          reviewState: ScrutinyReviewState.RESOLVED,
          officerNotes: overrideReason,
          reviewedById: officer.id,
          reviewedByName: officer.fullName,
          reviewedAt: new Date(),
          overrideById: officer.id,
          overrideByName: officer.fullName,
          overrideAt: new Date(),
          overrideReason,
        },
      });
      await tx.applicationFindingReviewEvent.create({
        data: {
          findingId: finding.id,
          officerId: officer.id,
          officerName: officer.fullName,
          fromState: finding.reviewState,
          toState: ScrutinyReviewState.RESOLVED,
          note: overrideReason,
          isOverride: true,
        },
      });
    }

    const blockingFindings = findings.filter((finding) =>
      finding.severity !== ScrutinyFindingSeverity.LOW &&
      (finding.reviewState === ScrutinyReviewState.PENDING || finding.reviewState === ScrutinyReviewState.CONFIRMED) &&
      !overrideFindingIds.includes(finding.id)
    );
    if (input.decision === OfficerDecisionType.APPROVE) {
      if (blockingFindings.length) throw new ScrutinyWorkflowError('Approval is blocked while unresolved mandatory or material findings remain.');
      const requirements = (CATEGORY_DOCUMENT_CHECKLIST[application.category] || []).filter((item) => item.mandatory);
      const latestDocuments = await tx.applicationDocument.findMany({
        where: { applicationId },
        orderBy: { createdAt: 'desc' },
        select: { documentType: true, verificationStatus: true },
      });
      const latestStatus = new Map<string, string>();
      for (const document of latestDocuments) if (!latestStatus.has(document.documentType)) latestStatus.set(document.documentType, document.verificationStatus);
      const failedRequired = requirements.filter((item) => latestStatus.get(item.documentType) !== 'VERIFIED');
      if (failedRequired.length) throw new ScrutinyWorkflowError(`Approval is blocked because mandatory documents have not passed verification: ${failedRequired.map((item) => item.title).join(', ')}.`);
    }

    let resultingStage: ApplicationStage;
    if (input.decision === OfficerDecisionType.APPROVE) resultingStage = ApplicationStage.EVC_SCHEDULED;
    else if (input.decision === OfficerDecisionType.REQUEST_CORRECTION) resultingStage = ApplicationStage.RE_SCRUTINY;
    else resultingStage = ApplicationStage.REJECTED;

    const decision = await tx.applicationDecision.create({
      data: {
        applicationId,
        officerId: officer.id,
        officerName: officer.fullName,
        officerRole: officer.role,
        decision: input.decision,
        previousStage: application.currentStage,
        resultingStage,
        remarks,
        overriddenFindingIds: overrideFindingIds,
      },
    });
    await tx.application.update({
      where: { id: applicationId },
      data: {
        currentStage: resultingStage,
        pendingWithRole: input.decision === OfficerDecisionType.APPROVE ? UserRole.EVC_CONVENER : UserRole.INSTITUTION_USER,
        isDeficient: input.decision === OfficerDecisionType.REQUEST_CORRECTION,
        deficiencyCount: input.decision === OfficerDecisionType.REQUEST_CORRECTION ? { increment: 1 } : undefined,
        stageAgeingDays: 0,
        lastUpdated: new Date(),
      },
    });

    if (input.decision === OfficerDecisionType.REQUEST_CORRECTION) {
      const relatedFindings = findings.filter((finding) => affectedFindingIds.includes(finding.id));
      const title = 'Officer scrutiny correction request';
      const description = [
        remarks,
        '',
        'Required corrections:',
        ...relatedFindings.map((finding) => `- ${finding.fieldName}: ${finding.reason}${finding.documentId ? ` (document ${finding.documentId})` : ''}`),
      ].join('\n').slice(0, 8000);
      const noticeCount = await tx.deficiencyNotice.count();
      const noticeNumber = `DEF-${new Date().getFullYear()}-${1000 + noticeCount + 1}`;
      await tx.deficiencyNotice.create({
        data: {
          applicationId,
          noticeNumber,
          title,
          description,
          parameterName: relatedFindings.map((finding) => finding.fieldName).join(', ').slice(0, 500),
          requirementRef: 'Officer scrutiny finding',
          issuedById: officer.id,
          issuedByName: officer.fullName,
          issuedRole: officer.role,
          isReleased: true,
          releasedAt: new Date(),
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'ISSUED_PENDING_RESPONSE',
        },
      });
      if (application.institutionId) {
        await tx.notification.create({
          data: {
            institutionId: application.institutionId,
            title,
            message: `Corrections are required for application ${application.applicationNumber}. Review the scrutiny notice and resubmit the requested evidence.`,
            type: 'DEFICIENCY',
            link: `/institution/applications/${application.id}`,
          },
        });
      }
    } else if (application.institutionId) {
      await tx.notification.create({
        data: {
          institutionId: application.institutionId,
          title: input.decision === OfficerDecisionType.APPROVE ? 'Application advanced to EVC inspection' : 'Application rejected',
          message: remarks,
          type: input.decision === OfficerDecisionType.APPROVE ? 'SUCCESS' : 'WARNING',
          link: `/institution/applications/${application.id}`,
        },
      });
    }
    return { decision, resultingStage };
  });

  await recordAuditEvent({
    actorId: officer.id,
    actorName: officer.fullName,
    actorRole: officer.role,
    actionCode: `APPLICATION_DECISION_${input.decision}`,
    actionTitle: `Application Decision: ${input.decision.replace(/_/g, ' ')}`,
    entityType: 'APPLICATION',
    entityId: applicationId,
    details: `Decision recorded with resulting stage ${decisionResult.resultingStage}. Remarks: ${remarks}`,
    ipAddressMasked: '127.0.0.xxx',
  });
  return decisionResult;
};
