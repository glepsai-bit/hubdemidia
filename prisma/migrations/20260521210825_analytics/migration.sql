-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "postId" TEXT,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_siteId_createdAt_idx" ON "PageView"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_postId_idx" ON "PageView"("postId");

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
