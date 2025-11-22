-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('team', 'veeti', 'alppa')),
  due_date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all todos (team collaboration)
CREATE POLICY "Users can view all todos"
  ON todos
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create their own todos
CREATE POLICY "Users can create todos"
  ON todos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update all todos (team can edit each other's tasks)
CREATE POLICY "Users can update all todos"
  ON todos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete all todos (team can delete tasks)
CREATE POLICY "Users can delete all todos"
  ON todos
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX idx_todos_user_id ON todos(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_todos_updated_at();
