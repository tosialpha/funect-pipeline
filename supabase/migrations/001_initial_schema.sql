-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'salesperson');
CREATE TYPE pipeline_stage AS ENUM ('cold_call', 'short_demo', 'long_demo', 'offer_sent', 'closed_won', 'closed_lost');
CREATE TYPE priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'demo', 'meeting', 'reminder', 'linkedin', 'whatsapp');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE lead_source AS ENUM ('cold_outreach', 'inbound', 'referral', 'linkedin', 'website', 'event', 'other');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'salesperson',
    google_id TEXT UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prospects table
CREATE TABLE prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    website TEXT,
    phone TEXT,
    pipeline_stage pipeline_stage NOT NULL DEFAULT 'cold_call',
    priority priority NOT NULL DEFAULT 'medium',
    lead_source lead_source NOT NULL DEFAULT 'cold_outreach',
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    next_action TEXT,
    next_action_date TIMESTAMP,
    last_activity_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    type activity_type NOT NULL,
    notes TEXT,
    attachments JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Offers table
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    contract_length_months INTEGER NOT NULL DEFAULT 12,
    mrr DECIMAL(10, 2) NOT NULL,
    arr DECIMAL(10, 2) NOT NULL,
    status offer_status NOT NULL DEFAULT 'pending',
    pdf_link TEXT,
    sent_date TIMESTAMP,
    response_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#00C896',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prospect-Tags junction table
CREATE TABLE prospect_tags (
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (prospect_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX idx_prospects_assigned_to ON prospects(assigned_to);
CREATE INDEX idx_prospects_pipeline_stage ON prospects(pipeline_stage);
CREATE INDEX idx_prospects_created_at ON prospects(created_at);
CREATE INDEX idx_contacts_prospect_id ON contacts(prospect_id);
CREATE INDEX idx_activities_prospect_id ON activities(prospect_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_offers_prospect_id ON offers(prospect_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert users"
    ON users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update users"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

-- RLS Policies for prospects table
CREATE POLICY "Users can view all prospects"
    ON prospects FOR SELECT
    USING (true);

CREATE POLICY "Users can insert prospects"
    ON prospects FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update prospects"
    ON prospects FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Admins can delete prospects"
    ON prospects FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

-- RLS Policies for contacts table
CREATE POLICY "Users can view all contacts"
    ON contacts FOR SELECT
    USING (true);

CREATE POLICY "Users can insert contacts"
    ON contacts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update contacts"
    ON contacts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete contacts"
    ON contacts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policies for activities table
CREATE POLICY "Users can view all activities"
    ON activities FOR SELECT
    USING (true);

CREATE POLICY "Users can insert activities"
    ON activities FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update activities"
    ON activities FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their own activities"
    ON activities FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policies for offers table
CREATE POLICY "Users can view all offers"
    ON offers FOR SELECT
    USING (true);

CREATE POLICY "Users can insert offers"
    ON offers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update offers"
    ON offers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Admins can delete offers"
    ON offers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

-- RLS Policies for tags table
CREATE POLICY "Users can view all tags"
    ON tags FOR SELECT
    USING (true);

CREATE POLICY "Users can insert tags"
    ON tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Admins can update tags"
    ON tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete tags"
    ON tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

-- RLS Policies for prospect_tags table
CREATE POLICY "Users can view all prospect tags"
    ON prospect_tags FOR SELECT
    USING (true);

CREATE POLICY "Users can insert prospect tags"
    ON prospect_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete prospect tags"
    ON prospect_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.google_id = auth.jwt() ->> 'sub'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tags
INSERT INTO tags (name, color) VALUES
    ('Hot', '#ef4444'),
    ('High Value', '#f59e0b'),
    ('Call Again', '#3b82f6'),
    ('Long-term', '#8b5cf6'),
    ('Quick Win', '#10b981');
