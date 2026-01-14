// Central place for configuration (ports, Supabase keys, etc.)
// You can load environment variables from a .env file in the backend root.
//
// Example .env (do NOT commit real secrets):
//   PORT=4000
//   SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
//   SUPABASE_ANON_KEY=...
//   SUPABASE_JWT_SECRET=...

require('dotenv').config();

console.log('\n🔵 [BACKEND] ========== CONFIG LOADING ==========');
console.log('🔵 [BACKEND] NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔵 [BACKEND] PORT:', process.env.PORT || 4000);
console.log('🔵 [BACKEND] SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
console.log('🔵 [BACKEND] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
console.log('🔵 [BACKEND] SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('🔵 [BACKEND] ========================================\n');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  },
};

module.exports = config;


