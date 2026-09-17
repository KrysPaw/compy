-- CreateEnum
CREATE TYPE "UserKind" AS ENUM ('guest', 'registered');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "kind" "UserKind" NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "googleSub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill owner for existing comparisons: assign to a migration guest principal.
INSERT INTO "User" ("kind", "displayName", "createdAt", "lastSeenAt")
VALUES ('guest', 'migration-owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Comparison" ADD COLUMN "ownerId" INTEGER;
ALTER TABLE "Comparison" ADD COLUMN "lastActiveAt" TIMESTAMP(3);

UPDATE "Comparison"
SET
  "ownerId" = (SELECT "id" FROM "User" WHERE "displayName" = 'migration-owner' ORDER BY "id" ASC LIMIT 1),
  "lastActiveAt" = "updatedAt";

ALTER TABLE "Comparison" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Comparison" ALTER COLUMN "lastActiveAt" SET NOT NULL;
ALTER TABLE "Comparison" ALTER COLUMN "lastActiveAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
