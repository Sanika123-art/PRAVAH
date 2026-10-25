import { apiGet, apiPatch, apiPost } from './apiClient';
import { Application, ApplicationDocument } from '@saksham/shared';

export interface ApplicationFilterOptions {
  search?: string;
  stage?: string;
  region?: string;
  priority?: string;
  category?: string;
  limit?: number;
  offset?: number;
  recordType?: 'ALL' | 'REAL' | 'DEMO';
}

export interface ApplicationsResponse {
  success: boolean;
  total: number;
  data: Application[];
}

export interface ApplicationDetailResponse {
  success: boolean;
  data: Application & {
    scrutinyFindings?: any[];
    evcInspections?: any[];
    complianceItems?: any[];
    validityDocuments?: any[];
  };
}

export interface ScrutinyFinding {
  id: string;
  documentId: string | null;
  fieldName: string;
  applicationValue: string | null;
  documentValue: string | null;
  findingType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  evidence: string | null;
  evidencePage: number | null;
  ocrConfidence: number | null;
  recommendedAction: string;
  reviewState: 'PENDING' | 'CONFIRMED' | 'DISMISSED' | 'RESOLVED';
  officerNotes: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  overrideByName: string | null;
  overrideAt: string | null;
  overrideReason: string | null;
}

export interface ScrutinyComparison {
  documentId: string;
  documentType: string;
  fieldName: string;
  label: string;
  applicationValue: string | null;
  documentValue: string | null;
  result: 'EXACT_MATCH' | 'NORMALIZED_MATCH' | 'POSSIBLE_SPELLING_DIFFERENCE' | 'CONFLICT' | 'NOT_EXTRACTED' | 'NOT_COMPARABLE';
  explanation: string;
}

export interface ScrutinyWorkbench {
  application: Application & {
    institution?: { address: string | null; district: string | null } | null;
    documents: ApplicationDocument[];
    deficiencyNotices: Array<{ id: string; noticeNumber: string; title: string; description: string; status: string; createdAt: string }>;
    scrutinyRuns: Array<{ id: string; officerName: string; createdAt: string; findings: ScrutinyFinding[] }>;
    officerDecisions: Array<{ id: string; decision: string; officerName: string; remarks: string; previousStage: string; resultingStage: string; createdAt: string; overriddenFindingIds: string[] }>;
  };
  latestRun: ScrutinyWorkbench['application']['scrutinyRuns'][number] | null;
  comparisons: ScrutinyComparison[];
}

export const fetchApplications = async (
  filters: ApplicationFilterOptions = {}
): Promise<ApplicationsResponse> => {
  return apiGet<ApplicationsResponse>('/applications', {
    search: filters.search,
    stage: filters.stage && filters.stage !== 'ALL' ? filters.stage : undefined,
    region: filters.region && filters.region !== 'ALL' ? filters.region : undefined,
    priority: filters.priority && filters.priority !== 'ALL' ? filters.priority : undefined,
    category: filters.category && filters.category !== 'ALL' ? filters.category : undefined,
    limit: filters.limit,
    offset: filters.offset,
    recordType: filters.recordType && filters.recordType !== 'ALL' ? filters.recordType : undefined,
  });
};

export const fetchApplicationById = async (
  id: string
): Promise<ApplicationDetailResponse> => {
  return apiGet<ApplicationDetailResponse>(`/applications/${encodeURIComponent(id)}`);
};

export const fetchScrutinyWorkbench = async (id: string): Promise<ScrutinyWorkbench> => {
  const response = await apiGet<{ success: boolean; data: ScrutinyWorkbench }>(`/applications/${encodeURIComponent(id)}/scrutiny`);
  return response.data;
};

export const analyzeApplicationScrutiny = async (id: string) => {
  const response = await apiPost<{ success: boolean; data: ScrutinyWorkbench['latestRun'] }>(
    `/applications/${encodeURIComponent(id)}/scrutiny/analyze`,
    {}
  );
  return response.data;
};

export const reviewApplicationFinding = async (
  applicationId: string,
  findingId: string,
  reviewState: ScrutinyFinding['reviewState'],
  note: string
) => apiPatch<{ success: boolean; data: ScrutinyFinding }>(
  `/applications/${encodeURIComponent(applicationId)}/scrutiny/findings/${encodeURIComponent(findingId)}`,
  { reviewState, note }
);

export const saveApplicationDecision = async (
  applicationId: string,
  data: {
    decision: 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT';
    remarks: string;
    affectedFindingIds?: string[];
    overrideFindingIds?: string[];
    overrideReason?: string;
  }
) => apiPost<{ success: boolean; data: { decision: unknown; resultingStage: string } }>(
  `/applications/${encodeURIComponent(applicationId)}/scrutiny/decision`,
  data
);
