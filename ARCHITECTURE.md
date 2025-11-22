# Architecture Overview - Funect Sales Pipeline

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                      (Next.js 15 App)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Dashboard  │  │   Pipeline   │  │  Prospects   │    │
│  │     Page     │  │     Page     │  │     Page     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           React Query (Data Fetching)               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              UI Components (shadcn/ui)              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTES (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /api/prospects     /api/activities     /api/offers        │
│  /api/analytics     /api/tags           /api/users         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Uses
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (Business Logic)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ProspectService   ActivityService   OfferService          │
│  AnalyticsService  TagService        CSVService            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Drizzle ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (Backend)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │  PostgreSQL Database │  │  Authentication      │       │
│  │  - 7 Tables          │  │  - Google OAuth      │       │
│  │  - RLS Policies      │  │  - Session Mgmt      │       │
│  │  - Triggers          │  │  - JWT Tokens        │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                             │
│  ┌──────────────────────┐                                  │
│  │  Storage (Files)     │                                  │
│  │  - Activity Attachs  │                                  │
│  └──────────────────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema (ERD)

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │◄──────────────────┐
│ email       │                   │
│ name        │                   │
│ role        │                   │ Assigned To
│ google_id   │                   │
└─────────────┘                   │
      ▲                           │
      │ User                      │
      │                           │
      │                    ┌──────────────┐
      │                    │  prospects   │
      │                    │──────────────│
      │                    │ id (PK)      │◄───────┐
      │                    │ name         │        │
      │                    │ type         │        │
      │                    │ country      │        │
      │                    │ city         │        │
      │                    │ pipeline_st. │        │
      │                    │ priority     │        │
      │                    │ assigned_to  │────────┘
      │                    │ notes        │
      │                    └──────────────┘
      │                           │
      │                           │ Prospect
      ├───────────────────────────┼────────────────────┐
      │                           │                    │
      │                           ▼                    ▼
      │                    ┌─────────────┐     ┌─────────────┐
      │                    │  contacts   │     │  activities │
      │                    │─────────────│     │─────────────│
      │                    │ id (PK)     │     │ id (PK)     │
      │                    │ prospect_id │     │ prospect_id │
      │                    │ name        │◄────┤ contact_id  │
      │                    │ email       │     │ user_id     │────┘
      │                    │ phone       │     │ type        │
      │                    │ is_primary  │     │ notes       │
      │                    └─────────────┘     │ attachments │
      │                                        └─────────────┘
      │
      │                           │
      │                           │ Prospect
      │                           ▼
      │                    ┌─────────────┐
      │                    │   offers    │
      │                    │─────────────│
      │                    │ id (PK)     │
      │                    │ prospect_id │
      │                    │ product_type│
      │                    │ amount      │
      │                    │ mrr / arr   │
      │                    │ status      │
      │                    └─────────────┘
      │
      │
      │                    ┌──────────────────┐
      │                    │  prospect_tags   │
      │                    │──────────────────│
      │                    │ prospect_id (FK) │
      │                    │ tag_id (FK)      │
      │                    └──────────────────┘
      │                           │
      │                           │ Many-to-Many
      │                           ▼
      │                    ┌─────────────┐
      │                    │    tags     │
      │                    │─────────────│
      │                    │ id (PK)     │
      │                    │ name        │
      │                    │ color       │
      │                    └─────────────┘
```

## 🔐 Security Model

### Row Level Security (RLS) Policies

```
users table:
  ✓ All users can view all users
  ✓ Only admins can create users
  ✓ Only admins can update users

prospects table:
  ✓ All users can view all prospects
  ✓ All users can create prospects
  ✓ All users can update prospects
  ✓ Only admins can delete prospects

contacts table:
  ✓ All users can view/create/update/delete contacts

activities table:
  ✓ All users can view all activities
  ✓ All users can create activities
  ✓ Users can only delete their own activities

offers table:
  ✓ All users can view/create/update offers
  ✓ Only admins can delete offers

tags table:
  ✓ All users can view/create tags
  ✓ Only admins can update/delete tags
```

### Authentication Flow

```
1. User clicks "Sign in with Google"
   │
   ▼
2. Redirect to Google OAuth
   │
   ▼
3. User approves with Funect Gmail
   │
   ▼
4. Google redirects to /auth/callback
   │
   ▼
5. Exchange code for session
   │
   ▼
6. Check if user exists in users table
   │
   ├─ No: Create new user with role='salesperson'
   │
   └─ Yes: Continue
   │
   ▼
7. Set session cookie
   │
   ▼
8. Redirect to /dashboard
```

## 🔄 Data Flow Example: Creating a Prospect

```
1. User fills out "New Prospect" form
   │
   ▼
2. Form submits to /api/prospects (POST)
   │
   ▼
3. API route calls ProspectService.createProspect()
   │
   ▼
4. Service validates input with Zod schema
   │
   ▼
5. Service checks for duplicates
   │  (by phone, website, company name)
   │
   ├─ Duplicate found: Return error
   │
   └─ No duplicate: Continue
   │
   ▼
6. Service inserts into prospects table via Drizzle
   │
   ▼
7. RLS policy checks auth.jwt() for valid user
   │
   ▼
8. Database returns new prospect with ID
   │
   ▼
9. Service returns to API route
   │
   ▼
10. API route returns JSON response
   │
   ▼
11. React Query updates cache
   │
   ▼
12. UI shows new prospect in list
```

## 📱 Pipeline Stages Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Cold Call   │───▶│  Short Demo  │───▶│  Long Demo   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │ Offer Sent   │
                                        └──────────────┘
                                               │
                                ┌──────────────┴──────────────┐
                                ▼                             ▼
                         ┌──────────────┐            ┌──────────────┐
                         │ Closed Won   │            │ Closed Lost  │
                         └──────────────┘            └──────────────┘
```

## 🎯 Feature Modules

### Dashboard Module
```
dashboard/
├── Analytics Cards
│   ├── Total Prospects
│   ├── Pipeline Value
│   ├── Win Rate
│   └── Active Deals
├── Charts
│   ├── Pipeline Distribution
│   └── Conversion Funnel
├── Upcoming Reminders
└── Recent Activities Feed
```

### Pipeline Module
```
pipeline/
├── View Toggle (Kanban/Table)
├── Kanban View
│   ├── Columns by Stage
│   ├── Drag & Drop
│   └── Prospect Cards
└── Table View
    ├── Search & Filters
    ├── Sortable Columns
    └── Bulk Actions
```

### Prospects Module
```
prospects/
├── Prospect List
├── Create/Edit Modal
│   ├── Basic Info
│   ├── Contacts
│   ├── Tags
│   └── Next Action
├── Detail View
│   ├── Activity Timeline
│   ├── Offers
│   └── Notes
└── Duplicate Detection
```

## 🛠️ Technology Stack

```
Frontend:
├── Next.js 15 (React 19)
├── TypeScript
├── Tailwind CSS
└── shadcn/ui

State Management:
├── React Query (server state)
└── React Hooks (local state)

Backend:
├── Next.js API Routes
├── Supabase
│   ├── PostgreSQL
│   ├── Authentication
│   └── Storage
└── Drizzle ORM

Development:
├── ESLint
├── Prettier (via ESLint)
└── TypeScript Strict Mode

Deployment:
├── Vercel (Frontend)
└── Supabase (Backend)
```

## 📦 Project Structure

```
sales-pipeline/
│
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (login)
│   ├── (dashboard)/         # Protected routes
│   ├── api/                 # API endpoints
│   └── auth/callback/       # OAuth callback
│
├── components/              # React components
│   ├── auth/               # Auth components
│   ├── ui/                 # shadcn/ui base
│   ├── prospects/          # Prospect features
│   ├── pipeline/           # Kanban & table
│   └── dashboard/          # Dashboard widgets
│
├── lib/                    # Core libraries
│   ├── db/                # Database (Drizzle)
│   ├── supabase/          # Auth clients
│   └── utils.ts           # Utilities
│
├── services/              # Business logic
│   ├── prospects/
│   ├── activities/
│   ├── offers/
│   └── analytics/
│
├── hooks/                 # React hooks
├── types/                 # TypeScript types
└── supabase/             # Database migrations
```

## 🔄 Development Workflow

```
1. Design Database Schema
   │
   ▼
2. Create Migration SQL
   │
   ▼
3. Apply to Supabase
   │
   ▼
4. Generate TypeScript Types (Drizzle)
   │
   ▼
5. Create Service Class
   │
   ▼
6. Build API Routes
   │
   ▼
7. Create React Query Hooks
   │
   ▼
8. Build UI Components
   │
   ▼
9. Test & Iterate
```

## 📈 Scalability Considerations

- **Database**: PostgreSQL can handle millions of rows
- **Indexes**: Optimized for common queries
- **RLS**: Security without performance penalty
- **React Query**: Efficient caching and updates
- **API Routes**: Edge-ready with Vercel
- **CDN**: Static assets cached globally

## 🎨 Design System

```
Colors:
├── Primary: Teal (#00C896)
├── Secondary: Slate
├── Success: Green
├── Warning: Orange
├── Danger: Red
└── Info: Blue

Components:
├── Buttons: Primary, Secondary, Ghost, Link
├── Inputs: Text, Select, Textarea, Checkbox
├── Cards: Default, Hover, Selected
├── Badges: Pipeline stage colors
└── Modals: Full-screen on mobile
```

---

This architecture is designed to be:
- ✅ **Secure** - RLS policies on everything
- ✅ **Scalable** - Can handle thousands of prospects
- ✅ **Type-safe** - TypeScript throughout
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Fast** - Optimized queries and caching
