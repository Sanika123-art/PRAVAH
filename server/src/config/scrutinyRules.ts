import { DocumentType } from '@prisma/client';

export interface ScrutinyFieldRule {
  fieldName: string;
  applicationKey: string;
  documentKey: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  label: string;
  recommendation: string;
}

const identityRules: ScrutinyFieldRule[] = [
  {
    fieldName: 'institutionName',
    applicationKey: 'instituteName',
    documentKey: 'institutionName',
    severity: 'HIGH',
    label: 'Institution name',
    recommendation: 'Open the original document and verify the registered institution name.',
  },
  {
    fieldName: 'trustName',
    applicationKey: 'trustName',
    documentKey: 'trustName',
    severity: 'HIGH',
    label: 'Trust or society name',
    recommendation: 'Check the original evidence for the applicant trust or society name.',
  },
  {
    fieldName: 'institutionPid',
    applicationKey: 'permanentInstituteId',
    documentKey: 'institutionPid',
    severity: 'HIGH',
    label: 'Institution PID',
    recommendation: 'Confirm the permanent institution identifier against the application record.',
  },
];

const campusRules: ScrutinyFieldRule[] = [
  ...identityRules,
  {
    fieldName: 'institutionAddress',
    applicationKey: 'institutionAddress',
    documentKey: 'institutionAddress',
    severity: 'MEDIUM',
    label: 'Institution or campus address',
    recommendation: 'Inspect the address on the source document and confirm the campus location.',
  },
];

export const SCRUTINY_FIELD_RULES: Record<DocumentType, ScrutinyFieldRule[]> = {
  LAND_LEASE: [
    ...campusRules,
    {
      fieldName: 'landAreaAcres',
      applicationKey: 'landAreaAcres',
      documentKey: 'landAreaAcres',
      severity: 'HIGH',
      label: 'Campus land area',
      recommendation: 'Check the registered land evidence and confirm the stated land area.',
    },
  ],
  FIRE_SAFETY_NOC: campusRules,
  BUILDING_OCCUPANCY: campusRules,
  NBA_ACCREDITATION: identityRules,
  FDR_ENDOWMENT: identityRules,
};

export const SCRUTINY_RECOMMENDATIONS = {
  missingDocument: 'Request the required document from the institution.',
  wrongType: 'Open the original document and confirm its actual document type.',
  unreadable: 'Request a clearer copy or manually inspect the original pages.',
  lowConfidence: 'Inspect the cited page and confirm the OCR-extracted values.',
  missingRequiredField: 'Inspect the source page or request a copy showing the required identifier.',
  duplicateDocument: 'Review the duplicate uploads and confirm which document is current.',
  conflictingValue: 'Compare both values with the original evidence and confirm the correct value.',
  possibleSpellingDifference: 'Open the original document and verify whether this is a harmless spelling variation.',
};
