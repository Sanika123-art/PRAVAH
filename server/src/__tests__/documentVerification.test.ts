import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { ApplicationCategory } from '@prisma/client';
import { CATEGORY_DOCUMENT_CHECKLIST } from '@saksham/shared';
import { DOCUMENT_VERIFICATION_RULES, getDocumentVerificationRule } from '../config/documentVerificationRules';
import { verifyApplicationDocument } from '../services/documentVerificationService';
import { extractDocumentText } from '../services/documentTextExtractionService';
import { createSyntheticPdf } from './helpers/syntheticPdf';

const organization = {
  category: 'NEW_INSTITUTE' as const,
  instituteName: 'Apex Institute of Technological Excellence',
  trustName: 'Apex Educational Charitable Trust',
};

const fireCertificate = [
  'FIRE SAFETY CERTIFICATE',
  'NO OBJECTION CERTIFICATE FOR CAMPUS FIRE SAFETY',
  'Issued by the Chief Fire Officer, State Fire Services Authority',
  'Certificate No: FS-2026-9912',
  'Date: 12/05/2026',
  organization.instituteName,
  organization.trustName,
  'This fire safety clearance applies to the institution campus and its academic buildings.',
  'The certificate confirms fire prevention and protection arrangements at the premises.',
];

const temporaryFiles: string[] = [];

const createTemporaryFile = async (extension: string, contents: Buffer) => {
  const filePath = path.join(os.tmpdir(), `saksham-document-${Date.now()}-${Math.random()}${extension}`);
  await fs.promises.writeFile(filePath, contents);
  temporaryFiles.push(filePath);
  return filePath;
};

const createSyntheticScannedImage = (lines: string[]) => {
  const canvas = createCanvas(2200, 1600);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 2200, 1600);
  context.fillStyle = '#000';
  context.font = '48px Arial';
  lines.forEach((line, index) => context.fillText(line, 100, 120 + index * 130));
  return canvas.toBuffer('image/png');
};

afterEach(async () => {
  await Promise.all(temporaryFiles.splice(0).map((filePath) => fs.promises.unlink(filePath).catch(() => undefined)));
});

describe('document OCR and rule verification', () => {
  it('verifies an actual synthetic PDF when its type, institution, and required fields match', async () => {
    const filePath = await createTemporaryFile('.pdf', createSyntheticPdf(fireCertificate));
    const result = await verifyApplicationDocument(filePath, 'fire-certificate.pdf', 'application/pdf', 'FIRE_SAFETY_NOC', organization);

    expect(result.status).toBe('VERIFIED');
    expect(result.detectedDocumentType).toBe('FIRE_SAFETY_NOC');
    expect(result.extractedFields.certificateNumber).toBe('FS-2026-9912');
    expect(result.validationResults.every((rule) => rule.passed)).toBe(true);
    expect(result.explanation).toContain('does not establish authenticity');
  });

  it('verifies a synthetic scanned image using OCR rather than filename or extension', async () => {
    const filePath = await createTemporaryFile('.png', createSyntheticScannedImage(fireCertificate));
    const result = await verifyApplicationDocument(filePath, 'fire-certificate.png', 'image/png', 'FIRE_SAFETY_NOC', organization);

    expect(result.status).toBe('VERIFIED');
    expect(result.detectedDocumentType).toBe('FIRE_SAFETY_NOC');
    expect(result.extractedFields.certificateNumber).toMatch(/FS.?2026.?9912/i);
  }, 30000);

  it('rejects a readable document that clearly belongs to another configured type', async () => {
    const filePath = await createTemporaryFile('.pdf', createSyntheticPdf(fireCertificate));
    const result = await verifyApplicationDocument(filePath, 'fixed-deposit.pdf', 'application/pdf', 'FDR_ENDOWMENT', organization);

    expect(result.status).toBe('REJECTED');
    expect(result.detectedDocumentType).toBe('FIRE_SAFETY_NOC');
    expect(result.extractedFields.certificateNumber).toBe('FS-2026-9912');
    expect(result.validationResults.some((rule) => rule.rule === 'Expected document type' && !rule.passed)).toBe(true);
  });

  it('routes equally matching document types to manual review', async () => {
    const ambiguousDocument = [
      'FIRE SAFETY CERTIFICATE',
      'NO OBJECTION CERTIFICATE FOR FIRE CLEARANCE',
      'FIXED DEPOSIT',
      'AICTE ENDOWMENT FUND held in joint names',
      'FDR No: SBI-2026-7712',
      'Certificate No: FS-2026-9912',
      organization.instituteName,
      organization.trustName,
      'The institution certificate covers fire safety and deposit documentation for its campus.',
    ];
    const filePath = await createTemporaryFile('.pdf', createSyntheticPdf(ambiguousDocument));
    const result = await verifyApplicationDocument(filePath, 'ambiguous.pdf', 'application/pdf', 'FIRE_SAFETY_NOC', organization);

    expect(result.status).toBe('MANUAL_REVIEW');
    expect(result.detectedDocumentType).toBeNull();
    expect(result.explanation).toContain('ambiguous');
  });

  it('rejects a matching certificate missing its mandatory certificate number', async () => {
    const missingNumber = fireCertificate.filter((line) => !line.startsWith('Certificate No:'));
    const filePath = await createTemporaryFile('.pdf', createSyntheticPdf(missingNumber));
    const result = await verifyApplicationDocument(filePath, 'fire-certificate.pdf', 'application/pdf', 'FIRE_SAFETY_NOC', organization);

    expect(result.status).toBe('REJECTED');
    expect(result.validationResults.some((rule) => rule.rule === 'fire certificate or NOC number' && !rule.passed)).toBe(true);
  });

  it('rejects a readable lease that does not meet the configured minimum term', async () => {
    const filePath = await createTemporaryFile('.pdf', createSyntheticPdf([
      'REGISTERED LAND LEASE DEED',
      'Registration No: MH-2026-5011',
      'Sub-Registrar Pune',
      'Lease Period: 25 Years',
      'Survey Number: 42/7',
      organization.instituteName,
      organization.trustName,
      'Registered ownership title and land area certification for the campus premises.',
    ]));
    const result = await verifyApplicationDocument(filePath, 'lease.pdf', 'application/pdf', 'LAND_LEASE', organization);

    expect(result.status).toBe('REJECTED');
    expect(result.validationResults.some((rule) => rule.rule.includes('at least 30 years') && !rule.passed)).toBe(true);
  });

  it('uses closure-resolution rules instead of building-occupancy rules for closure applications', async () => {
    const filePath = await createTemporaryFile('.pdf', createSyntheticPdf([
      'GOVERNING BODY RESOLUTION FOR PROGRESSIVE CLOSURE',
      'Resolution No: GB-2026-017',
      'Affiliating University No Objection',
      'State Government concurrence on the proposed closure process',
      organization.instituteName,
      organization.trustName,
      'The resolution was adopted by the trustees at a governing body meeting for progressive closure.',
    ]));
    const result = await verifyApplicationDocument(
      filePath,
      'closure-resolution.pdf',
      'application/pdf',
      'BUILDING_OCCUPANCY',
      { ...organization, category: 'CLOSURE' }
    );

    expect(result.status).toBe('VERIFIED');
    expect(result.detectedDocumentType).toBe('BUILDING_OCCUPANCY');
    expect(result.extractedFields.resolutionNumber).toBe('GB-2026-017');
  });

  it('routes an unreadable scanned image to manual review after real OCR', async () => {
    const blankScan = createCanvas(500, 300).toBuffer('image/png');
    const filePath = await createTemporaryFile('.png', blankScan);
    const result = await verifyApplicationDocument(filePath, 'scan.png', 'image/png', 'FIRE_SAFETY_NOC', organization);

    expect(result.status).toBe('MANUAL_REVIEW');
    expect(result.explanation).toContain('read reliably');
  }, 30000);

  it('runs OCR on scanned PDF pages that contain no selectable text', async () => {
    const filePath = await createTemporaryFile('.pdf', createSyntheticPdf([]));
    const result = await extractDocumentText(filePath, 'application/pdf');

    expect(result.method).toBe('NONE');
    expect(result.confidence).toBe(0);
    expect(result.explanation).toBeUndefined();
  }, 30000);

  it('rejects content that is not a permitted document format', async () => {
    const filePath = await createTemporaryFile('.pdf', Buffer.from('not a PDF document'));

    await expect(
      verifyApplicationDocument(filePath, 'document.pdf', 'application/pdf', 'FIRE_SAFETY_NOC', organization)
    ).rejects.toThrow(/contents do not match/i);
  });

  it('has a document-specific verification rule for every required category checklist type', () => {
    const categoryDocuments = Object.entries(CATEGORY_DOCUMENT_CHECKLIST).flatMap(([category, checklist]) =>
      checklist.map((item) => getDocumentVerificationRule(category as ApplicationCategory, item.documentType))
    );
    expect(categoryDocuments.every((rule) => rule.permittedFormats.length > 0 && rule.keywordGroups.length > 0)).toBe(true);
    expect(Object.keys(DOCUMENT_VERIFICATION_RULES)).toHaveLength(5);
  });
});
