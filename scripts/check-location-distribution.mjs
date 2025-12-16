import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDistribution() {
  const { data: users } = await supabase
    .from('users')
    .select('location');

  if (users) {
    const locationCounts = users.reduce((acc, user) => {
      const loc = user.location || 'No Location';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Location Distribution:');
    console.log('='.repeat(40));
    Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([location, count]) => {
        const percentage = ((count / users.length) * 100).toFixed(1);
        console.log(`${location.padEnd(15)} ${String(count).padStart(4)} users (${percentage}%)`);
      });
    console.log('='.repeat(40));
    console.log(`Total:          ${String(users.length).padStart(4)} users`);
  }
}

checkDistribution();
