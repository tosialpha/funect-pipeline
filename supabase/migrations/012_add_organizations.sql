-- ============================================================================
-- Migration: Add Multi-Tenant Organization Support
-- This migration adds organization isolation to separate Funect and 77 Football data
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Organizations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast slug lookups (used in URL routing)
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create Organization Members Table (Many-to-Many User-Org)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Add organization_id to All Data Tables
-- ============================================================================

-- Prospects
ALTER TABLE prospects
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_prospects_org ON prospects(organization_id);

-- Calendar Events
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(organization_id);

-- Todos
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_todos_org ON todos(organization_id);

-- Contacts
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);

-- Activities
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(organization_id);

-- Offers
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_offers_org ON offers(organization_id);

-- Tags (also need to update unique constraint)
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tags_org ON tags(organization_id);

-- ============================================================================
-- STEP 4: Create Helper Function for RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get all org IDs a user belongs to
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Migrate Existing Data - Create Funect Organization
-- ============================================================================

-- Create the Funect organization for existing data
INSERT INTO organizations (name, slug)
VALUES ('Funect', 'funect')
ON CONFLICT (slug) DO NOTHING;

-- Migrate all existing data to Funect org
DO $$
DECLARE
  funect_org_id UUID;
BEGIN
  SELECT id INTO funect_org_id FROM organizations WHERE slug = 'funect';

  -- Update all existing records with the Funect organization
  UPDATE prospects SET organization_id = funect_org_id WHERE organization_id IS NULL;
  UPDATE calendar_events SET organization_id = funect_org_id WHERE organization_id IS NULL;
  UPDATE todos SET organization_id = funect_org_id WHERE organization_id IS NULL;
  UPDATE contacts SET organization_id = funect_org_id WHERE organization_id IS NULL;
  UPDATE activities SET organization_id = funect_org_id WHERE organization_id IS NULL;
  UPDATE offers SET organization_id = funect_org_id WHERE organization_id IS NULL;
  UPDATE tags SET organization_id = funect_org_id WHERE organization_id IS NULL;

  -- Add all existing auth users as members of Funect with admin role
  INSERT INTO organization_members (organization_id, user_id, role)
  SELECT funect_org_id, id, 'admin'
  FROM auth.users
  ON CONFLICT (organization_id, user_id) DO NOTHING;
END $$;

-- ============================================================================
-- STEP 6: Make organization_id NOT NULL After Migration
-- ============================================================================

ALTER TABLE prospects ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE calendar_events ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE todos ALTER COLUMN organization_id SET NOT NULL;
-- These may have no data, so set default for new records
ALTER TABLE contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE activities ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE offers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE tags ALTER COLUMN organization_id SET NOT NULL;

-- Update tags unique constraint to be per-organization
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE tags ADD CONSTRAINT tags_name_org_unique UNIQUE(name, organization_id);

-- ============================================================================
-- STEP 7: Drop Old RLS Policies
-- ============================================================================

-- Drop policies from prospects
DROP POLICY IF EXISTS "Users can view all prospects" ON prospects;
DROP POLICY IF EXISTS "Users can insert prospects" ON prospects;
DROP POLICY IF EXISTS "Users can update prospects" ON prospects;
DROP POLICY IF EXISTS "Admins can delete prospects" ON prospects;
DROP POLICY IF EXISTS "Allow authenticated users to insert prospects" ON prospects;
DROP POLICY IF EXISTS "Allow authenticated users to view prospects" ON prospects;
DROP POLICY IF EXISTS "Allow authenticated users to update prospects" ON prospects;
DROP POLICY IF EXISTS "Allow authenticated users to delete prospects" ON prospects;

-- Drop policies from contacts
DROP POLICY IF EXISTS "Users can view all contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON contacts;

-- Drop policies from activities
DROP POLICY IF EXISTS "Users can view all activities" ON activities;
DROP POLICY IF EXISTS "Users can insert activities" ON activities;
DROP POLICY IF EXISTS "Users can update activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;

-- Drop policies from offers
DROP POLICY IF EXISTS "Users can view all offers" ON offers;
DROP POLICY IF EXISTS "Users can insert offers" ON offers;
DROP POLICY IF EXISTS "Users can update offers" ON offers;
DROP POLICY IF EXISTS "Admins can delete offers" ON offers;

-- Drop policies from tags
DROP POLICY IF EXISTS "Users can view all tags" ON tags;
DROP POLICY IF EXISTS "Users can insert tags" ON tags;
DROP POLICY IF EXISTS "Admins can update tags" ON tags;
DROP POLICY IF EXISTS "Admins can delete tags" ON tags;

-- Drop policies from prospect_tags
DROP POLICY IF EXISTS "Users can view all prospect tags" ON prospect_tags;
DROP POLICY IF EXISTS "Users can insert prospect tags" ON prospect_tags;
DROP POLICY IF EXISTS "Users can delete prospect tags" ON prospect_tags;

-- Drop policies from todos
DROP POLICY IF EXISTS "Users can view all todos" ON todos;
DROP POLICY IF EXISTS "Users can create todos" ON todos;
DROP POLICY IF EXISTS "Users can update all todos" ON todos;
DROP POLICY IF EXISTS "Users can delete all todos" ON todos;

-- Drop policies from calendar_events
DROP POLICY IF EXISTS "Users can view all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete all calendar events" ON calendar_events;

-- ============================================================================
-- STEP 8: Create New Organization-Scoped RLS Policies
-- ============================================================================

-- Organization members policies (users can see their own memberships)
CREATE POLICY "Users can view their own memberships"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Organizations table policies (users can see orgs they belong to)
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Prospects table policies
CREATE POLICY "Org members can view prospects"
  ON prospects FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert prospects"
  ON prospects FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update prospects"
  ON prospects FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete prospects"
  ON prospects FOR DELETE TO authenticated
  USING (is_org_member(organization_id));

-- Calendar events policies
CREATE POLICY "Org members can view calendar events"
  ON calendar_events FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert calendar events"
  ON calendar_events FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update calendar events"
  ON calendar_events FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete calendar events"
  ON calendar_events FOR DELETE TO authenticated
  USING (is_org_member(organization_id));

-- Todos policies
CREATE POLICY "Org members can view todos"
  ON todos FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert todos"
  ON todos FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update todos"
  ON todos FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete todos"
  ON todos FOR DELETE TO authenticated
  USING (is_org_member(organization_id));

-- Contacts policies
CREATE POLICY "Org members can view contacts"
  ON contacts FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert contacts"
  ON contacts FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update contacts"
  ON contacts FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete contacts"
  ON contacts FOR DELETE TO authenticated
  USING (is_org_member(organization_id));

-- Activities policies
CREATE POLICY "Org members can view activities"
  ON activities FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert activities"
  ON activities FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update activities"
  ON activities FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete activities"
  ON activities FOR DELETE TO authenticated
  USING (is_org_member(organization_id));

-- Offers policies
CREATE POLICY "Org members can view offers"
  ON offers FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert offers"
  ON offers FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update offers"
  ON offers FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete offers"
  ON offers FOR DELETE TO authenticated
  USING (is_org_member(organization_id));

-- Tags policies
CREATE POLICY "Org members can view tags"
  ON tags FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert tags"
  ON tags FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update tags"
  ON tags FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete tags"
  ON tags FOR DELETE TO authenticated
  USING (is_org_member(organization_id));

-- Prospect tags policies (use prospect's organization via join)
CREATE POLICY "Org members can view prospect tags"
  ON prospect_tags FOR SELECT TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE is_org_member(organization_id)
    )
  );

CREATE POLICY "Org members can insert prospect tags"
  ON prospect_tags FOR INSERT TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT id FROM prospects WHERE is_org_member(organization_id)
    )
  );

CREATE POLICY "Org members can delete prospect tags"
  ON prospect_tags FOR DELETE TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE is_org_member(organization_id)
    )
  );

-- ============================================================================
-- STEP 9: Add updated_at trigger for new tables
-- ============================================================================

CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

CREATE OR REPLACE FUNCTION update_org_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_org_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_org_members_updated_at();
