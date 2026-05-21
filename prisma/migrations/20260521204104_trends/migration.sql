-- CreateEnum
CREATE TYPE "TrendStatus" AS ENUM ('NEW', 'USED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "siteId" TEXT,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "type" "SourceType" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" "TrendStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trend_siteId_status_score_idx" ON "Trend"("siteId", "status", "score");

-- AddForeignKey
ALTER TABLE "Trend" ADD CONSTRAINT "Trend_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trend" ADD CONSTRAINT "Trend_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
