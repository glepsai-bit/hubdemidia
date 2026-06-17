-- CreateEnum
CREATE TYPE "AutopilotStatus" AS ENUM ('RUNNING', 'OK', 'ERROR', 'SKIPPED');

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "autopilotAutoCategory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autopilotEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autopilotFeaturedThreshold" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "autopilotPostsPerRun" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "autopilotProvider" "AiProvider" NOT NULL DEFAULT 'CLAUDE',
ADD COLUMN     "autopilotWithImage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "category" TEXT,
ADD COLUMN     "geo" TEXT,
ADD COLUMN     "keywords" TEXT;

-- CreateTable
CREATE TABLE "AutopilotRun" (
    "id" TEXT NOT NULL,
    "siteId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "AutopilotStatus" NOT NULL DEFAULT 'RUNNING',
    "posted" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "notes" TEXT,

    CONSTRAINT "AutopilotRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutopilotRun_siteId_startedAt_idx" ON "AutopilotRun"("siteId", "startedAt");

-- CreateIndex
CREATE INDEX "AutopilotRun_startedAt_idx" ON "AutopilotRun"("startedAt");

-- AddForeignKey
ALTER TABLE "AutopilotRun" ADD CONSTRAINT "AutopilotRun_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
