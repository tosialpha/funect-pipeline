/**
 * Insert Lampila Golf Launch Sprint Todos
 *
 * Run this script to add all sprint tasks to the sales-pipeline todo system.
 *
 * Usage:
 *   cd /Users/alexandrmalmberg/Desktop/sales-pipeline
 *   npx tsx scripts/insert-launch-sprint-todos.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlydufhzyaegbsbuzlg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHlkdWZoenlhZWdic2J1emxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc2NTAyMCwiZXhwIjoyMDc5MzQxMDIwfQ.BZScT8Zxw5TwwTaSfq500Qw_O9bEwffh3q3CTm_cdWM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Todo {
  title: string;
  description: string;
  assigned_to: 'alppa' | 'veeti' | 'team';
  due_date: string;
  completed: boolean;
  display_order: number;
}

const todos: Todo[] = [
  // Alppa's Development Tasks - Nov 30
  {
    title: 'Supabase + Vercel production setup',
    description: 'Create golfbooker-prod Supabase project, apply all 30 migrations, configure Vercel with domain golfbooker.fi',
    assigned_to: 'alppa',
    due_date: '2025-11-30',
    completed: false,
    display_order: 0
  },
  {
    title: 'Git branching + Sentry setup',
    description: 'Create develop branch, set up branch protection on main, install @sentry/nextjs, configure error alerts',
    assigned_to: 'alppa',
    due_date: '2025-11-30',
    completed: false,
    display_order: 1
  },
  {
    title: 'CI/CD pipeline + health check',
    description: 'Create .github/workflows/ci.yml with lint, type-check, build. Create /src/app/api/health/route.ts',
    assigned_to: 'alppa',
    due_date: '2025-11-30',
    completed: false,
    display_order: 2
  },

  // Veeti Testing - Nov 30
  {
    title: 'TEST: Sentry error tracking',
    description: 'Trigger a test error in the app, verify it appears in Sentry dashboard with proper stack trace',
    assigned_to: 'veeti',
    due_date: '2025-11-30',
    completed: false,
    display_order: 0
  },

  // Alppa - Dec 1
  {
    title: 'Build complete CSV import system',
    description: 'Create CSVImportService with Papa Parse, build column mapping wizard UI, handle Finnish CSV format (semicolon delimiter, ISO-8859-1)',
    assigned_to: 'alppa',
    due_date: '2025-12-01',
    completed: false,
    display_order: 0
  },

  // Veeti Testing - Dec 1
  {
    title: 'TEST: CSV import wizard',
    description: 'Test CSV import with sample data. Verify column mapping works, validation catches errors, preview shows correct data',
    assigned_to: 'veeti',
    due_date: '2025-12-01',
    completed: false,
    display_order: 0
  },

  // Alppa - Dec 2
  {
    title: 'Lampila Golf venue setup',
    description: 'Create setup script for Lampila Golf venue with resources, pricing, admin accounts. Test booking creation works',
    assigned_to: 'alppa',
    due_date: '2025-12-02',
    completed: false,
    display_order: 0
  },
  {
    title: 'Invoice CSV export feature',
    description: 'Add exportInvoicesCSV() to InvoiceService, add export button to invoices page with Finnish format for Procountor',
    assigned_to: 'alppa',
    due_date: '2025-12-02',
    completed: false,
    display_order: 1
  },

  // Veeti Testing - Dec 2
  {
    title: 'TEST: Booking + Invoice workflow',
    description: 'Create booking → generate invoice → download PDF. Verify viitenumero is correct, PDF looks professional',
    assigned_to: 'veeti',
    due_date: '2025-12-02',
    completed: false,
    display_order: 0
  },

  // Alppa - Dec 3
  {
    title: 'Bank CSV reconciliation',
    description: 'Create BankReconciliationService, build UI to upload bank statement CSV, parse and match by viitenumero, bulk mark as paid',
    assigned_to: 'alppa',
    due_date: '2025-12-03',
    completed: false,
    display_order: 0
  },
  {
    title: 'eBirdie connection UI',
    description: 'Create settings page for eBirdie API credentials, test connection button, add handicap fields to member profile',
    assigned_to: 'alppa',
    due_date: '2025-12-03',
    completed: false,
    display_order: 1
  },

  // Veeti Testing - Dec 3
  {
    title: 'TEST: Bank reconciliation',
    description: 'Upload sample bank CSV, verify payment matching works by viitenumero, test bulk mark as paid',
    assigned_to: 'veeti',
    due_date: '2025-12-03',
    completed: false,
    display_order: 0
  },
  {
    title: 'TEST: eBirdie connection',
    description: 'Test eBirdie connection setup, verify handicap lookup works, check member profile shows handicap',
    assigned_to: 'veeti',
    due_date: '2025-12-03',
    completed: false,
    display_order: 1
  },

  // Alppa - Dec 4
  {
    title: 'Import Lampila Golf members',
    description: 'Get CSV from Lampila Golf, test import on dev database, import to production, verify all members imported correctly',
    assigned_to: 'alppa',
    due_date: '2025-12-04',
    completed: false,
    display_order: 0
  },
  {
    title: 'Bug fixes + polish',
    description: 'Fix all issues reported by Veeti, polish UI based on feedback, run performance check',
    assigned_to: 'alppa',
    due_date: '2025-12-04',
    completed: false,
    display_order: 1
  },

  // Veeti Testing - Dec 4
  {
    title: 'TEST: Full end-to-end',
    description: 'Complete workflow test: login → create member → create booking → generate invoice → match payment → verify all data',
    assigned_to: 'veeti',
    due_date: '2025-12-04',
    completed: false,
    display_order: 0
  },

  // Alppa - Dec 5
  {
    title: 'Staff training + soft launch',
    description: '2-hour training session with Lampila Golf staff. Demo all workflows, create quick-reference PDF guide',
    assigned_to: 'alppa',
    due_date: '2025-12-05',
    completed: false,
    display_order: 0
  },

  // Veeti Testing - Dec 5
  {
    title: 'TEST: Production site',
    description: 'Final QA on golfbooker.fi - test all features on production, verify SSL, check mobile responsiveness',
    assigned_to: 'veeti',
    due_date: '2025-12-05',
    completed: false,
    display_order: 0
  },

  // Launch Day - Dec 6
  {
    title: 'LAUNCH DAY',
    description: 'Go live! Monitor Sentry for errors, respond to client questions, fix any critical issues. Celebrate when stable!',
    assigned_to: 'alppa',
    due_date: '2025-12-06',
    completed: false,
    display_order: 0
  },
  {
    title: 'LAUNCH SUPPORT',
    description: 'Help monitor production, report any issues immediately, assist client with questions',
    assigned_to: 'veeti',
    due_date: '2025-12-06',
    completed: false,
    display_order: 0
  }
];

async function insertTodos() {
  console.log('🚀 Inserting Lampila Golf Launch Sprint todos...\n');

  let inserted = 0;
  let errors = 0;

  for (const todo of todos) {
    const { error } = await supabase
      .from('todos')
      .insert({
        title: todo.title,
        description: todo.description,
        assigned_to: todo.assigned_to,
        due_date: todo.due_date,
        completed: todo.completed,
        display_order: todo.display_order,
      });

    if (error) {
      console.error(`❌ Failed: ${todo.title}`, error.message);
      errors++;
    } else {
      console.log(`✅ Added: ${todo.title} (${todo.assigned_to}, ${todo.due_date})`);
      inserted++;
    }
  }

  console.log(`\n📊 Summary: ${inserted} todos inserted, ${errors} errors`);
  console.log('\n🎯 Open http://localhost:3000/dashboard/todos to see your sprint tasks!');
}

insertTodos().catch(console.error);
