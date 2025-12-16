import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const locations = ['England', 'Wales', 'Poland', 'Group'];

async function backfillUserLocations() {
  console.log('🚀 Starting location backfill for users...\n');

  try {
    // Fetch all users without a location
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, location')
      .or('location.is.null,location.eq.');

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('✅ No users found without locations. All users already have locations assigned!');
      return;
    }

    console.log(`📊 Found ${users.length} users without locations\n`);

    let successCount = 0;
    let errorCount = 0;

    // Update each user with a random location
    for (const user of users) {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];

      const { error: updateError } = await supabase
        .from('users')
        .update({ location: randomLocation })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Error updating user ${user.email}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ Updated ${user.first_name || ''} ${user.last_name || ''} (${user.email}): ${randomLocation}`);
        successCount++;
      }
    }

    console.log('\n📈 Backfill Summary:');
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Failed to update: ${errorCount}`);
    console.log(`   📊 Total processed: ${users.length}`);

    // Show distribution
    const { data: distribution } = await supabase
      .from('users')
      .select('location');

    if (distribution) {
      const locationCounts = distribution.reduce((acc, user) => {
        const loc = user.location || 'No Location';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Location Distribution:');
      Object.entries(locationCounts).forEach(([location, count]) => {
        console.log(`   ${location}: ${count} users`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

backfillUserLocations();
