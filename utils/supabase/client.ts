import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

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
  return createBrowserClient<Database>(config.supabaseUrl, config.supabasePublishableKey);
}
