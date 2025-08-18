/*
  Warnings:

  - The values [schollMandatory] on the enum `SubjectType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubjectType_new" AS ENUM ('nationalMandatory', 'schoolMandatory', 'schoolElective', 'otherElective', 'unknown');
ALTER TABLE "Subject" ALTER COLUMN "type" TYPE "SubjectType_new" USING ("type"::text::"SubjectType_new");
ALTER TYPE "SubjectType" RENAME TO "SubjectType_old";
ALTER TYPE "SubjectType_new" RENAME TO "SubjectType";
DROP TYPE "SubjectType_old";
COMMIT;
