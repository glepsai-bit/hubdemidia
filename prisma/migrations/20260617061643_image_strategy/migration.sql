-- CreateEnum
CREATE TYPE "AutopilotImageStrategy" AS ENUM ('BANK_FIRST', 'BANK_ONLY', 'OPENAI_ONLY', 'NONE');

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "autopilotImageStrategy" "AutopilotImageStrategy" NOT NULL DEFAULT 'BANK_FIRST',
ALTER COLUMN "autopilotWithImage" SET DEFAULT true;
