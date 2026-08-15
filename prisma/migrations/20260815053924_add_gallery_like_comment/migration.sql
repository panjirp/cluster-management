-- CreateTable
CREATE TABLE "GalleryLike" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryComment" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryLike_photoId_idx" ON "GalleryLike"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryLike_photoId_userId_key" ON "GalleryLike"("photoId", "userId");

-- CreateIndex
CREATE INDEX "GalleryComment_photoId_idx" ON "GalleryComment"("photoId");

-- AddForeignKey
ALTER TABLE "GalleryLike" ADD CONSTRAINT "GalleryLike_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "GalleryPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryLike" ADD CONSTRAINT "GalleryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "GalleryPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
