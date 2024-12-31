// src/app/supabaseClient.ts

import { createClient } from "@supabase/supabase-js"

// If you store these in .env.local as, e.g.:
// NEXT_PUBLIC_SUPABASE_URL=...
// NEXT_PUBLIC_SUPABASE_ANON_KEY=...
// you can reference them with process.env.<VARIABLE>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create and export your Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
