-- CreateEnum
CREATE TYPE "GuestPassStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOBIL', 'MOTOR', 'LAINNYA');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('WAITING', 'PICKED_UP');

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "gatePin" TEXT DEFAULT '0000';

-- CreateTable
CREATE TABLE "GuestPass" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "houseId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'MOTOR',
    "plateNumber" TEXT,
    "purpose" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "GuestPassStatus" NOT NULL DEFAULT 'ACTIVE',
    "scannedAt" TIMESTAMP(3),
    "scannedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL,
    "houseId" TEXT,
    "residentId" TEXT,
    "courierName" TEXT NOT NULL,
    "senderName" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "status" "ParcelStatus" NOT NULL DEFAULT 'WAITING',
    "pickedUpAt" TIMESTAMP(3),
    "loggedBy" TEXT NOT NULL DEFAULT 'Pos Satpam',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "isMultiple" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "filePath" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestPass_code_key" ON "GuestPass"("code");

-- CreateIndex
CREATE INDEX "GuestPass_hostId_idx" ON "GuestPass"("hostId");

-- CreateIndex
CREATE INDEX "GuestPass_status_validUntil_idx" ON "GuestPass"("status", "validUntil");

-- CreateIndex
CREATE INDEX "Parcel_houseId_idx" ON "Parcel"("houseId");

-- CreateIndex
CREATE INDEX "Parcel_residentId_idx" ON "Parcel"("residentId");

-- CreateIndex
CREATE INDEX "Parcel_status_idx" ON "Parcel"("status");

-- CreateIndex
CREATE INDEX "PollVote_userId_idx" ON "PollVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_optionId_userId_key" ON "PollVote"("optionId", "userId");

-- CreateIndex
CREATE INDEX "GalleryPhoto_eventId_idx" ON "GalleryPhoto"("eventId");

-- AddForeignKey
ALTER TABLE "GuestPass" ADD CONSTRAINT "GuestPass_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestPass" ADD CONSTRAINT "GuestPass_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
