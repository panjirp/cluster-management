-- AlterTable
ALTER TABLE "GroupChatMessage" ADD COLUMN     "houseId" TEXT;

-- AlterTable
ALTER TABLE "MonthlyDue" ADD COLUMN     "paymentProofUrl" TEXT;

-- AddForeignKey
ALTER TABLE "GroupChatMessage" ADD CONSTRAINT "GroupChatMessage_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE SET NULL ON UPDATE CASCADE;
