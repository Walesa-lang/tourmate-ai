import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function getSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { supabaseUrl, supabasePublishableKey };
}

export function createClient() {
  const config = getSupabaseConfig();
  return createBrowserClient(config.supabaseUrl, config.supabasePublishableKey);
}
