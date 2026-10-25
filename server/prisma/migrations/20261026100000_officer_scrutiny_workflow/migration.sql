CREATE TYPE "ScrutinyFindingSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "ScrutinyReviewState" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED', 'RESOLVED');
CREATE TYPE "OfficerDecisionType" AS ENUM ('APPROVE', 'REQUEST_CORRECTION', 'REJECT');

ALTER TABLE "Application" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Application" SET "isDemo" = true WHERE "id" LIKE 'app-%';
CREATE INDEX "Application_isDemo_currentStage_idx" ON "Application"("isDemo", "currentStage");

ALTER TABLE "ApplicationDocument"
  ADD COLUMN "ocrConfidence" DOUBLE PRECISION,
  ADD COLUMN "ocrMethod" TEXT,
  ADD COLUMN "ocrEvidence" JSONB;

CREATE TABLE "ApplicationScrutinyRun" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "officerId" TEXT NOT NULL,
  "officerName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationScrutinyRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationReviewFinding" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "documentId" TEXT,
  "fieldName" TEXT NOT NULL,
  "applicationValue" TEXT,
  "documentValue" TEXT,
  "findingType" TEXT NOT NULL,
  "severity" "ScrutinyFindingSeverity" NOT NULL,
  "reason" TEXT NOT NULL,
  "evidence" TEXT,
  "evidencePage" INTEGER,
  "ocrConfidence" DOUBLE PRECISION,
  "recommendedAction" TEXT NOT NULL,
  "reviewState" "ScrutinyReviewState" NOT NULL DEFAULT 'PENDING',
  "officerNotes" TEXT,
  "reviewedById" TEXT,
  "reviewedByName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "overrideById" TEXT,
  "overrideByName" TEXT,
  "overrideAt" TIMESTAMP(3),
  "overrideReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationReviewFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationFindingReviewEvent" (
  "id" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "officerId" TEXT NOT NULL,
  "officerName" TEXT NOT NULL,
  "fromState" "ScrutinyReviewState" NOT NULL,
  "toState" "ScrutinyReviewState" NOT NULL,
  "note" TEXT NOT NULL,
  "isOverride" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationFindingReviewEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationDecision" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "officerId" TEXT NOT NULL,
  "officerName" TEXT NOT NULL,
  "officerRole" "UserRole" NOT NULL,
  "decision" "OfficerDecisionType" NOT NULL,
  "previousStage" "ApplicationStage" NOT NULL,
  "resultingStage" "ApplicationStage" NOT NULL,
  "remarks" TEXT NOT NULL,
  "overriddenFindingIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationScrutinyRun_applicationId_createdAt_idx" ON "ApplicationScrutinyRun"("applicationId", "createdAt");
CREATE INDEX "ApplicationReviewFinding_applicationId_runId_severity_idx" ON "ApplicationReviewFinding"("applicationId", "runId", "severity");
CREATE INDEX "ApplicationReviewFinding_documentId_idx" ON "ApplicationReviewFinding"("documentId");
CREATE INDEX "ApplicationFindingReviewEvent_findingId_createdAt_idx" ON "ApplicationFindingReviewEvent"("findingId", "createdAt");
CREATE INDEX "ApplicationDecision_applicationId_createdAt_idx" ON "ApplicationDecision"("applicationId", "createdAt");

ALTER TABLE "ApplicationScrutinyRun" ADD CONSTRAINT "ApplicationScrutinyRun_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationReviewFinding" ADD CONSTRAINT "ApplicationReviewFinding_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "ApplicationScrutinyRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationReviewFinding" ADD CONSTRAINT "ApplicationReviewFinding_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationReviewFinding" ADD CONSTRAINT "ApplicationReviewFinding_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "ApplicationDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApplicationFindingReviewEvent" ADD CONSTRAINT "ApplicationFindingReviewEvent_findingId_fkey"
  FOREIGN KEY ("findingId") REFERENCES "ApplicationReviewFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationDecision" ADD CONSTRAINT "ApplicationDecision_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
