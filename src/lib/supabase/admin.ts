/**
 * Supabase Admin Client
 *
 * Server-side client using service role key for API routes and webhooks.
 * This client bypasses Row Level Security (RLS) - use only in trusted server contexts.
 */
import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Supabase client with service role key.
 * Use this for server-side operations that need to bypass RLS.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
