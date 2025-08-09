/*
  Warnings:

  - The `enabledNotifications` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "NotificationOption" AS ENUM ('scoreUpdate', 'schoolBusTableUpdate', 'scheduleUpdate', 'rewordsUpdate', 'classScheduleUpdate', 'profileUpdate');

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "enabledNotifications",
ADD COLUMN     "enabledNotifications" "NotificationOption"[] DEFAULT ARRAY[]::"NotificationOption"[];

-- DropEnum
DROP TYPE "NotificationType";
