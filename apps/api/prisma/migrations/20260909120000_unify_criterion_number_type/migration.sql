-- Rebuild the enum so existing int and float criteria become number.
ALTER TYPE "CriterionType" RENAME TO "CriterionType_old";

CREATE TYPE "CriterionType" AS ENUM ('text', 'number', 'enum', 'boolean', 'rating');

ALTER TABLE "Criterion"
  ALTER COLUMN "type" TYPE "CriterionType"
  USING (
    CASE "type"::text
      WHEN 'int' THEN 'number'
      WHEN 'float' THEN 'number'
      ELSE "type"::text
    END
  )::"CriterionType";

DROP TYPE "CriterionType_old";
