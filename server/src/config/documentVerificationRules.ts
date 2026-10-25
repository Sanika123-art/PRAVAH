import { ApplicationCategory, DocumentType } from '@prisma/client';

export interface DocumentVerificationRule {
  permittedFormats: Array<{
    extension: string;
    mimeType: string;
  }>;
  keywordGroups: string[][];
  minimumKeywordGroups: number;
  requiredFields: Array<{
    key: string;
    label: string;
    pattern: RegExp;
    minimumValue?: number;
  }>;
}

const pdfAndImageFormats = [
  { extension: '.pdf', mimeType: 'application/pdf' },
  { extension: '.jpg', mimeType: 'image/jpeg' },
  { extension: '.jpeg', mimeType: 'image/jpeg' },
  { extension: '.png', mimeType: 'image/png' },
];

export const DOCUMENT_VERIFICATION_RULES: Record<DocumentType, DocumentVerificationRule> = {
  LAND_LEASE: {
    permittedFormats: pdfAndImageFormats,
    keywordGroups: [
      ['lease deed', 'land deed', 'sale deed', 'conveyance deed', 'allotment order', 'ownership title'],
      ['registered', 'registration number', 'sub-registrar', 'registration no'],
      ['lease period', 'lease term', 'survey number', 'plot number', 'land area', 'ownership'],
    ],
    minimumKeywordGroups: 2,
    requiredFields: [
      {
        key: 'documentNumber',
        label: 'registration or deed number',
        pattern: /\b(?:registration|registered deed|deed|document)\s*(?:no\.?\s*[:#]?\s*|number\s*[:#:]?\s*|#\s*|:\s*)([A-Z0-9][A-Z0-9/-]{2,})/i,
      },
      {
        key: 'leaseTermYears',
        label: 'lease term of at least 30 years',
        pattern: /\b(?:lease(?:\s+(?:period|term))?\s*[:\-]?\s*)(\d{1,3})\s*(?:years?|yrs?)\b|\b(\d{1,3})\s*(?:years?|yrs?)\s+(?:registered\s+)?lease\b/i,
        minimumValue: 30,
      },
    ],
  },
  FIRE_SAFETY_NOC: {
    permittedFormats: pdfAndImageFormats,
    keywordGroups: [
      ['fire safety', 'fire and rescue', 'fire prevention', 'fire protection'],
      ['no objection certificate', 'noc', 'fire clearance', 'safety certificate'],
      ['chief fire officer', 'fire services', 'fire department', 'fire authority'],
    ],
    minimumKeywordGroups: 2,
    requiredFields: [
      {
        key: 'certificateNumber',
        label: 'fire certificate or NOC number',
        pattern: /\b(?:certificate|noc|reference|ref)\s*(?:no\.?(?:\s*[:#]\s*|\s+(?!objection\b))|number\s*[:#:]?\s*|#\s*|:\s*)\s*([A-Z0-9][A-Z0-9/-]{2,})/i,
      },
    ],
  },
  BUILDING_OCCUPANCY: {
    permittedFormats: pdfAndImageFormats,
    keywordGroups: [
      ['occupancy certificate', 'completion certificate', 'building occupancy'],
      ['building plan', 'sanctioned plan', 'structural stability', 'structural engineer'],
      ['municipal corporation', 'development authority', 'public works department', 'competent authority'],
    ],
    minimumKeywordGroups: 2,
    requiredFields: [
      {
        key: 'certificateNumber',
        label: 'occupancy or approval certificate number',
        pattern: /\b(?:certificate|approval|occupancy|completion|reference)\s*(?:no\.?\s*[:#]?\s*|number\s*[:#:]?\s*|#\s*|:\s*)([A-Z0-9][A-Z0-9/-]{2,})/i,
      },
    ],
  },
  NBA_ACCREDITATION: {
    permittedFormats: pdfAndImageFormats,
    keywordGroups: [
      ['national board of accreditation', 'nba accreditation'],
      ['accreditation certificate', 'accredited programme', 'accreditation status'],
      ['validity period', 'valid up to', 'accreditation period'],
    ],
    minimumKeywordGroups: 2,
    requiredFields: [
      {
        key: 'certificateNumber',
        label: 'NBA certificate or reference number',
        pattern: /\b(?:certificate|accreditation|reference)\s*(?:no\.?\s*[:#]?\s*|number\s*[:#:]?\s*|#\s*|:\s*)([A-Z0-9][A-Z0-9/-]{2,})/i,
      },
    ],
  },
  FDR_ENDOWMENT: {
    permittedFormats: pdfAndImageFormats,
    keywordGroups: [
      ['fixed deposit receipt', 'fixed deposit', 'term deposit'],
      ['endowment fund', 'aicte endowment', 'joint names'],
      ['bank', 'deposit amount', 'maturity date', 'deposit receipt'],
    ],
    minimumKeywordGroups: 2,
    requiredFields: [
      {
        key: 'receiptNumber',
        label: 'fixed-deposit receipt or account number',
        pattern: /\b(?:receipt|fdr|deposit|account)\s*(?:no\.?\s*[:#]?\s*|number\s*[:#:]?\s*|#\s*|:\s*)([A-Z0-9][A-Z0-9/-]{2,})/i,
      },
    ],
  },
};

export const CATEGORY_DOCUMENT_VERIFICATION_RULES: Partial<
  Record<ApplicationCategory, Partial<Record<DocumentType, DocumentVerificationRule>>>
> = {
  EOA_EXISTING: {
    LAND_LEASE: {
      permittedFormats: pdfAndImageFormats,
      keywordGroups: [
        ['lease continuity certificate', 'lease continuity', 'land ownership certificate'],
        ['unencumbered', 'continuous lease', 'lease validity', 'validity period'],
        ['sub-registrar', 'registered lease', 'ownership title'],
      ],
      minimumKeywordGroups: 2,
      requiredFields: [{
        key: 'documentNumber',
        label: 'lease continuity or certificate reference number',
        pattern: /\b(?:reference|certificate|document|lease)\s*(?:no\.?\s*[:#]?\s*|number\s*[:#:]?\s*|#\s*|:\s*)([A-Z0-9][A-Z0-9/-]{2,})/i,
      }],
    },
  },
  INTAKE_INCREASE: {
    BUILDING_OCCUPANCY: {
      permittedFormats: pdfAndImageFormats,
      keywordGroups: [
        ['built-up area', 'carpet area', 'instructional area'],
        ['additional area', 'expanded facilities', 'expansion'],
        ['sanctioned building plan', 'competent authority', 'municipal corporation'],
      ],
      minimumKeywordGroups: 2,
      requiredFields: [{
        key: 'certificateNumber',
        label: 'building or area approval certificate number',
        pattern: /\b(?:certificate|approval|occupancy|completion|reference)\s*(?:no\.?\s*[:#]?\s*|number\s*[:#:]?\s*|#\s*|:\s*)([A-Z0-9][A-Z0-9/-]{2,})/i,
      }],
    },
  },
  WOMEN_TO_COED: {
    BUILDING_OCCUPANCY: {
      permittedFormats: pdfAndImageFormats,
      keywordGroups: [
        ['common room', 'restroom', 'toilet'],
        ['security amenities', 'women security', 'security arrangements', 'security'],
        ['co-education', 'coeducation', 'modified infrastructure'],
      ],
      minimumKeywordGroups: 2,
      requiredFields: [],
    },
  },
  CLOSURE: {
    BUILDING_OCCUPANCY: {
      permittedFormats: pdfAndImageFormats,
      keywordGroups: [
        ['trustees resolution', 'governing body resolution', 'society resolution', 'progressive closure', 'closure resolution'],
        ['affiliating university', 'state government', 'state govt', 'no objection'],
        ['meeting resolution', 'board resolution', 'university no objection'],
      ],
      minimumKeywordGroups: 2,
      requiredFields: [{
        key: 'resolutionNumber',
        label: 'governing body resolution number',
        pattern: /\b(?:resolution|meeting|reference)\s*(?:no\.?\s*[:#]?\s*|number\s*[:#:]?\s*|#\s*|:\s*)([A-Z0-9][A-Z0-9/-]{2,})/i,
      }],
    },
  },
};

export const getDocumentVerificationRule = (
  category: ApplicationCategory,
  documentType: DocumentType
): DocumentVerificationRule =>
  CATEGORY_DOCUMENT_VERIFICATION_RULES[category]?.[documentType] || DOCUMENT_VERIFICATION_RULES[documentType];
