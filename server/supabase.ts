import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

/**
 * Server-side admin client — uses service role key, bypasses RLS.
 * Use for all server-side tRPC procedures.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Public anon client — respects RLS.
 * Use for client-side Realtime subscriptions only.
 */
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Tenant ID for Serenity Aesthetics demo — used as fallback when user has no tenantId.
 */
export const DEMO_TENANT_ID = "aaaaaaaa-0001-0001-0001-000000000001";
