-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "params" JSONB,
ADD COLUMN     "route" TEXT NOT NULL DEFAULT '';
