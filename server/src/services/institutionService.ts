import { prisma } from '../db/prisma';
import {
  ApplicationCategory,
  Application as ApplicationRecord,
  ApplicationDocument as ApplicationDocumentRecord,
  InstitutionType,
  ApplicationStage,
  UserRole,
  PriorityLevel,
  DocumentType,
  ComplianceStatus,
  Prisma,
} from '@prisma/client';
import { CATEGORY_DOCUMENT_CHECKLIST } from '@saksham/shared';
import { recordAuditEvent } from './auditService';
import { computeFileHash, getStorageFilePath } from './documentStorageService';
import { removeTemporaryUpload, verifyApplicationDocument } from './documentVerificationService';

export class InstitutionError extends Error {
  statusCode: number;
  details?: any;
  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'InstitutionError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

type PreliminaryApplication = Pick<ApplicationRecord, 'category' | 'requestedIntake' | 'landAreaAcres'> & {
  documents: Array<Pick<ApplicationDocumentRecord, 'documentType' | 'verificationStatus' | 'verificationExplanation' | 'remarks'>>;
};

const evaluatePreliminaryChecks = (application: PreliminaryApplication) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!application.requestedIntake || application.requestedIntake <= 0) {
    errors.push('Requested Intake must be greater than zero.');
  }

  if (!application.landAreaAcres || application.landAreaAcres < 1.0) {
    errors.push('Campus land area must meet minimum statutory requirement (min 1.0 acre).');
  }

  const checklistRules = CATEGORY_DOCUMENT_CHECKLIST[application.category] || [];
  for (const rule of checklistRules) {
    if (!rule.mandatory) continue;
    const document = application.documents.find((item) => item.documentType === rule.documentType);
    if (!document) {
      errors.push(`Missing mandatory document: "${rule.title}" (Required per ${rule.aphClause}).`);
    } else if (document.verificationStatus !== 'VERIFIED') {
      const explanation = document.verificationExplanation || document.remarks || 'The document has not passed automated verification.';
      errors.push(`Document "${rule.title}" is ${document.verificationStatus}: ${explanation}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    category: application.category,
    checkedAt: new Date().toISOString(),
  };
};

/**
 * Retrieves the institution profile for the authenticated tenant.
 */
export const getInstitutionProfile = async (institutionId: string) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!institution) {
    throw new InstitutionError('Institution record not found.', 404);
  }

  return institution;
};

/**
 * Updates editable institution profile details.
 */
export const updateInstitutionProfile = async (
  institutionId: string,
  data: {
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    district?: string;
    pincode?: string;
  }
) => {
  const updated = await prisma.institution.update({
    where: { id: institutionId },
    data,
  });

  return updated;
};

/**
 * Lists all applications belonging strictly to the authenticated institution.
 */
export const getInstitutionApplications = async (institutionId: string) => {
  const applications = await prisma.application.findMany({
    where: { institutionId },
    include: {
      documents: true,
      deficiencyNotices: {
        where: { isReleased: true },
      },
    },
    orderBy: { lastUpdated: 'desc' },
  });

  return applications;
};

/**
 * Retrieves an individual application belonging strictly to the authenticated institution.
 */
export const getInstitutionApplicationById = async (institutionId: string, applicationId: string) => {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      institutionId,
    },
    include: {
      institution: true,
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      deficiencyNotices: {
        where: { isReleased: true }, // Tenant isolation: Draft notices remain hidden
        orderBy: { createdAt: 'desc' },
      },
      complianceItems: {
        orderBy: { dueDate: 'asc' },
      },
      officerDecisions: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, decision: true, officerName: true, remarks: true, previousStage: true, resultingStage: true, createdAt: true },
      },
    },
  });

  if (!application) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  return application;
};

/**
 * Creates a new application draft for the authenticated institution.
 */
export const createApplicationDraft = async (
  institutionId: string,
  userId: string,
  data: {
    category: ApplicationCategory;
    academicCycle?: string;
    requestedIntake?: number;
    landAreaAcres?: number;
    draftData?: Record<string, unknown>;
  }
) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!institution) {
    throw new InstitutionError('Institution not found.', 404);
  }

  const academicCycle = data.academicCycle || '2026-27';
  const tempRef = `DRAFT-${institution.region.slice(0, 2)}-${Date.now().toString().slice(-6)}`;

  const draft = await prisma.application.create({
    data: {
      applicationNumber: tempRef,
      permanentInstituteId: institution.permanentInstituteId,
      instituteName: institution.name,
      trustName: institution.trustName,
      category: data.category,
      institutionType: institution.institutionType,
      region: institution.region,
      state: institution.state,
      currentStage: ApplicationStage.SUBMITTED,
      priority: PriorityLevel.NORMAL,
      totalAgeingDays: 0,
      stageAgeingDays: 0,
      submissionDate: new Date(),
      pendingWithRole: UserRole.SCRUTINY_OFFICER,
      isDeficient: false,
      deficiencyCount: 0,
      landAreaAcres: data.landAreaAcres || 5.0,
      approvedIntake: 0,
      requestedIntake: data.requestedIntake || 180,
      academicCycle,
      isDraft: true,
      draftData: (data.draftData as any) || { step: 1 },
      institutionId: institution.id,
    },
  });

  await recordAuditEvent({
    actorId: userId,
    actorName: institution.name,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'APPLICATION_DRAFT_CREATED',
    actionTitle: 'Application Draft Created',
    entityType: 'APPLICATION',
    entityId: draft.id,
    details: `Draft created for category '${data.category}' (Cycle: ${academicCycle}).`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return draft;
};

/**
 * Updates an in-progress draft application.
 */
export const updateApplicationDraft = async (
  institutionId: string,
  applicationId: string,
  data: {
    category?: ApplicationCategory;
    requestedIntake?: number;
    landAreaAcres?: number;
    draftData?: Record<string, unknown>;
  }
) => {
  const existing = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
  });

  if (!existing) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  if (!existing.isDraft) {
    throw new InstitutionError('Submitted applications cannot be edited as drafts.', 400);
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      ...(data.category && { category: data.category }),
      ...(data.requestedIntake !== undefined && { requestedIntake: data.requestedIntake }),
      ...(data.landAreaAcres !== undefined && { landAreaAcres: data.landAreaAcres }),
      ...(data.draftData && { draftData: data.draftData as any }),
      lastUpdated: new Date(),
    },
  });

  return updated;
};

/**
 * Returns category-specific document checklist combined with currently uploaded documents.
 */
export const getCategoryChecklist = async (institutionId: string, applicationId: string) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  });

  if (!application) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  const checklistRules = CATEGORY_DOCUMENT_CHECKLIST[application.category] || [];

  const items = checklistRules.map((rule) => {
    const uploadedDocs = application.documents.filter((d) => d.documentType === rule.documentType);
    const isUploaded = uploadedDocs.length > 0;
    const latestDoc = isUploaded ? uploadedDocs[0] : null;

    return {
      documentType: rule.documentType,
      title: rule.title,
      description: rule.description,
      mandatory: rule.mandatory,
      aphClause: rule.aphClause,
      isUploaded,
      uploadedDocument: latestDoc
        ? {
            id: latestDoc.id,
            fileName: latestDoc.fileName,
            fileSize: latestDoc.fileSize,
            mimeType: latestDoc.mimeType,
            verificationStatus: latestDoc.verificationStatus,
            detectedDocumentType: latestDoc.detectedDocumentType,
            extractedFields: latestDoc.extractedFields,
            validationResults: latestDoc.validationResults,
            verificationExplanation: latestDoc.verificationExplanation,
            uploadedAt: latestDoc.createdAt.toISOString(),
          }
        : null,
    };
  });

  return items;
};

/**
 * Uploads an official application document, calculating hash and saving metadata in DB.
 */
export const uploadApplicationDocument = async (
  institutionId: string,
  applicationId: string,
  uploaderId: string,
  file: Express.Multer.File,
  documentType: DocumentType
) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
  });

  if (!application) {
    await removeTemporaryUpload(file.path);
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  if (!application.isDraft) {
    if (application.currentStage !== ApplicationStage.RE_SCRUTINY || !application.isDeficient) {
      await removeTemporaryUpload(file.path);
      throw new InstitutionError('Documents can only be uploaded to a draft or an application returned for correction.', 400);
    }
  }

  const applicableDocuments = CATEGORY_DOCUMENT_CHECKLIST[application.category] || [];
  if (!applicableDocuments.some((item) => item.documentType === documentType)) {
    await removeTemporaryUpload(file.path);
    throw new InstitutionError('This document type is not required for the application category.', 400);
  }

  let verification;
  try {
    verification = await verifyApplicationDocument(
      file.path,
      file.originalname,
      file.mimetype,
      documentType,
      application
    );
  } catch (error) {
    await removeTemporaryUpload(file.path);
    throw new InstitutionError(error instanceof Error ? error.message : 'The uploaded file failed validation.', 400);
  }

  let persisted = false;
  try {
    const fileHash = await computeFileHash(file.path);

    const doc = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} AND "institutionId" = ${institutionId} FOR UPDATE`;
      const currentApplication = await tx.application.findFirst({
        where: { id: applicationId, institutionId },
      });
      if (!currentApplication) {
        throw new InstitutionError('Application not found or unauthorized access.', 404);
      }
      if (!currentApplication.isDraft &&
        (currentApplication.currentStage !== ApplicationStage.RE_SCRUTINY || !currentApplication.isDeficient)) {
        throw new InstitutionError('Documents can only be uploaded to a draft or an application returned for correction.', 400);
      }
      if (!(CATEGORY_DOCUMENT_CHECKLIST[currentApplication.category] || []).some((item) => item.documentType === documentType)) {
        throw new InstitutionError('This document type is not required for the application category.', 400);
      }

      return tx.applicationDocument.create({
        data: {
          applicationId: currentApplication.id,
          institutionId,
          documentType,
          title: file.originalname,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          storageKey: file.filename,
          fileHash,
          verificationStatus: verification.status,
          detectedDocumentType: verification.detectedDocumentType,
          extractedFields: verification.extractedFields as Prisma.InputJsonValue,
          validationResults: verification.validationResults.map((result) => ({
            rule: result.rule,
            passed: result.passed,
            explanation: result.explanation,
          })) as unknown as Prisma.InputJsonValue,
          verificationExplanation: verification.explanation,
          ocrConfidence: verification.ocrConfidence,
          ocrMethod: verification.ocrMethod,
          ocrEvidence: verification.ocrEvidence as Prisma.InputJsonValue,
          remarks: verification.explanation,
          uploadedById: uploaderId,
        },
      });
    });
    persisted = true;

    await recordAuditEvent({
      actorId: uploaderId,
      actorName: application.instituteName,
      actorRole: UserRole.INSTITUTION_USER,
      actionCode: 'DOCUMENT_UPLOADED',
      actionTitle: 'Regulatory Document Uploaded',
      entityType: 'APPLICATION',
      entityId: application.id,
      details: `Uploaded '${file.originalname}' (${(file.size / 1024).toFixed(1)} KB, Type: ${documentType}, Verification: ${verification.status}, SHA-256: ${fileHash.slice(0, 10)}...).`,
      ipAddressMasked: '127.0.0.xxx',
    });

    return doc;
  } catch (error) {
    if (!persisted) await removeTemporaryUpload(file.path);
    throw error;
  }
};

/**
 * Runs deterministic preliminary checks against configured checklist and mandatory fields.
 */
export const runPreliminaryChecks = async (institutionId: string, applicationId: string) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  });

  if (!application) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  return evaluatePreliminaryChecks(application);
};

/**
 * Submits an application to the SAKSHAM queue via an atomic database transaction.
 */
export const submitApplication = async (
  institutionId: string,
  applicationId: string,
  userId: string,
  userFullName: string
) => {
  // Execute atomic submission transaction
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} AND "institutionId" = ${institutionId} FOR UPDATE`;
    const existing = await tx.application.findFirst({
      where: { id: applicationId, institutionId },
      include: { documents: { orderBy: { createdAt: 'desc' } } },
    });

    if (!existing) {
      throw new InstitutionError('Application not found.', 404);
    }

    if (!existing.isDraft) {
      throw new InstitutionError('Application has already been submitted to SAKSHAM.', 400);
    }

    const checks = evaluatePreliminaryChecks(existing);
    if (!checks.passed) {
      throw new InstitutionError(
        'Cannot submit application. Preliminary checks detected missing mandatory requirements.',
        400,
        checks.errors
      );
    }

    // Generate formal stable SAKSHAM application reference
    const count = await tx.application.count();
    const regionCode = existing.region.replace('_', '');
    const referenceNumber = `AICTE/2026/RO-${regionCode}/${11000 + count}`;

    const submittedApp = await tx.application.update({
      where: { id: applicationId },
      data: {
        applicationNumber: referenceNumber,
        isDraft: false,
        currentStage: ApplicationStage.SUBMITTED,
        pendingWithRole: UserRole.SCRUTINY_OFFICER,
        submissionDate: new Date(),
        lastUpdated: new Date(),
        totalAgeingDays: 0,
        stageAgeingDays: 0,
        priority: PriorityLevel.NORMAL,
      },
      include: {
        documents: true,
      },
    });

    // Create Notification
    await tx.notification.create({
      data: {
        recipientUserId: userId,
        institutionId: existing.institutionId,
        title: 'Application Successfully Submitted',
        message: `Your application has been submitted to SAKSHAM with reference ${referenceNumber}. It is now awaiting Scrutiny Officer evaluation.`,
        type: 'SUCCESS',
        link: `/institution/applications/${submittedApp.id}`,
      },
    });

    return submittedApp;
  });

  // Record audit log
  await recordAuditEvent({
    actorId: userId,
    actorName: userFullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'APPLICATION_SUBMITTED',
    actionTitle: 'Application Submitted to AICTE Scrutiny Queue',
    entityType: 'APPLICATION',
    entityId: result.id,
    details: `Application '${result.applicationNumber}' successfully submitted by '${userFullName}' for '${result.instituteName}'. Assigned to Scrutiny Officer pool.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return result;
};

export const resubmitCorrectedApplication = async (
  institutionId: string,
  applicationId: string,
  userId: string,
  userFullName: string
) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  });
  if (!application) throw new InstitutionError('Application not found.', 404);
  if (application.isDraft || application.currentStage !== ApplicationStage.RE_SCRUTINY || !application.isDeficient) {
    throw new InstitutionError('This application is not awaiting correction resubmission.', 409);
  }

  const requirements = (CATEGORY_DOCUMENT_CHECKLIST[application.category] || []).filter((item) => item.mandatory);
  const latestByType = new Map<DocumentType, ApplicationDocumentRecord>();
  for (const document of application.documents) {
    if (!latestByType.has(document.documentType)) latestByType.set(document.documentType, document);
  }
  const errors: string[] = [];
  const verifiedUpdates: Array<{ id: string; result: Awaited<ReturnType<typeof verifyApplicationDocument>> }> = [];

  for (const requirement of requirements) {
    const document = latestByType.get(requirement.documentType);
    if (!document) {
      errors.push(`Missing mandatory document: ${requirement.title}.`);
      continue;
    }
    const filePath = getStorageFilePath(document.storageKey);
    if (!filePath) {
      errors.push(`${requirement.title}: stored file is unavailable; upload a new copy.`);
      continue;
    }
    const result = await verifyApplicationDocument(
      filePath,
      document.fileName,
      document.mimeType,
      requirement.documentType,
      application
    );
    verifiedUpdates.push({ id: document.id, result });
    if (result.status !== 'VERIFIED') {
      errors.push(`${requirement.title}: ${result.explanation}`);
    }
  }
  if (errors.length) throw new InstitutionError('Correction resubmission failed document revalidation.', 400, errors);

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} AND "institutionId" = ${institutionId} FOR UPDATE`;
    const latestApplication = await tx.application.findFirst({
      where: { id: applicationId, institutionId },
      include: { documents: { orderBy: { createdAt: 'desc' } } },
    });
    if (!latestApplication || latestApplication.currentStage !== ApplicationStage.RE_SCRUTINY || !latestApplication.isDeficient) {
      throw new InstitutionError('Application correction state changed. Refresh and try again.', 409);
    }
    for (const update of verifiedUpdates) {
      const currentDocument = latestApplication.documents.find((item) => item.id === update.id);
      if (!currentDocument) throw new InstitutionError('Documents changed during revalidation. Please retry.', 409);
      await tx.applicationDocument.update({
        where: { id: update.id },
        data: {
          verificationStatus: update.result.status,
          detectedDocumentType: update.result.detectedDocumentType,
          extractedFields: update.result.extractedFields,
          validationResults: update.result.validationResults as unknown as Prisma.InputJsonValue,
          verificationExplanation: update.result.explanation,
          ocrConfidence: update.result.ocrConfidence,
          ocrMethod: update.result.ocrMethod,
          ocrEvidence: update.result.ocrEvidence as Prisma.InputJsonValue,
        },
      });
    }
    await tx.deficiencyNotice.updateMany({
      where: { applicationId, isReleased: true, status: 'ISSUED_PENDING_RESPONSE' },
      data: {
        status: 'AWAITING_OFFICER_REVIEW',
        institutionResponse: 'Corrected documents were resubmitted and revalidated.',
        responseSubmittedAt: new Date(),
      },
    });
    await tx.application.update({
      where: { id: applicationId },
      data: { isDeficient: false, pendingWithRole: UserRole.SCRUTINY_OFFICER, lastUpdated: new Date(), stageAgeingDays: 0 },
    });
    await tx.notification.create({
      data: {
        institutionId,
        title: 'Correction resubmission received',
        message: `Corrected documents for application ${application.applicationNumber} were revalidated and returned to officer scrutiny.`,
        type: 'SUCCESS',
        link: `/institution/applications/${applicationId}`,
      },
    });
    return tx.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { documents: { orderBy: { createdAt: 'desc' } }, deficiencyNotices: { orderBy: { createdAt: 'desc' } } },
    });
  });

  await recordAuditEvent({
    actorId: userId,
    actorName: userFullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'APPLICATION_CORRECTION_RESUBMITTED',
    actionTitle: 'Corrected Application Resubmitted',
    entityType: 'APPLICATION',
    entityId: applicationId,
    details: `Institution resubmitted corrected documents for application '${application.applicationNumber}' after OCR and document-rule revalidation.`,
    ipAddressMasked: '127.0.0.xxx',
  });
  return result;
};

/**
 * Retrieves released deficiency notices visible to the authenticated institution.
 */
export const getInstitutionDeficiencies = async (institutionId: string, applicationId?: string) => {
  const whereClause: any = {
    application: { institutionId },
    isReleased: true, // Only released notices are institution-visible
  };

  if (applicationId) {
    whereClause.applicationId = applicationId;
  }

  const notices = await prisma.deficiencyNotice.findMany({
    where: whereClause,
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          instituteName: true,
          currentStage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return notices;
};

/**
 * Submits an institution clarification / response to an active deficiency notice.
 */
export const respondToDeficiencyNotice = async (
  institutionId: string,
  noticeId: string,
  userId: string,
  userFullName: string,
  response: {
    responseText: string;
    documentRef?: string;
  }
) => {
  const notice = await prisma.deficiencyNotice.findFirst({
    where: {
      id: noticeId,
      application: { institutionId },
      isReleased: true,
    },
    include: { application: true },
  });

  if (!notice) {
    throw new InstitutionError('Deficiency notice not found or unauthorized access.', 404);
  }

  const updatedNotice = await prisma.deficiencyNotice.update({
    where: { id: noticeId },
    data: {
      institutionResponse: response.responseText.trim(),
      responseDocumentRef: response.documentRef?.trim() || null,
      responseSubmittedAt: new Date(),
      status: 'AWAITING_OFFICER_REVIEW',
    },
  });

  // Record audit log
  await recordAuditEvent({
    actorId: userId,
    actorName: userFullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'DEFICIENCY_RESPONSE_SUBMITTED',
    actionTitle: 'Institution Deficiency Clarification Submitted',
    entityType: 'DEFICIENCY_NOTICE',
    entityId: notice.id,
    details: `Clarification response submitted for Notice '${notice.noticeNumber}' on Application '${notice.application.applicationNumber}'.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return updatedNotice;
};

/**
 * Retrieves compliance undertakings associated with the authenticated institution.
 */
export const getInstitutionCompliance = async (institutionId: string) => {
  const complianceItems = await prisma.complianceItem.findMany({
    where: {
      application: { institutionId },
    },
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          instituteName: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return complianceItems;
};

/**
 * Submits evidence against a compliance undertaking.
 */
export const submitComplianceEvidence = async (
  institutionId: string,
  complianceId: string,
  userId: string,
  userFullName: string,
  documentRef: string
) => {
  const item = await prisma.complianceItem.findFirst({
    where: {
      id: complianceId,
      application: { institutionId },
    },
    include: { application: true },
  });

  if (!item) {
    throw new InstitutionError('Compliance obligation not found or unauthorized access.', 404);
  }

  const updated = await prisma.complianceItem.update({
    where: { id: complianceId },
    data: {
      status: ComplianceStatus.UNDER_REVIEW,
      submittedDocumentRef: documentRef.trim(),
    },
  });

  await recordAuditEvent({
    actorId: userId,
    actorName: userFullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'COMPLIANCE_EVIDENCE_SUBMITTED',
    actionTitle: 'Compliance Evidence Submitted',
    entityType: 'COMPLIANCE',
    entityId: item.id,
    details: `Evidence reference '${documentRef}' submitted for '${item.undertakingType}'.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return updated;
};

/**
 * Retrieves in-app notifications for the institution.
 */
export const getInstitutionNotifications = async (institutionId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { institutionId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return notifications;
};

/**
 * Marks a notification as read.
 */
export const markNotificationAsRead = async (institutionId: string, notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, institutionId },
  });

  if (!notification) {
    throw new InstitutionError('Notification not found.', 404);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};
