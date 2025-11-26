-- Add display_order column to todos table for drag-and-drop reordering
ALTER TABLE todos ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing todos to have sequential display_order based on creation time
UPDATE todos t
SET display_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY due_date ORDER BY created_at ASC) as rn
  FROM todos
) sub
WHERE t.id = sub.id;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_todos_display_order ON todos(due_date, display_order);
