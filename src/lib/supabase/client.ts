import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Klien Supabase eksternal (browser-safe, publishable key).
 * Sprint 0: hanya koneksi — belum ada schema maupun authentication.
 */
export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
