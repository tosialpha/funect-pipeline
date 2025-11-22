# Funect Sales Pipeline - Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account
- A Google Cloud account (for OAuth)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run the database migration:**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run the SQL migration
   - This will create all tables, RLS policies, and default data

3. **Enable Google OAuth in Supabase:**
   - Go to Authentication → Providers
   - Enable Google provider
   - You'll add the client ID and secret in the next step

## Step 3: Set Up Google OAuth

1. **Create OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for local dev)
     - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Note your Client ID and Client Secret

2. **Add credentials to Supabase:**
   - In Supabase: Authentication → Providers → Google
   - Paste your Client ID and Client Secret
   - Save

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in the values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (for Drizzle)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### How to find your values:

- **Supabase URL & Keys:** Supabase Dashboard → Project Settings → API
- **Database URL:** Supabase Dashboard → Project Settings → Database → Connection string (URI)
  - Replace `[password]` with your database password
- **Google OAuth:** From Step 3

## Step 5: Install Additional shadcn/ui Components

We need to install the remaining UI components used in the app:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add toast
npx shadcn@latest add tooltip
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add popover
npx shadcn@latest add calendar
npx shadcn@latest add command
```

## Step 6: Create Your First Admin User

After setting up Google OAuth, you'll need to manually create your first admin user in the database:

1. Sign in to the app using Google OAuth (this creates a user in Supabase Auth)
2. Go to Supabase Dashboard → Table Editor → `users` table
3. Find your user and update:
   - Set `role` to `'admin'`
   - This gives you admin permissions

Alternatively, run this SQL in Supabase SQL Editor (replace the email):

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@funect.com';
```

## Step 7: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Verify Setup

1. Sign in with your Funect Google account
2. You should be redirected to the dashboard
3. Try creating a prospect to verify database connectivity
4. Check that RLS policies are working (you should only see your own data)

## Optional: Database Tools

### Drizzle Studio (Visual Database Editor)

```bash
npm run db:studio
```

This opens a visual interface to browse and edit your database.

### Generate Types After Schema Changes

If you modify the database schema:

```bash
npm run db:generate
npm run db:push
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import to Vercel
3. Add all environment variables from `.env.local`
4. Update Google OAuth redirect URIs to include your Vercel URL
5. Deploy!

### Update Authorized Domains

After deployment, update these URLs:

1. **Google Cloud Console:**
   - Add `https://your-app.vercel.app/auth/callback`

2. **Supabase:**
   - Authentication → URL Configuration
   - Add your Vercel URL to "Site URL" and "Redirect URLs"

## Troubleshooting

### Authentication not working

- Verify all environment variables are set correctly
- Check Google OAuth redirect URIs match exactly
- Ensure Supabase Google provider is enabled

### Database connection errors

- Verify DATABASE_URL is correct
- Check Supabase project is not paused
- Ensure RLS policies are enabled

### Import errors

- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

## Next Steps

1. Invite team members (they'll need Funect Gmail accounts)
2. Import existing prospects via CSV (Dashboard → Import)
3. Set up tags for your pipeline
4. Customize pipeline stages if needed

## Support

For issues, contact the development team or check the GitHub repository.
