-- CreateEnum
CREATE TYPE "GrantRole" AS ENUM ('editor');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "ComparisonGrant" (
    "id" SERIAL NOT NULL,
    "comparisonId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "GrantRole" NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" SERIAL NOT NULL,
    "comparisonId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "message" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonGrant_comparisonId_userId_key" ON "ComparisonGrant"("comparisonId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_comparisonId_requesterId_pending_key" ON "AccessRequest"("comparisonId", "requesterId") WHERE "status" = 'pending';

-- AddForeignKey
ALTER TABLE "ComparisonGrant" ADD CONSTRAINT "ComparisonGrant_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonGrant" ADD CONSTRAINT "ComparisonGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
