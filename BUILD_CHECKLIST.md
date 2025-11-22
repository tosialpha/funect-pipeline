# Build Checklist - Funect Sales Pipeline

## ✅ Phase 1: Foundation (COMPLETE)

### Project Setup
- [x] Initialize Next.js 15 with TypeScript
- [x] Configure Tailwind CSS with custom theme
- [x] Set up ESLint and code quality tools
- [x] Create package.json with all dependencies
- [x] Configure tsconfig.json
- [x] Set up Git ignore and environment templates

### Database & Schema
- [x] Design complete database schema
- [x] Create Drizzle ORM schema file
- [x] Write PostgreSQL migration SQL
- [x] Add all enums (pipeline stages, activity types, etc.)
- [x] Create indexes for performance
- [x] Set up database client
- [x] Configure Drizzle Kit

### Security & RLS
- [x] Enable RLS on all tables
- [x] Create policies for users table
- [x] Create policies for prospects table
- [x] Create policies for contacts table
- [x] Create policies for activities table
- [x] Create policies for offers table
- [x] Create policies for tags table
- [x] Create policies for prospect_tags table
- [x] Add updated_at triggers

### Authentication
- [x] Set up Supabase client (browser)
- [x] Set up Supabase client (server)
- [x] Create middleware for auth
- [x] Build login page
- [x] Create login button component
- [x] Implement OAuth callback handler
- [x] Auto-create users in database
- [x] Configure protected routes

### Core Infrastructure
- [x] Set up React Query provider
- [x] Create toast notification system
- [x] Build utility functions (formatCurrency, formatDate, etc.)
- [x] Create TypeScript types from schema
- [x] Set up providers component
- [x] Configure Next.js for Supabase

### Documentation
- [x] Write comprehensive SETUP.md
- [x] Create README.md with architecture
- [x] Document database schema
- [x] Add environment variable examples
- [x] Write deployment guide
- [x] Add troubleshooting section

---

## 🚧 Phase 2: UI Components (IN PROGRESS)

### shadcn/ui Components to Install
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add tabs
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

### Core Components Created
- [x] Button
- [x] Input
- [x] Card
- [x] Toast
- [ ] Dialog
- [ ] Dropdown Menu
- [ ] Label
- [ ] Select
- [ ] Tabs
- [ ] Tooltip
- [ ] Avatar
- [ ] Badge
- [ ] Table
- [ ] Textarea
- [ ] Checkbox
- [ ] Popover
- [ ] Calendar
- [ ] Command

### Custom Components Needed
- [ ] Dashboard layout with sidebar
- [ ] Navigation component
- [ ] User menu dropdown
- [ ] Prospect card component
- [ ] Activity timeline component
- [ ] Tag badge component
- [ ] Stats card component
- [ ] Chart components (using recharts)
- [ ] Empty state components
- [ ] Loading skeletons

---

## 📦 Phase 3: Service Layer (TODO)

### Services to Create

#### ProspectService (`/services/prospects/prospect-service.ts`)
- [ ] `getProspects()` - List all with filters
- [ ] `getProspectById(id)` - Get single prospect with relations
- [ ] `createProspect(data)` - Create new prospect
- [ ] `updateProspect(id, data)` - Update prospect
- [ ] `deleteProspect(id)` - Delete prospect (admin only)
- [ ] `checkDuplicates(data)` - Check for duplicate prospects
- [ ] `updatePipelineStage(id, stage)` - Move prospect through pipeline
- [ ] `getProspectsByStage(stage)` - Get prospects for Kanban view

#### ContactService (`/services/contacts/contact-service.ts`)
- [ ] `getContactsByProspect(prospectId)` - List contacts
- [ ] `createContact(prospectId, data)` - Add contact
- [ ] `updateContact(id, data)` - Update contact
- [ ] `deleteContact(id)` - Remove contact
- [ ] `setPrimaryContact(prospectId, contactId)` - Set primary

#### ActivityService (`/services/activities/activity-service.ts`)
- [ ] `getActivitiesByProspect(prospectId)` - Activity timeline
- [ ] `createActivity(data)` - Log new activity
- [ ] `uploadAttachment(file)` - Upload to Supabase Storage
- [ ] `deleteActivity(id)` - Remove activity (own only)
- [ ] `getRecentActivities()` - Dashboard feed

#### OfferService (`/services/offers/offer-service.ts`)
- [ ] `getOffersByProspect(prospectId)` - List offers
- [ ] `createOffer(data)` - Create offer with MRR/ARR calc
- [ ] `updateOffer(id, data)` - Update offer
- [ ] `updateOfferStatus(id, status)` - Accept/reject offer
- [ ] `calculateMRR(amount, contractLength)` - Calculate MRR
- [ ] `calculateARR(mrr)` - Calculate ARR

#### TagService (`/services/tags/tag-service.ts`)
- [ ] `getTags()` - List all tags
- [ ] `createTag(name, color)` - Create new tag
- [ ] `addTagToProspect(prospectId, tagId)` - Assign tag
- [ ] `removeTagFromProspect(prospectId, tagId)` - Remove tag
- [ ] `deleteTag(id)` - Delete tag (admin only)

#### AnalyticsService (`/services/analytics/analytics-service.ts`)
- [ ] `getDashboardMetrics()` - Total prospects, pipeline value, win rate
- [ ] `getProspectsByStage()` - Count per stage
- [ ] `getConversionRates()` - Stage-to-stage conversion
- [ ] `getUpcomingReminders()` - Next actions this week
- [ ] `getSalespersonStats(userId)` - Per-user metrics
- [ ] `getPipelineValue()` - Sum of all offer amounts

#### CSVService (`/services/csv/csv-service.ts`)
- [ ] `importProspects(file)` - Parse CSV and create prospects
- [ ] `exportProspects(filters)` - Generate CSV from prospects
- [ ] `validateCSVFormat(data)` - Check CSV structure
- [ ] `detectDuplicatesInImport(data)` - Pre-import duplicate check

---

## 🌐 Phase 4: API Routes (TODO)

### Prospect Routes
- [ ] `POST /api/prospects` - Create prospect
- [ ] `GET /api/prospects` - List with filters
- [ ] `GET /api/prospects/[id]` - Get single
- [ ] `PATCH /api/prospects/[id]` - Update
- [ ] `DELETE /api/prospects/[id]` - Delete (admin)
- [ ] `POST /api/prospects/import` - CSV import
- [ ] `GET /api/prospects/export` - CSV export
- [ ] `GET /api/prospects/duplicates` - Check duplicates

### Activity Routes
- [ ] `POST /api/prospects/[id]/activities` - Log activity
- [ ] `GET /api/prospects/[id]/activities` - Get activities
- [ ] `DELETE /api/activities/[id]` - Delete activity

### Offer Routes
- [ ] `POST /api/prospects/[id]/offers` - Create offer
- [ ] `GET /api/prospects/[id]/offers` - Get offers
- [ ] `PATCH /api/offers/[id]` - Update offer
- [ ] `DELETE /api/offers/[id]` - Delete offer

### Tag Routes
- [ ] `GET /api/tags` - List tags
- [ ] `POST /api/tags` - Create tag
- [ ] `POST /api/prospects/[id]/tags` - Add tag
- [ ] `DELETE /api/prospects/[id]/tags/[tagId]` - Remove tag

### Analytics Routes
- [ ] `GET /api/analytics/dashboard` - Dashboard metrics
- [ ] `GET /api/analytics/pipeline` - Pipeline stats

### User Routes
- [ ] `GET /api/users` - List users
- [ ] `PATCH /api/users/[id]` - Update user (admin)
- [ ] `GET /api/users/me` - Current user

---

## 🎨 Phase 5: Pages & UI (TODO)

### Dashboard Page (`/app/(dashboard)/dashboard/page.tsx`)
- [ ] Analytics cards (prospects count, pipeline value, win rate)
- [ ] Pipeline distribution chart
- [ ] Conversion funnel chart
- [ ] Upcoming reminders list
- [ ] Recent activities feed
- [ ] Quick actions (New Prospect, Log Activity)

### Pipeline Page (`/app/(dashboard)/pipeline/page.tsx`)
- [ ] View toggle (Kanban/Table)
- [ ] **Kanban View:**
  - [ ] Column for each pipeline stage
  - [ ] Drag-and-drop cards between stages
  - [ ] Prospect cards with name, contact, value
  - [ ] Color-coded by priority
  - [ ] Quick actions on hover
- [ ] **Table View:**
  - [ ] Sortable columns
  - [ ] Search bar
  - [ ] Filters (stage, priority, assigned to, tags)
  - [ ] Bulk actions
  - [ ] Export button

### Prospects Page (`/app/(dashboard)/prospects/page.tsx`)
- [ ] Prospects list with search and filters
- [ ] Create prospect button → modal
- [ ] Prospect detail modal:
  - [ ] Edit prospect info
  - [ ] Contacts list with add/edit
  - [ ] Activity timeline
  - [ ] Offers list
  - [ ] Tags management
  - [ ] Delete button (admin only)

### Settings Page (`/app/(dashboard)/settings/page.tsx`)
- [ ] User profile
- [ ] Tag management (admin)
- [ ] User management (admin)
- [ ] Data export

---

## 🔧 Phase 6: Advanced Features (TODO)

### Duplicate Detection
- [ ] Check on prospect creation
- [ ] Check on CSV import
- [ ] Show similar prospects
- [ ] Merge prospects feature

### File Uploads
- [ ] Configure Supabase Storage bucket
- [ ] Create upload component
- [ ] Handle file attachments in activities
- [ ] Display file previews
- [ ] Delete files

### Google Calendar Integration
- [ ] Set up Google Calendar API
- [ ] Create calendar event on demo scheduling
- [ ] Sync reminders
- [ ] Two-way sync

### CSV Import/Export
- [ ] CSV template download
- [ ] File upload with validation
- [ ] Preview import data
- [ ] Duplicate detection in import
- [ ] Error handling
- [ ] Export with filters

### Mobile Optimization
- [ ] Responsive navigation
- [ ] Mobile-friendly forms
- [ ] Touch-friendly Kanban
- [ ] Optimized tables for mobile

---

## 🚀 Phase 7: Polish & Deploy (TODO)

### Testing
- [ ] Test all CRUD operations
- [ ] Test RLS policies
- [ ] Test duplicate detection
- [ ] Test CSV import/export
- [ ] Test on mobile devices

### Performance
- [ ] Optimize database queries
- [ ] Add loading states everywhere
- [ ] Implement pagination
- [ ] Add error boundaries
- [ ] Cache common queries

### Deployment
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Configure environment variables
- [ ] Update OAuth redirect URIs
- [ ] Test production build
- [ ] Set up monitoring

### Final Touches
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add empty states
- [ ] Create onboarding guide
- [ ] Add keyboard shortcuts

---

## 📊 Progress Summary

- ✅ **Foundation:** 100% Complete
- 🚧 **UI Components:** 30% Complete
- ⏳ **Service Layer:** 0% Complete
- ⏳ **API Routes:** 0% Complete
- ⏳ **Pages & UI:** 0% Complete
- ⏳ **Advanced Features:** 0% Complete
- ⏳ **Deploy:** 0% Complete

**Overall Progress: ~15%**

---

## ⏭️ Immediate Next Steps

1. Install all shadcn/ui components (30 mins)
2. Create dashboard layout with sidebar (1 hour)
3. Build ProspectService with basic CRUD (2 hours)
4. Create prospect API routes (1 hour)
5. Build prospect creation form (2 hours)
6. Implement Kanban view (3 hours)

**Estimated time to MVP: 12-15 hours of focused development**
