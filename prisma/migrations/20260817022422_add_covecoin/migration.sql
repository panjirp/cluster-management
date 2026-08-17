-- CreateTable
CREATE TABLE "CoveCoinLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EARN',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoveCoinLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoveCoinLedger_userId_createdAt_idx" ON "CoveCoinLedger"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoveCoinLedger" ADD CONSTRAINT "CoveCoinLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
