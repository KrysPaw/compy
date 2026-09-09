-- Remove the redundant discriminator from existing rule configuration JSON.
UPDATE "Criterion"
SET "ruleConfig" = "ruleConfig" - 'type'
WHERE "ruleConfig" IS NOT NULL
  AND jsonb_typeof("ruleConfig") = 'object';
