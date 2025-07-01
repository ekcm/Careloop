import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log('ENV:', process.env.NEXT_PUBLIC_SUPABASE_URL);
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are not set. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)