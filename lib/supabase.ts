import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_PUBLISHABLE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

// Realtime chat silently breaks on an empty-URL client — this is the one
// loud warning that would have saved the EAS-build debugging session.
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE) {
  console.warn(
    '[FYM] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing — realtime chat will not work. See frontend/.env.example.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
