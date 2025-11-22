# ✅ Immediate Next Steps - Complete Setup in 15 Minutes

## What's Already Done

✅ Supabase credentials configured in `.env.local`
✅ Database schema designed
✅ Migration SQL ready
✅ Authentication system built
✅ Project foundation complete

## What You Need to Do Now

### Step 1: Apply Database Migration (3 minutes)

1. Go to: https://supabase.com/dashboard/project/tmlydufhzyaegbsbuzlg
2. Click **SQL Editor** in left sidebar
3. Click **+ New query** button
4. Open this file on your computer: `supabase/migrations/001_initial_schema.sql`
5. Copy ALL the contents (365 lines)
6. Paste into Supabase SQL Editor
7. Click **Run** (or Cmd/Ctrl + Enter)
8. Wait for "Success. No rows returned" message

### Step 2: Verify Tables Created (1 minute)

1. In Supabase Dashboard, click **Table Editor**
2. You should see 7 tables:
   - ✅ users
   - ✅ prospects
   - ✅ contacts
   - ✅ activities
   - ✅ offers
   - ✅ tags
   - ✅ prospect_tags

3. Click on **tags** table - you should see 5 default tags:
   - Hot (red)
   - High Value (orange)
   - Call Again (blue)
   - Long-term (purple)
   - Quick Win (green)

### Step 3: Set Up Google OAuth (5 minutes)

#### A. Create Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Select your project (or create new)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: "Funect Sales Pipeline"
7. **Authorized redirect URIs** - Add:
   ```
   https://tmlydufhzyaegbsbuzlg.supabase.co/auth/v1/callback
   ```
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

#### B. Configure in Supabase

1. Back to Supabase Dashboard
2. Click **Authentication** → **Providers**
3. Find **Google** and enable it
4. Paste your **Client ID**
5. Paste your **Client Secret**
6. Click **Save**

#### C. Update .env.local

Add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### Step 4: Install & Run (4 minutes)

```bash
# Navigate to project
cd /Users/alexandrmalmberg/Desktop/sales-pipeline

# Install dependencies
npm install

# Make script executable (if needed)
chmod +x install-ui-components.sh

# Install UI components
./install-ui-components.sh

# Start development server
npm run dev
```

### Step 5: Test Login (1 minute)

1. Open: http://localhost:3000
2. You should see the login page
3. Click **Sign in with Google**
4. Sign in with your Funect Gmail account
5. You should be redirected to dashboard (currently shows "redirect to dashboard")

### Step 6: Make Yourself Admin (1 minute)

1. Go back to Supabase Dashboard
2. Click **Table Editor** → **users**
3. Find your email in the list
4. Click to edit your row
5. Change `role` from `salesperson` to `admin`
6. Click **Save**

---

## 🎉 Setup Complete!

You now have:
- ✅ Database with all tables and security policies
- ✅ Google authentication working
- ✅ Your account with admin privileges
- ✅ Development server running

## 🚀 Ready to Build

Next, follow `BUILD_CHECKLIST.md` to start building features:

1. **First Feature:** Dashboard layout with sidebar
2. **Second Feature:** Prospect creation form
3. **Third Feature:** Kanban pipeline view

---

## 🆘 Troubleshooting

### Can't log in?
- Check Google OAuth redirect URI is exact
- Verify Client ID/Secret in Supabase match .env.local
- Check browser console for errors

### Database connection error?
- Verify DATABASE_URL password is correct
- Make sure Supabase project is not paused

### Tables not created?
- Check SQL Editor for error messages
- Try running migration again (it's idempotent)
- Make sure uuid-ossp extension is enabled

### npm install fails?
- Make sure Node.js 18+ is installed
- Delete node_modules and package-lock.json, try again

---

**Total Time: ~13 minutes** (2 minutes faster without database password!)

After completing these steps, you'll have a fully functional authentication system and database ready to build upon!
