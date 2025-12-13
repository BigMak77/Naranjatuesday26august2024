import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function count() {
  const { count } = await supabase
    .from('user_assignments')
    .select('*', { count: 'exact', head: true });

  console.log('Total user_assignments rows:', count);

  // Check default query limit
  const { data } = await supabase
    .from('user_assignments')
    .select('id');

  console.log('Rows returned without .range() or .limit():', data?.length);
}

count();
