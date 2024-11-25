import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lsdbuodcejcfhpqrjelr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZGJ1b2RjZWpjZmhwcXJqZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODUzMDUsImV4cCI6MjA0NzQ2MTMwNX0.bJgeQ-kmOUHM6FplFFaQQtrSuH4K17LRFlsdDAsuB4c";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  }
});

// Export types for better type inference
export type SupabaseClient = typeof supabase;
export type { Database };