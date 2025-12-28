-- ============================================================================
-- Migration: Fix RLS Policies - Replace function calls with inline subqueries
-- The is_org_member() SECURITY DEFINER function can have issues with auth.uid()
-- context in PostgREST. Using inline subqueries ensures proper auth context.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing policies that use is_org_member()
-- ============================================================================

-- Prospects
DROP POLICY IF EXISTS "Org members can view prospects" ON prospects;
DROP POLICY IF EXISTS "Org members can insert prospects" ON prospects;
DROP POLICY IF EXISTS "Org members can update prospects" ON prospects;
DROP POLICY IF EXISTS "Org members can delete prospects" ON prospects;

-- Calendar events
DROP POLICY IF EXISTS "Org members can view calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Org members can insert calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Org members can update calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Org members can delete calendar events" ON calendar_events;

-- Todos
DROP POLICY IF EXISTS "Org members can view todos" ON todos;
DROP POLICY IF EXISTS "Org members can insert todos" ON todos;
DROP POLICY IF EXISTS "Org members can update todos" ON todos;
DROP POLICY IF EXISTS "Org members can delete todos" ON todos;

-- Contacts
DROP POLICY IF EXISTS "Org members can view contacts" ON contacts;
DROP POLICY IF EXISTS "Org members can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Org members can update contacts" ON contacts;
DROP POLICY IF EXISTS "Org members can delete contacts" ON contacts;

-- Activities
DROP POLICY IF EXISTS "Org members can view activities" ON activities;
DROP POLICY IF EXISTS "Org members can insert activities" ON activities;
DROP POLICY IF EXISTS "Org members can update activities" ON activities;
DROP POLICY IF EXISTS "Org members can delete activities" ON activities;

-- Offers
DROP POLICY IF EXISTS "Org members can view offers" ON offers;
DROP POLICY IF EXISTS "Org members can insert offers" ON offers;
DROP POLICY IF EXISTS "Org members can update offers" ON offers;
DROP POLICY IF EXISTS "Org members can delete offers" ON offers;

-- Tags
DROP POLICY IF EXISTS "Org members can view tags" ON tags;
DROP POLICY IF EXISTS "Org members can insert tags" ON tags;
DROP POLICY IF EXISTS "Org members can update tags" ON tags;
DROP POLICY IF EXISTS "Org members can delete tags" ON tags;

-- Prospect tags
DROP POLICY IF EXISTS "Org members can view prospect tags" ON prospect_tags;
DROP POLICY IF EXISTS "Org members can insert prospect tags" ON prospect_tags;
DROP POLICY IF EXISTS "Org members can delete prospect tags" ON prospect_tags;

-- ============================================================================
-- STEP 2: Create new policies with inline membership check
-- Using: organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
-- ============================================================================

-- Prospects table policies
CREATE POLICY "Org members can view prospects"
  ON prospects FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert prospects"
  ON prospects FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update prospects"
  ON prospects FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete prospects"
  ON prospects FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Calendar events policies
CREATE POLICY "Org members can view calendar events"
  ON calendar_events FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert calendar events"
  ON calendar_events FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update calendar events"
  ON calendar_events FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete calendar events"
  ON calendar_events FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Todos policies
CREATE POLICY "Org members can view todos"
  ON todos FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert todos"
  ON todos FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update todos"
  ON todos FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete todos"
  ON todos FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Contacts policies
CREATE POLICY "Org members can view contacts"
  ON contacts FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert contacts"
  ON contacts FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update contacts"
  ON contacts FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete contacts"
  ON contacts FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Activities policies
CREATE POLICY "Org members can view activities"
  ON activities FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert activities"
  ON activities FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update activities"
  ON activities FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete activities"
  ON activities FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Offers policies
CREATE POLICY "Org members can view offers"
  ON offers FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert offers"
  ON offers FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update offers"
  ON offers FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete offers"
  ON offers FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Tags policies
CREATE POLICY "Org members can view tags"
  ON tags FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert tags"
  ON tags FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update tags"
  ON tags FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete tags"
  ON tags FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Prospect tags policies (use prospect's organization via join)
CREATE POLICY "Org members can view prospect tags"
  ON prospect_tags FOR SELECT TO authenticated
  USING (
    prospect_id IN (
      SELECT p.id FROM prospects p
      WHERE p.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Org members can insert prospect tags"
  ON prospect_tags FOR INSERT TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT p.id FROM prospects p
      WHERE p.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Org members can delete prospect tags"
  ON prospect_tags FOR DELETE TO authenticated
  USING (
    prospect_id IN (
      SELECT p.id FROM prospects p
      WHERE p.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 3: Drop the unused is_org_member function (optional cleanup)
-- ============================================================================
-- Keeping the functions for backwards compatibility, but they're no longer used
-- DROP FUNCTION IF EXISTS is_org_member(UUID);
-- DROP FUNCTION IF EXISTS get_user_org_ids();
