# Quick Start - Apply Database Migration

## ✅ Step 1: Environment Variables Configured

Your `.env.local` file has been created with your Supabase credentials.

**⚠️ Important:** You need to add your database password to complete the `DATABASE_URL`.

Find your database password in Supabase Dashboard → Project Settings → Database → Connection String

Update this line in `.env.local`:
```
DATABASE_URL=postgresql://postgres.tmlydufhzyaegbsbuzlg:[YOUR-DB-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 🗄️ Step 2: Apply Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/tmlydufhzyaegbsbuzlg

2. Click on **SQL Editor** in the left sidebar

3. Click **+ New query**

4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`

5. Paste into the SQL editor

6. Click **Run** or press `Cmd/Ctrl + Enter`

7. You should see: "Success. No rows returned"

8. Verify tables were created:
   - Go to **Table Editor**
   - You should see: users, prospects, contacts, activities, offers, tags, prospect_tags

### Option B: Via Terminal (Alternative)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref tmlydufhzyaegbsbuzlg

# Push the migration
supabase db push
```

## 🔐 Step 3: Enable Google Authentication

1. In Supabase Dashboard → **Authentication** → **Providers**

2. Find **Google** and click to configure

3. Enable the Google provider

4. You'll need to create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://tmlydufhzyaegbsbuzlg.supabase.co/auth/v1/callback`

5. Paste your Google Client ID and Client Secret into Supabase

6. Update `.env.local` with the same credentials:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## 🚀 Step 4: Install Dependencies & Run

```bash
# Install all dependencies
npm install

# Install UI components
./install-ui-components.sh

# Start development server
npm run dev
```

## ✅ Step 5: Verify Setup

1. Open http://localhost:3000

2. You should see the login page

3. Click "Sign in with Google"

4. Sign in with your Funect Google account

5. Check Supabase Dashboard → **Table Editor** → **users** table
   - You should see your user created

6. Update your role to admin:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@funect.com';
   ```

## 🎯 Next Steps

Once the database is set up and you can log in:

1. Follow `BUILD_CHECKLIST.md` to continue development
2. Start with creating the dashboard layout
3. Build the ProspectService
4. Create the API routes

## 📊 Database Schema Overview

Your database now has:

- **7 tables**: users, prospects, contacts, activities, offers, tags, prospect_tags
- **6 enums**: user_role, pipeline_stage, priority, activity_type, offer_status, lead_source
- **24 RLS policies**: Full security on all tables
- **7 indexes**: Optimized for common queries
- **4 triggers**: Auto-update timestamps
- **5 default tags**: Hot, High Value, Call Again, Long-term, Quick Win

## 🆘 Troubleshooting

**Can't connect to database?**
- Verify DATABASE_URL has correct password
- Check Supabase project is not paused

**Google OAuth not working?**
- Verify redirect URI matches exactly
- Check Client ID and Secret are correct
- Ensure Google provider is enabled in Supabase

**Migration errors?**
- Drop all tables and re-run migration
- Check for existing tables with same names
- Verify uuid-ossp extension is enabled

---

**Your Supabase Project:** https://supabase.com/dashboard/project/tmlydufhzyaegbsbuzlg
