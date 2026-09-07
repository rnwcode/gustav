import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS, the only way to write skill/activity
 * content (no write policy for anon/authenticated, CLAUDE.md rule 5/10).
 * `server-only` guarantees this file can never end up in a client bundle,
 * so the key never leaves the machine this tool runs on.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — copy .env.local.example to .env.local and fill it in.`);
  }
  return value;
}

export const supabaseAdmin = createClient(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } },
);
