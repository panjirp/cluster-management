-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "emergencyNotifyPhone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emergencyPin" TEXT;

-- CreateTable
CREATE TABLE "EmergencyAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "houseBlock" TEXT NOT NULL,
    "message" TEXT,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "EmergencyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmergencyAlert_status_createdAt_idx" ON "EmergencyAlert"("status", "createdAt");
