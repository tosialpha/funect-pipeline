-- Add RLS policies for prospects table

-- Allow authenticated users to insert prospects
CREATE POLICY "Allow authenticated users to insert prospects"
ON prospects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view all prospects
CREATE POLICY "Allow authenticated users to view prospects"
ON prospects
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update prospects
CREATE POLICY "Allow authenticated users to update prospects"
ON prospects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete prospects
CREATE POLICY "Allow authenticated users to delete prospects"
ON prospects
FOR DELETE
TO authenticated
USING (true);
