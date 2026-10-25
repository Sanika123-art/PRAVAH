import fs from 'fs';
import { Application, ApplicationCategory, DocumentType } from '@prisma/client';
import { DOCUMENT_VERIFICATION_RULES, getDocumentVerificationRule } from '../config/documentVerificationRules';
import { extractDocumentText, validateDocumentContent } from './documentTextExtractionService';

export type DocumentVerificationStatus = 'VERIFIED' | 'REJECTED' | 'MANUAL_REVIEW';

export interface DocumentRuleResult {
  rule: string;
  passed: boolean;
  explanation: string;
}

export interface DocumentVerificationResult {
  status: DocumentVerificationStatus;
  detectedDocumentType: DocumentType | null;
  extractedFields: Record<string, string | null>;
  validationResults: DocumentRuleResult[];
  explanation: string;
  ocrConfidence: number | null;
  ocrMethod: string;
  ocrEvidence: Array<{ page: number; excerpt: string; confidence: number | null }>;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const matchedOrganization = (text: string, organizations: string[]): string | null => {
  const normalizedText = normalize(text);
  for (const organization of organizations) {
    const tokens = normalize(organization).split(/\s+/).filter((token) => token.length > 2);
    if (tokens.length === 0) continue;
    const matchingTokens = tokens.filter((token) => normalizedText.includes(token)).length;
    if (matchingTokens / tokens.length >= 0.6) return organization;
  }
  return null;
};

const extractField = (text: string, pattern: RegExp): string | null => {
  const match = text.match(pattern);
  return match?.slice(1).find((value) => value)?.trim() || null;
};

const extractNamedOrganization = (text: string, labels: RegExp, expectedName: string): string | null => {
  const labeled = text.match(labels)?.[1]?.trim();
  if (labeled) return labeled.slice(0, 160);
  const escapedName = expectedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.match(new RegExp(escapedName, 'i'))?.[0] || null;
};

const organizationFields = (
  text: string,
  application: Pick<Application, 'instituteName' | 'trustName'>
) => ({
  institutionName: extractNamedOrganization(
    text,
    /\b(?:institution|institute|college|applicant)\s+name\s*[:\-]\s*([^\n|]{3,160})/i,
    application.instituteName
  ),
  trustName: extractNamedOrganization(
    text,
    /\b(?:trust|society|sponsoring\s+body)\s+name\s*[:\-]\s*([^\n|]{3,160})/i,
    application.trustName
  ),
  institutionPid: extractField(text, /\b(?:institution\s*(?:pid|id)|pid)\s*[:#\-]\s*([A-Z0-9/-]{3,})/i),
  institutionAddress: extractField(text, /\b(?:institution|campus|property)\s+address\s*[:\-]\s*([^\n|]{3,160})/i),
});

const extractRelevantFields = (
  rule: (typeof DOCUMENT_VERIFICATION_RULES)[DocumentType],
  text: string,
  organizationName: string | null
) => ({
  organizationName,
  documentDate: extractField(text, /\b(?:date|dated|issued on)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})/i),
  ...Object.fromEntries(rule.requiredFields.map((field) => [field.key, extractField(text, field.pattern)])),
});

const fieldRuleResults = (
  rule: (typeof DOCUMENT_VERIFICATION_RULES)[DocumentType],
  text: string
): DocumentRuleResult[] =>
  rule.requiredFields.map((field) => {
    const value = extractField(text, field.pattern);
    const numericValue = value ? Number(value) : null;
    const passesMinimum = field.minimumValue === undefined || (numericValue !== null && numericValue >= field.minimumValue);
    return {
      rule: field.label,
      passed: Boolean(value) && passesMinimum,
      explanation: !value
        ? `Required ${field.label} was not found.`
        : passesMinimum
          ? `Found ${field.label}: ${value}.`
          : `Found ${value} years; a minimum of ${field.minimumValue} years is required.`,
    };
  });

const typeScores = (text: string, category: ApplicationCategory) => {
  const normalizedText = normalize(text);
  return (Object.entries(DOCUMENT_VERIFICATION_RULES) as Array<[DocumentType, (typeof DOCUMENT_VERIFICATION_RULES)[DocumentType]]>)
    .map(([documentType]) => {
      const rule = getDocumentVerificationRule(category, documentType);
      return {
        documentType,
        groupsMatched: rule.keywordGroups.filter((group) =>
          group.some((keyword) => normalizedText.includes(normalize(keyword)))
        ).length,
        minimumKeywordGroups: rule.minimumKeywordGroups,
      };
    })
    .sort((a, b) => b.groupsMatched - a.groupsMatched);
};

export const verifyApplicationDocument = async (
  filePath: string,
  originalName: string,
  declaredMimeType: string,
  expectedDocumentType: DocumentType,
  application: Pick<Application, 'category' | 'instituteName' | 'trustName'>
): Promise<DocumentVerificationResult> => {
  const expectedRule = getDocumentVerificationRule(application.category, expectedDocumentType);
  const { mimeType } = await validateDocumentContent(
    filePath,
    declaredMimeType,
    originalName,
    expectedRule.permittedFormats
  );
  try {
    const extraction = await extractDocumentText(filePath, mimeType);
    const text = extraction.text.trim();
    const extractionMetadata = {
      ocrConfidence: extraction.confidence,
      ocrMethod: extraction.method,
      ocrEvidence: extraction.evidence,
    };

    if (extraction.explanation || text.length < 80 || (extraction.method.includes('OCR') && (extraction.confidence ?? 0) < 40)) {
      return {
        ...extractionMetadata,
        status: 'MANUAL_REVIEW',
        detectedDocumentType: null,
        extractedFields: {},
        validationResults: [{
          rule: 'Readable document text',
          passed: false,
          explanation: extraction.explanation || 'Text could not be read reliably; an authorized officer must review this document.',
        }],
        explanation: extraction.explanation || 'Text could not be read reliably; an authorized officer must review this document.',
      };
    }

    const scores = typeScores(text, application.category);
    const expectedScore = scores.find((score) => score.documentType === expectedDocumentType)!;
    const organizationName = matchedOrganization(text, [application.instituteName, application.trustName]);
    const commonFields = {
      organizationName,
      documentDate: extractField(text, /\b(?:date|dated|issued on)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})/i),
      ...organizationFields(text, application),
    };
    const bestAlternative = scores
      .filter((score) => score.documentType !== expectedDocumentType && score.groupsMatched >= score.minimumKeywordGroups)
      .sort((a, b) => b.groupsMatched - a.groupsMatched)[0];
    if (
      bestAlternative &&
      bestAlternative.groupsMatched > expectedScore.groupsMatched
    ) {
      const detectedRule = getDocumentVerificationRule(application.category, bestAlternative.documentType);
      const extractedFields = extractRelevantFields(detectedRule, text, organizationName);
      return {
        ...extractionMetadata,
        status: 'REJECTED',
        detectedDocumentType: bestAlternative.documentType,
        extractedFields,
        validationResults: [
          {
            rule: 'Expected document type',
            passed: false,
            explanation: `The document content matches ${bestAlternative.documentType.replace(/_/g, ' ')} rather than ${expectedDocumentType.replace(/_/g, ' ')}.`,
          },
          ...fieldRuleResults(detectedRule, text),
        ],
        explanation: `The document content appears to be ${bestAlternative.documentType.replace(/_/g, ' ')}, not the requested ${expectedDocumentType.replace(/_/g, ' ')}.`,
      };
    }

    if (bestAlternative && bestAlternative.groupsMatched === expectedScore.groupsMatched) {
      return {
        ...extractionMetadata,
        status: 'MANUAL_REVIEW',
        detectedDocumentType: null,
        extractedFields: {
          ...commonFields,
          ...Object.fromEntries(expectedRule.requiredFields.map((field) => [field.key, extractField(text, field.pattern)])),
        },
        validationResults: [{
          rule: 'Unambiguous document type',
          passed: false,
          explanation: `Content indicators equally match ${expectedDocumentType.replace(/_/g, ' ')} and ${bestAlternative.documentType.replace(/_/g, ' ')}.`,
        }],
        explanation: 'The document type is ambiguous and requires authorized officer review.',
      };
    }

    if (expectedScore.groupsMatched < expectedRule.minimumKeywordGroups) {
      return {
        ...extractionMetadata,
        status: 'MANUAL_REVIEW',
        detectedDocumentType: null,
        extractedFields: {
          ...commonFields,
          ...Object.fromEntries(expectedRule.requiredFields.map((field) => [field.key, extractField(text, field.pattern)])),
        },
        validationResults: [{
          rule: 'Expected document type',
          passed: false,
          explanation: `Only ${expectedScore.groupsMatched} of ${expectedRule.minimumKeywordGroups} required document-content indicators were found.`,
        }],
        explanation: 'The document type could not be identified with sufficient confidence. An authorized officer must review it.',
      };
    }

    const extractedFields: Record<string, string | null> = { ...commonFields };
    const matchedIndicators = expectedRule.keywordGroups
      .map((group) => group.find((keyword) => normalize(text).includes(normalize(keyword))))
      .filter((keyword): keyword is string => Boolean(keyword));
    const validationResults: DocumentRuleResult[] = [{
      rule: 'Document type content indicators',
      passed: matchedIndicators.length >= expectedRule.minimumKeywordGroups,
      explanation: `Matched ${matchedIndicators.length} of ${expectedRule.minimumKeywordGroups} required indicators${matchedIndicators.length ? `: ${matchedIndicators.join(', ')}` : '.'}`,
    }];
    validationResults.push({
      rule: 'Applicant institution or trust name',
      passed: Boolean(organizationName),
      explanation: organizationName ? `Matched applicant name "${organizationName}".` : 'The institution and trust names were not found in the readable document text.',
    });

    Object.assign(extractedFields, extractRelevantFields(expectedRule, text, organizationName));
    validationResults.push(...fieldRuleResults(expectedRule, text));

    const failedRules = validationResults.filter((result) => !result.passed);
    if (failedRules.length) {
      return {
        ...extractionMetadata,
        status: 'REJECTED',
        detectedDocumentType: expectedDocumentType,
        extractedFields,
        validationResults,
        explanation: `Mandatory document checks failed: ${failedRules.map((result) => result.rule).join(', ')}.`,
      };
    }

    return {
      ...extractionMetadata,
      status: 'VERIFIED',
      detectedDocumentType: expectedDocumentType,
      extractedFields,
      validationResults,
      explanation: 'Automated document-type and required-field checks passed. This result does not establish authenticity or grant application approval.',
    };
  } catch (error) {
    console.error('Document text extraction failed; document retained for manual review.', error);
    return {
      ocrConfidence: null,
      ocrMethod: 'NONE',
      ocrEvidence: [],
      status: 'MANUAL_REVIEW',
      detectedDocumentType: null,
      extractedFields: {},
      validationResults: [{
        rule: 'Document readability',
        passed: false,
        explanation: 'Text extraction or OCR failed; an authorized officer must review this document.',
      }],
      explanation: 'Text extraction or OCR failed; the document is retained for authorized officer review.',
    };
  }
};

export const removeTemporaryUpload = async (filePath: string): Promise<void> => {
  await fs.promises.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
};
