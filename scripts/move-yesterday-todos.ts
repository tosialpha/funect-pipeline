/**
 * Move Yesterday's Todos to Today
 *
 * Run this script to move all incomplete todos from yesterday to today.
 *
 * Usage:
 *   cd /Users/alexandrmalmberg/Desktop/sales-pipeline
 *   npx tsx scripts/move-yesterday-todos.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlydufhzyaegbsbuzlg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHlkdWZoenlhZWdic2J1emxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc2NTAyMCwiZXhwIjoyMDc5MzQxMDIwfQ.BZScT8Zxw5TwwTaSfq500Qw_O9bEwffh3q3CTm_cdWM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function moveYesterdayTodos() {
  // Calculate yesterday and today's dates
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayStr = yesterday.toISOString().split('T')[0]; // 2025-12-22
  const todayStr = today.toISOString().split('T')[0]; // 2025-12-23

  console.log(`📅 Moving incomplete todos from ${yesterdayStr} to ${todayStr}...\n`);

  // First, fetch todos from yesterday
  const { data: yesterdayTodos, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .eq('due_date', yesterdayStr)
    .eq('completed', false);

  if (fetchError) {
    console.error('❌ Error fetching yesterday\'s todos:', fetchError.message);
    return;
  }

  if (!yesterdayTodos || yesterdayTodos.length === 0) {
    console.log('✅ No incomplete todos from yesterday to move.');
    return;
  }

  console.log(`Found ${yesterdayTodos.length} incomplete todo(s) from yesterday:\n`);

  for (const todo of yesterdayTodos) {
    console.log(`  - ${todo.title} (${todo.assigned_to})`);
  }

  console.log('');

  // Update all of them to today
  const { data: updated, error: updateError } = await supabase
    .from('todos')
    .update({ due_date: todayStr })
    .eq('due_date', yesterdayStr)
    .eq('completed', false)
    .select();

  if (updateError) {
    console.error('❌ Error updating todos:', updateError.message);
    return;
  }

  console.log(`✅ Successfully moved ${updated?.length || 0} todo(s) to today (${todayStr})`);
  console.log('\n🎯 Open http://localhost:3000/dashboard/todos to see your updated tasks!');
}

moveYesterdayTodos().catch(console.error);
