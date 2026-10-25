ALTER TABLE "ApplicationDocument"
ADD COLUMN "detectedDocumentType" "DocumentType",
ADD COLUMN "extractedFields" JSONB,
ADD COLUMN "validationResults" JSONB,
ADD COLUMN "verificationExplanation" TEXT;
