-- AlterTable
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Comparison" ADD COLUMN "publicId" TEXT;

-- Backfill existing rows with unique Crockford Base32 ids (ULID-shaped).
UPDATE "Comparison" AS c
SET "publicId" = (
  SELECT upper(
    string_agg(
      substr(
        '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
        (get_byte(gen_random_bytes(26), gs.i) % 32) + 1,
        1
      ),
      ''
    )
  )
  FROM generate_series(0, 25) AS gs(i)
);

ALTER TABLE "Comparison" ALTER COLUMN "publicId" SET NOT NULL;

CREATE UNIQUE INDEX "Comparison_publicId_key" ON "Comparison"("publicId");
