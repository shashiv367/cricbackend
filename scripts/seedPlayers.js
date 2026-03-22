/**
 * Seeds demo player accounts (auth.users + profiles) with random 10-digit mobiles.
 *
 * Requires in cricbackend/.env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional: SEED_PLAYER_PASSWORD (default: SeedPlayer123!)
 *
 * Run: npm run seed:players
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seedPassword = process.env.SEED_PLAYER_PASSWORD || 'SeedPlayer123!';

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function randomMobile() {
  const firstDigit = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
  let n = firstDigit;
  for (let i = 0; i < 9; i += 1) {
    n = n * 10 + Math.floor(Math.random() * 10);
  }
  return String(n);
}

const DEMO_PLAYERS = [
  { fullName: 'Arjun Mehta' },
  { fullName: 'Rohan Kapoor' },
  { fullName: 'Vikram Singh' },
  { fullName: 'Karan Desai' },
  { fullName: 'Neel Shah' },
  { fullName: 'Aditya Rao' },
  { fullName: 'Ishaan Iyer' },
  { fullName: 'Dev Malhotra' },
];

async function seedOne({ fullName }) {
  const phone = randomMobile();
  const email = `seed.player.${phone}@seed.cricapp.local`;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: seedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'player',
    },
  });

  if (authError) {
    console.error(`[skip] ${fullName}:`, authError.message);
    return;
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: authData.user.id,
      full_name: fullName,
      username: email,
      role: 'player',
      phone,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    console.error(`[rollback] ${fullName}:`, profileError.message);
    await supabase.auth.admin.deleteUser(authData.user.id);
    return;
  }

  console.log(`OK  ${fullName}  phone=${phone}  email=${email}`);
}

async function main() {
  console.log('Seeding', DEMO_PLAYERS.length, 'players...');
  for (const p of DEMO_PLAYERS) {
    await seedOne(p);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
