-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "immunizationsDone" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "vitamins" TEXT;
