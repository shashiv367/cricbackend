const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

console.log('\n🔵 [BACKEND] ========== SUPABASE CLIENT INIT ==========');
console.log('🔵 [BACKEND] Supabase URL:', config.supabase.url ? `${config.supabase.url.substring(0, 30)}...` : 'MISSING');
console.log('🔵 [BACKEND] Service Role Key:', config.supabase.serviceRoleKey ? `${config.supabase.serviceRoleKey.substring(0, 20)}...` : 'MISSING');

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  // In production you probably want to fail fast if Supabase is not configured.
  // For local development you can relax this if needed.
  console.warn(
    '❌ [BACKEND] Supabase URL or service role key is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.',
  );
} else {
  console.log('✅ [BACKEND] Supabase configuration found');
}

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('✅ [BACKEND] Supabase client created');
console.log('🔵 [BACKEND] ========================================\n');

module.exports = supabase;


