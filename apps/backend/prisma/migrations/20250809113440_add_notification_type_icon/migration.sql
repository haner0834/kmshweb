-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('update', 'warn', 'other');

-- CreateEnum
CREATE TYPE "NotificationIcon" AS ENUM ('score', 'disciplinary', 'auth', 'bus', 'none');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "icon" "NotificationIcon" NOT NULL DEFAULT 'none',
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'other';
