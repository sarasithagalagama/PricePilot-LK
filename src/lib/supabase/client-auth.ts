import { createBrowserClient } from "@supabase/ssr";

function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function createBrowserSupabaseAuthClient() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error("Supabase auth environment variables are missing.");
  }

  return createBrowserClient(url, anonKey);
}
