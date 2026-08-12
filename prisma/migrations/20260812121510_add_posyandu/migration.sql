-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionCategory" ADD VALUE 'DANA_SOSIAL';
ALTER TYPE "TransactionCategory" ADD VALUE 'OPERASIONAL';
ALTER TYPE "TransactionCategory" ADD VALUE 'INVENTARIS';
ALTER TYPE "TransactionCategory" ADD VALUE 'ADMINISTRASI';

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "birthWeight" DOUBLE PRECISION,
    "birthLength" DOUBLE PRECISION,
    "nik" TEXT,
    "allergies" TEXT,
    "photoUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosyanduSchedule" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Posko Barcelona Cove',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosyanduSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildCheckup" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "headCircumference" DOUBLE PRECISION,
    "nutritionalStatus" TEXT,
    "immunizationGiven" TEXT[],
    "vitaminA" BOOLEAN,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildCheckup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Child_userId_idx" ON "Child"("userId");

-- CreateIndex
CREATE INDEX "Child_verifiedById_idx" ON "Child"("verifiedById");

-- CreateIndex
CREATE INDEX "PosyanduSchedule_date_idx" ON "PosyanduSchedule"("date");

-- CreateIndex
CREATE INDEX "ChildCheckup_childId_idx" ON "ChildCheckup"("childId");

-- CreateIndex
CREATE INDEX "ChildCheckup_scheduleId_idx" ON "ChildCheckup"("scheduleId");

-- CreateIndex
CREATE INDEX "ChildCheckup_date_idx" ON "ChildCheckup"("date");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosyanduSchedule" ADD CONSTRAINT "PosyanduSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildCheckup" ADD CONSTRAINT "ChildCheckup_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildCheckup" ADD CONSTRAINT "ChildCheckup_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PosyanduSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildCheckup" ADD CONSTRAINT "ChildCheckup_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
