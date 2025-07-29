-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('ios', 'android', 'web');

-- CreateEnum
CREATE TYPE "DisciplinaryLevel" AS ENUM ('commendation', 'minorMerit', 'majorMerit', 'warning', 'minorDemerit', 'majorDemerit');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('main', 'weekly', 'other');

-- CreateEnum
CREATE TYPE "Stream" AS ENUM ('science', 'social', 'all', 'other');

-- CreateEnum
CREATE TYPE "SemesterTerm" AS ENUM ('first', 'second');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('junior1', 'junior2', 'junior3', 'senior1', 'senior2', 'senior3');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('enrolled', 'suspended', 'graduated', 'withdraw');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('scoreUpdate', 'schoolBusTableUpdate', 'scheduleUpdate', 'rewordsUpdate', 'classScheduleUpdate', 'profileUpdate');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('nationalMandatory', 'schollMandatory', 'schoolElective', 'otherElective', 'unknown');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "clientSideDeviceId" TEXT NOT NULL,
    "refreshTokenId" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "pushToken" TEXT,
    "isTrusted" BOOLEAN NOT NULL,
    "lastLoginIp" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaryEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "approvalDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "type" "DisciplinaryLevel" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DisciplinaryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultOrder" INTEGER NOT NULL,
    "timeOrder" INTEGER NOT NULL,
    "type" "ExamType" NOT NULL,
    "totalScore" INTEGER,
    "totalWeightedScore" INTEGER,
    "averageScore" DOUBLE PRECISION,
    "weightedAverageScore" DOUBLE PRECISION,
    "classRanking" INTEGER,
    "streamRanking" INTEGER,
    "gradeRanking" INTEGER,
    "semesterId" TEXT NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "name" TEXT NOT NULL,
    "stream" "Stream" NOT NULL,
    "number" INTEGER NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "classOfficer" TEXT,
    "term" "SemesterTerm" NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" BYTEA NOT NULL,
    "encryptedUek" BYTEA NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "graduationDate" TIMESTAMP(3),
    "graduationSchool" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL,
    "credential" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classId" TEXT NOT NULL,
    "enabledNotifications" "NotificationType"[] DEFAULT ARRAY[]::"NotificationType"[],
    "isQuickAccessOpen" BOOLEAN NOT NULL DEFAULT true,
    "tokensValidFrom" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classRanking" INTEGER,
    "rankingCount" INTEGER,
    "classAverage" DOUBLE PRECISION,
    "type" "SubjectType" NOT NULL,
    "credit" INTEGER NOT NULL,
    "score" TEXT NOT NULL,
    "isCreditGained" BOOLEAN NOT NULL DEFAULT true,
    "examId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_refreshTokenId_key" ON "Device"("refreshTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_pushToken_key" ON "Device"("pushToken");

-- CreateIndex
CREATE UNIQUE INDEX "Device_clientSideDeviceId_studentId_key" ON "Device"("clientSideDeviceId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryEvent_studentId_incidentDate_approvalDate_reaso_key" ON "DisciplinaryEvent"("studentId", "incidentDate", "approvalDate", "reason", "type");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_hashedToken_key" ON "RefreshToken"("hashedToken");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_grade_stream_name_key" ON "SchoolClass"("grade", "stream", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_name_studentId_key" ON "Semester"("name", "studentId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_refreshTokenId_fkey" FOREIGN KEY ("refreshTokenId") REFERENCES "RefreshToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryEvent" ADD CONSTRAINT "DisciplinaryEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
