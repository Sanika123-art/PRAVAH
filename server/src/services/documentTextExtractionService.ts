import fs from 'fs';
import path from 'path';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import { createWorker } from 'tesseract.js';

const MIN_TEXT_LENGTH = 100;
const MAX_PDF_PAGES = 15;
const MAX_OCR_DIMENSION = 2000;
const MAX_IMAGE_PIXELS = 20_000_000;
const languageDataPath = require('@tesseract.js-data/eng').langPath as string;

Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs', { with: { 'resolution-mode': 'import' } });
type PdfPage = Awaited<ReturnType<Awaited<ReturnType<PdfJsModule['getDocument']>['promise']>['getPage']>>;
const pdfjsPromise: Promise<PdfJsModule> = import('pdfjs-dist/legacy/build/pdf.mjs');

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;
let ocrQueue: Promise<void> = Promise.resolve();

const withOcrWorker = <T>(operation: (worker: TesseractWorker) => Promise<T>): Promise<T> => {
  const result = ocrQueue.then(async () => {
    const worker = await createWorker('eng', 1, {
      langPath: process.env.TESSERACT_LANG_PATH || languageDataPath,
      gzip: true,
      logger: () => undefined,
    });
    try {
      return await operation(worker);
    } finally {
      await worker.terminate();
    }
  });
  ocrQueue = result.then(() => undefined, () => undefined);
  return result;
};

const recognizeImage = async (
  image: Buffer,
  worker: TesseractWorker
): Promise<{ text: string; confidence: number }> => {
  const response = await worker.recognize(image);
  return {
    text: response.data.text,
    confidence: response.data.confidence,
  };
};

const renderPdfPage = async (page: PdfPage): Promise<Buffer> => {
  const initialViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(1.5, MAX_OCR_DIMENSION / Math.max(initialViewport.width, initialViewport.height));
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext('2d');
  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;
  return canvas.toBuffer('image/png');
};

export interface ExtractedDocumentText {
  text: string;
  method: 'PDF_TEXT' | 'OCR' | 'PDF_TEXT_AND_OCR' | 'NONE';
  confidence: number | null;
  evidence: Array<{ page: number; excerpt: string; confidence: number | null }>;
  explanation?: string;
}

export const extractDocumentText = async (
  filePath: string,
  mimeType: string
): Promise<ExtractedDocumentText> => {
  if (mimeType !== 'application/pdf') {
    const image = await fs.promises.readFile(filePath);
    const ocr = await withOcrWorker((worker) => recognizeImage(image, worker));
    return {
      text: ocr.text,
      method: ocr.text.trim() ? 'OCR' : 'NONE',
      confidence: ocr.confidence,
      evidence: ocr.text.trim()
        ? [{ page: 1, excerpt: ocr.text.trim().slice(0, 600), confidence: ocr.confidence }]
        : [],
    };
  }

  const data = new Uint8Array(await fs.promises.readFile(filePath));
  const pdfjs = await pdfjsPromise;
  const document = await pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;
  if (document.numPages > MAX_PDF_PAGES) {
    return {
      text: '',
      method: 'NONE',
      confidence: null,
      evidence: [],
      explanation: `The PDF has ${document.numPages} pages; documents above ${MAX_PDF_PAGES} pages require manual review.`,
    };
  }

  const textParts: string[] = [];
  const evidence = new Map<number, { page: number; excerpt: string; confidence: number | null }>();
  const scannedPages: number[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = new Map<number, string[]>();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const transform = 'transform' in item ? item.transform : undefined;
      const lineKey = Array.isArray(transform) ? Math.round(transform[5] as number) : 0;
      lines.set(lineKey, [...(lines.get(lineKey) || []), item.str.trim()]);
    }
    const pageText = Array.from(lines.entries())
      .sort(([a], [b]) => b - a)
      .map(([, fragments]) => fragments.join(' '))
      .join('\n')
      .trim();
    textParts.push(pageText);
    if (pageText) evidence.set(pageNumber, { page: pageNumber, excerpt: pageText.slice(0, 600), confidence: 100 });
    if (pageText.length < MIN_TEXT_LENGTH) scannedPages.push(pageNumber);
  }

  const pdfText = textParts.join('\n').trim();
  if (scannedPages.length === 0) {
    return { text: pdfText, method: 'PDF_TEXT', confidence: 100, evidence: Array.from(evidence.values()) };
  }

  const ocrResults = await withOcrWorker(async (worker) => {
    const results: Array<{ text: string; confidence: number }> = [];
    for (const pageNumber of scannedPages) {
      const page = await document.getPage(pageNumber);
      const result = await recognizeImage(await renderPdfPage(page), worker);
      results.push(result);
      if (result.text.trim()) {
        evidence.set(pageNumber, {
          page: pageNumber,
          excerpt: result.text.trim().slice(0, 600),
          confidence: result.confidence,
        });
      }
    }
    return results;
  });
  const ocrParts = ocrResults.map((result) => result.text);
  const confidenceSum = ocrResults.reduce((sum, result) => sum + result.confidence, 0);
  const confidenceCount = ocrResults.length;
  const ocrText = ocrParts.join('\n').trim();
  const combinedText = [pdfText, ocrText].filter(Boolean).join('\n').trim();

  return {
    text: combinedText,
    method: pdfText ? 'PDF_TEXT_AND_OCR' : ocrText ? 'OCR' : 'NONE',
    confidence: confidenceCount ? confidenceSum / confidenceCount : null,
    evidence: Array.from(evidence.values()).sort((a, b) => a.page - b.page),
  };
};

export const validateDocumentContent = async (
  filePath: string,
  declaredMimeType: string,
  originalName: string,
  permittedFormats: Array<{ extension: string; mimeType: string }>
): Promise<{ mimeType: string }> => {
  const stat = await fs.promises.stat(filePath);
  if (stat.size === 0 || stat.size > 10 * 1024 * 1024) {
    throw new Error('File must be non-empty and no larger than 10 MB.');
  }

  const extension = path.extname(originalName).toLowerCase();
  const format = permittedFormats.find((candidate) => candidate.extension === extension);
  if (!format) throw new Error('This document type does not permit the uploaded file format.');

  let actualMimeType: string | null;
  const file = await fs.promises.open(filePath, 'r');
  try {
    const header = Buffer.alloc(8);
    await file.read(header, 0, header.length, 0);
    actualMimeType = header.subarray(0, 5).toString('ascii') === '%PDF-'
      ? 'application/pdf'
      : header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        ? 'image/jpeg'
        : header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? 'image/png'
          : null;

  } finally {
    await file.close();
  }

  if (!actualMimeType || actualMimeType !== declaredMimeType || actualMimeType !== format.mimeType) {
    throw new Error('The file contents do not match the declared MIME type and permitted file format.');
  }

  if (actualMimeType === 'image/png' || actualMimeType === 'image/jpeg') {
    const image = await fs.promises.readFile(filePath);
    let width = 0;
    let height = 0;
    if (actualMimeType === 'image/png' && image.length >= 24) {
      width = image.readUInt32BE(16);
      height = image.readUInt32BE(20);
    } else if (actualMimeType === 'image/jpeg') {
      for (let offset = 2; offset + 9 < image.length;) {
        if (image[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = image[offset + 1];
        offset += 2;
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        if (offset + 2 > image.length) break;
        const segmentLength = image.readUInt16BE(offset);
        if (segmentLength < 2 || offset + segmentLength > image.length) break;
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
          height = image.readUInt16BE(offset + 3);
          width = image.readUInt16BE(offset + 5);
          break;
        }
        offset += segmentLength;
      }
    }
    if (!width || !height) throw new Error('Image content is malformed or has unreadable dimensions.');
    if (width * height > MAX_IMAGE_PIXELS) {
      throw new Error(`Image dimensions exceed the ${MAX_IMAGE_PIXELS.toLocaleString()} pixel processing limit.`);
    }
  }
  return { mimeType: actualMimeType };
};
