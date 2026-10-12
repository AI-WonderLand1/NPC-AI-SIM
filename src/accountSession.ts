import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
export async function accountClient(): Promise<SupabaseClient> {
  if (client) return client;
  const response = await fetch('/api/account/config');
  const config = await response.json();
  if (!response.ok || !config.url || !config.publishableKey) throw new Error('Account sign-in is not configured for this deployment.');
  client = createClient(config.url, config.publishableKey);
  return client;
}
