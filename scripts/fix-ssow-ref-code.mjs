import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://igzucjhzvghlhpqmgolb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnenVjamh6dmdobGhwcW1nb2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjE5MzEsImV4cCI6MjA0NjM5NzkzMX0.HWf0nzU_N7rhOIXWfQd1U0xhIZYC7SqVsUIc_aWVhgw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Fixing SSOW ref_code to be 2 characters (SW)...');

const { data, error } = await supabase
  .from('document_types')
  .update({ ref_code: 'SW' })
  .eq('name', 'SSOW')
  .select();

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ Updated:', data);
}

console.log('\n🎉 Done! Refresh your page and try again.');
