import { Request, Response, NextFunction } from 'express';
import {
  getApplicationsFromDb,
  getApplicationByIdFromDb,
  transitionApplicationStage,
} from '../services/applicationService';
import {
  createDraftDeficiencyNotice,
  releaseDeficiencyNotice,
  reviewDeficiencyResponse,
} from '../services/deficiencyService';
import { ApplicationStage, UserRole } from '@prisma/client';
import { z } from 'zod';
import {
  analyzeApplicationScrutiny,
  getScrutinyWorkbench,
  recordOfficerDecision,
  reviewScrutinyFinding,
  ScrutinyWorkflowError,
} from '../services/officerScrutinyService';
import { OfficerDecisionType, ScrutinyReviewState } from '@prisma/client';

const sendScrutinyError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof ScrutinyWorkflowError) {
    res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
    return;
  }
  next(error);
};

export const getScrutiny = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getScrutinyWorkbench(req.params.id, req.user!.role as UserRole, req.user!.region || null);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    sendScrutinyError(error, res, next);
  }
};

export const analyzeScrutiny = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyzeApplicationScrutiny(req.params.id, {
      id: req.user!.id,
      fullName: req.user!.fullName,
      role: req.user!.role as UserRole,
      region: req.user!.region || null,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    sendScrutinyError(error, res, next);
  }
};

export const reviewScrutiny = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      reviewState: z.nativeEnum(ScrutinyReviewState),
      note: z.string().trim().min(5).max(2000),
    }).safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ success: false, error: { message: 'A valid review state and a 5 to 2,000 character officer note are required.', statusCode: 400 } });
      return;
    }
    const result = await reviewScrutinyFinding(req.params.id, req.params.findingId, body.data, {
      id: req.user!.id,
      fullName: req.user!.fullName,
      role: req.user!.role as UserRole,
      region: req.user!.region || null,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    sendScrutinyError(error, res, next);
  }
};

export const decideScrutiny = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      decision: z.nativeEnum(OfficerDecisionType),
      remarks: z.string().trim().min(10).max(4000),
      affectedFindingIds: z.array(z.string().uuid()).max(100).optional(),
      overrideFindingIds: z.array(z.string().uuid()).max(100).optional(),
      overrideReason: z.string().trim().max(2000).optional(),
    }).safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ success: false, error: { message: 'Decision, meaningful remarks, and valid finding references are required.', statusCode: 400 } });
      return;
    }
    const result = await recordOfficerDecision(req.params.id, body.data, {
      id: req.user!.id,
      fullName: req.user!.fullName,
      role: req.user!.role as UserRole,
      region: req.user!.region || null,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    sendScrutinyError(error, res, next);
  }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, stage, region, priority, category, limit, offset, recordType } = req.query;

    let effectiveRegion = typeof region === 'string' ? region : undefined;

    // Enforce Regional Boundary for Regional Officers
    if (req.user?.role === 'REGIONAL_OFFICER' && req.user.region) {
      if (effectiveRegion && effectiveRegion.toUpperCase() !== req.user.region) {
        res.status(403).json({
          success: false,
          error: {
            message: `Jurisdiction violation: Regional Officer assigned to '${req.user.region}' cannot query '${effectiveRegion}' records.`,
            statusCode: 403,
          },
        });
        return;
      }
      effectiveRegion = req.user.region;
    }

    const result = await getApplicationsFromDb({
      search: typeof search === 'string' ? search : undefined,
      stage: typeof stage === 'string' ? stage : undefined,
      region: effectiveRegion,
      priority: typeof priority === 'string' ? priority : undefined,
      category: typeof category === 'string' ? category : undefined,
      recordType: recordType === 'REAL' || recordType === 'DEMO' ? recordType : 'ALL',
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json({
      success: true,
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid or missing application identifier parameter.', statusCode: 400 },
      });
      return;
    }

    const application = await getApplicationByIdFromDb(id);

    if (!application) {
      res.status(404).json({
        success: false,
        error: { message: `Application with ID or number '${id}' not found in database.`, statusCode: 404 },
      });
      return;
    }

    // Record-Level Regional Access Enforcement
    if (req.user?.role === 'REGIONAL_OFFICER' && req.user.region) {
      if (application.region !== req.user.region) {
        res.status(403).json({
          success: false,
          error: {
            message: `Access denied: Regional Officer assigned to '${req.user.region}' cannot view application belonging to '${application.region}'.`,
            statusCode: 403,
          },
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const createDeficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { parameterName, requirementRef, title, description, dueDate } = req.body;

    if (!title || !description || !parameterName) {
      res.status(400).json({
        success: false,
        error: { message: 'Title, description, and parameterName are required.', statusCode: 400 },
      });
      return;
    }

    const notice = await createDraftDeficiencyNotice({
      applicationId: id,
      parameterName,
      requirementRef: requirementRef || 'APH 2024-27 Scrutiny Norms',
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      officerId: req.user!.id,
      officerName: req.user!.fullName,
      officerRole: req.user!.role as UserRole,
    });

    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

export const releaseDeficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noticeId } = req.params;

    const notice = await releaseDeficiencyNotice(
      noticeId,
      req.user!.id,
      req.user!.fullName,
      req.user!.role as UserRole
    );

    res.status(200).json({
      success: true,
      data: notice,
      message: `Deficiency notice ${notice.noticeNumber} formally released to institution.`,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewDeficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noticeId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!status || !reviewNotes) {
      res.status(400).json({
        success: false,
        error: { message: 'Status (RESOLVED_SATISFIED | REJECTED_UNSATISFACTORY) and reviewNotes are required.', statusCode: 400 },
      });
      return;
    }

    const notice = await reviewDeficiencyResponse(
      noticeId,
      req.user!.id,
      req.user!.fullName,
      req.user!.role as UserRole,
      { status, reviewNotes }
    );

    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

export const transitionStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newStage, remarks } = req.body;

    if (!newStage || !Object.values(ApplicationStage).includes(newStage)) {
      res.status(400).json({
        success: false,
        error: { message: `Invalid stage. Valid stages: ${Object.values(ApplicationStage).join(', ')}`, statusCode: 400 },
      });
      return;
    }

    const updated = await transitionApplicationStage(
      id,
      newStage as ApplicationStage,
      req.user!.id,
      req.user!.fullName,
      req.user!.role as UserRole,
      remarks
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
