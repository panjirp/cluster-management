-- CreateTable
CREATE TABLE "VehicleRegistration" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL DEFAULT 'MOBIL',
    "ownerName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAccess" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'MASUK',
    "houseId" TEXT,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DIBUKA',
    "gateName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleRegistration_houseId_idx" ON "VehicleRegistration"("houseId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleRegistration_plateNumber_key" ON "VehicleRegistration"("plateNumber");

-- CreateIndex
CREATE INDEX "VehicleAccess_plateNumber_createdAt_idx" ON "VehicleAccess"("plateNumber", "createdAt");

-- CreateIndex
CREATE INDEX "VehicleAccess_createdAt_idx" ON "VehicleAccess"("createdAt");

-- AddForeignKey
ALTER TABLE "VehicleRegistration" ADD CONSTRAINT "VehicleRegistration_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAccess" ADD CONSTRAINT "VehicleAccess_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE SET NULL ON UPDATE CASCADE;
