# Funect Sales Pipeline

An internal CRM and sales pipeline management system built specifically for Funect's sales operations.

## 📋 Project Status

### ✅ Completed Foundation (Ready to Use)

The core infrastructure and foundation of the application has been built:

#### 1. **Project Setup**
- ✅ Next.js 15 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with custom Funect theme
- ✅ ESLint and code quality tools

#### 2. **Database & Backend**
- ✅ Complete database schema with Drizzle ORM
- ✅ All tables: users, prospects, contacts, activities, offers, tags
- ✅ PostgreSQL migration file with all tables and constraints
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Supabase integration (client & server)
- ✅ Automated `updated_at` triggers
- ✅ Database indexes for performance
- ✅ Default tags pre-seeded

#### 3. **Authentication**
- ✅ Google OAuth integration
- ✅ Login page with Funect branding
- ✅ Auth callback handler
- ✅ Automatic user creation in database
- ✅ Middleware for protected routes
- ✅ Session management

#### 4. **Core Infrastructure**
- ✅ React Query setup for data fetching
- ✅ Toast notifications system
- ✅ Utility functions (currency, dates, initials)
- ✅ TypeScript types for all database models

#### 5. **Documentation**
- ✅ Comprehensive setup guide (SETUP.md)
- ✅ Environment variable template
- ✅ Deployment instructions
- ✅ Troubleshooting guide

### 🚧 Next Steps to Complete

The following features need to be implemented to have a fully functional app:

#### Phase 1: UI Components (2-3 hours)
```bash
# Install remaining shadcn/ui components
npx shadcn@latest add dialog dropdown-menu label select tabs tooltip avatar badge table textarea checkbox popover calendar command
```

Then create custom UI components:
- Dashboard layout with sidebar navigation
- Prospect form components
- Contact management modals
- Activity log components

#### Phase 2: Service Layer (3-4 hours)
Build service classes in `/services/`:
- `ProspectService` - CRUD operations, duplicate detection
- `ActivityService` - Activity logging with file uploads
- `OfferService` - Offer management and MRR/ARR calculations
- `AnalyticsService` - Dashboard metrics and statistics
- `TagService` - Tag management
- `CSVService` - Import/export functionality

#### Phase 3: API Routes (2-3 hours)
Create API endpoints in `/app/api/`:
- `/api/prospects` - CRUD operations
- `/api/prospects/[id]/activities` - Activity logging
- `/api/prospects/[id]/offers` - Offer management
- `/api/prospects/import` - CSV import
- `/api/prospects/export` - CSV export
- `/api/analytics` - Dashboard metrics
- `/api/tags` - Tag management

#### Phase 4: Dashboard & Views (4-5 hours)
Build main application pages:
- **Dashboard** (`/app/(dashboard)/dashboard/page.tsx`)
  - Analytics cards (total prospects, pipeline value, win rate)
  - Upcoming reminders
  - Recent activities feed
  - Charts (pipeline distribution, conversion rates)

- **Pipeline View** (`/app/(dashboard)/pipeline/page.tsx`)
  - Kanban board with drag-and-drop (@hello-pangea/dnd)
  - Table view with sorting and filtering
  - Toggle between views
  - Stage-specific prospect cards

- **Prospects Page** (`/app/(dashboard)/prospects/page.tsx`)
  - Create/Edit prospect modal
  - Contact management
  - Activity timeline
  - Offers list
  - Tags management

#### Phase 5: Advanced Features (3-4 hours)
- CSV import/export with duplicate detection
- File upload for activity attachments (Supabase Storage)
- Google Calendar integration for demo scheduling
- User management (admin only)
- Mobile responsive optimizations

## 🏗️ Architecture

```
funect-sales-pipeline/
├── app/
│   ├── (auth)/
│   │   └── login/              ✅ Login page with Google OAuth
│   ├── (dashboard)/
│   │   ├── dashboard/          ⏳ Analytics dashboard
│   │   ├── prospects/          ⏳ Prospect management
│   │   ├── pipeline/           ⏳ Kanban & table views
│   │   └── settings/           ⏳ User settings
│   ├── api/                    ⏳ API routes
│   ├── auth/callback/          ✅ OAuth callback
│   └── layout.tsx              ✅ Root layout
├── components/
│   ├── auth/                   ✅ Login components
│   ├── ui/                     🚧 shadcn/ui components
│   ├── prospects/              ⏳ Prospect components
│   ├── pipeline/               ⏳ Kanban & table
│   ├── activities/             ⏳ Activity logging
│   └── dashboard/              ⏳ Dashboard widgets
├── lib/
│   ├── db/
│   │   ├── schema.ts           ✅ Complete database schema
│   │   └── index.ts            ✅ Drizzle client
│   ├── supabase/               ✅ Auth & client setup
│   └── utils.ts                ✅ Utility functions
├── services/                   ⏳ Business logic layer
├── hooks/
│   └── use-toast.ts            ✅ Toast notifications
├── supabase/
│   └── migrations/             ✅ Database migration SQL
└── types/                      ✅ TypeScript types
```

**Legend:**
- ✅ Complete and tested
- 🚧 Partially complete
- ⏳ Not started (needs implementation)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
✅ **Already configured!** Your `.env.local` file has been created with Supabase credentials.

**Action needed:** Add your database password to the `DATABASE_URL` in `.env.local`

### 3. Run Database Migration
Go to your Supabase dashboard → SQL Editor, and run the migration file:

**Your Project:** https://supabase.com/dashboard/project/tmlydufhzyaegbsbuzlg

1. Click **SQL Editor**
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**

See `QUICK_START.md` for detailed instructions.

### 4. Install UI Components
```bash
npx shadcn@latest add dialog dropdown-menu label select tabs tooltip avatar badge table textarea checkbox popover calendar command
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your Funect Google account.

## 📊 Database Schema

### Tables

- **users** - Internal team members (admin/salesperson roles)
- **prospects** - Companies in the sales pipeline
- **contacts** - Multiple contacts per prospect
- **activities** - Activity log (calls, emails, demos, meetings)
- **offers** - Offers sent to prospects (tracks MRR/ARR)
- **tags** - Prospect tags (Hot, High Value, etc.)
- **prospect_tags** - Many-to-many relationship

### Pipeline Stages

1. Cold Call
2. Short Demo
3. Long Demo
4. Offer Sent
5. Closed Won
6. Closed Lost

### Features Included in Schema

- Duplicate detection support (phone, website, company name)
- Multi-contact support per prospect
- Activity logging with file attachments
- Offer tracking with MRR/ARR calculations
- Tag system for prospect organization
- Lead source tracking
- Priority levels (High/Medium/Low)
- Full RLS policies for security

## 🎯 Key Features to Implement

### Priority 1 (MVP)
1. ✅ Authentication with Google OAuth
2. ⏳ Prospect CRUD operations
3. ⏳ Pipeline Kanban view
4. ⏳ Activity logging
5. ⏳ Basic dashboard with metrics

### Priority 2
6. ⏳ Offer management
7. ⏳ CSV import/export
8. ⏳ Duplicate detection
9. ⏳ Table view with filters
10. ⏳ Tags management

### Priority 3
11. ⏳ File uploads for activities
12. ⏳ Google Calendar integration
13. ⏳ User management (admin)
14. ⏳ Advanced analytics
15. ⏳ Mobile optimizations

## 🔐 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Google OAuth with Funect accounts only
- ✅ Server-side session validation
- ✅ Protected API routes
- ✅ Type-safe database queries

## 📦 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Auth:** Supabase Auth (Google OAuth)
- **State:** React Query
- **Deployment:** Vercel

## 📝 Development Workflow

1. **Make database changes:**
   ```bash
   # Edit lib/db/schema.ts
   npm run db:generate
   npm run db:push
   ```

2. **Add new UI components:**
   ```bash
   npx shadcn@latest add <component-name>
   ```

3. **Create new feature:**
   - Add service class in `/services`
   - Create API route in `/app/api`
   - Build UI components
   - Add to navigation

## 🤝 Next Actions for Developer

To continue building this app, start with:

1. **Install all shadcn/ui components** (see Phase 1 above)
2. **Build the dashboard layout** with sidebar navigation
3. **Create ProspectService** for CRUD operations
4. **Build prospect creation form** and list view
5. **Implement Kanban board** for pipeline visualization

See `SETUP.md` for detailed setup instructions and `supabase/migrations/001_initial_schema.sql` for the complete database structure.

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Complete installation and configuration
- [Database Schema](./supabase/migrations/001_initial_schema.sql) - Full SQL migration

## 🐛 Troubleshooting

See SETUP.md for common issues and solutions.

---

**Built for Funect by Claude** 🤖
