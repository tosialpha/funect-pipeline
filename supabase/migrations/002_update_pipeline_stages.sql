-- Update pipeline_stage enum to match new stage names

-- Step 1: Drop the default value first
ALTER TABLE prospects
  ALTER COLUMN pipeline_stage DROP DEFAULT;

-- Step 2: Rename old enum
ALTER TYPE pipeline_stage RENAME TO pipeline_stage_old;

-- Step 3: Create new enum
CREATE TYPE pipeline_stage AS ENUM (
  'not_contacted',
  'cold_called',
  'first_demo',
  'second_demo',
  'offer_sent',
  'offer_accepted',
  'offer_rejected'
);

-- Step 4: Update prospects table to use new enum
ALTER TABLE prospects
  ALTER COLUMN pipeline_stage TYPE pipeline_stage
  USING (
    CASE pipeline_stage::text
      WHEN 'cold_call' THEN 'cold_called'::pipeline_stage
      WHEN 'short_demo' THEN 'first_demo'::pipeline_stage
      WHEN 'long_demo' THEN 'second_demo'::pipeline_stage
      WHEN 'offer_sent' THEN 'offer_sent'::pipeline_stage
      WHEN 'closed_won' THEN 'offer_accepted'::pipeline_stage
      WHEN 'closed_lost' THEN 'offer_rejected'::pipeline_stage
      ELSE 'not_contacted'::pipeline_stage
    END
  );

-- Step 5: Set new default value
ALTER TABLE prospects
  ALTER COLUMN pipeline_stage SET DEFAULT 'not_contacted'::pipeline_stage;

-- Step 6: Drop old enum
DROP TYPE pipeline_stage_old;
