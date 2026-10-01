import { createBrowserClient } from "@supabase/ssr";

// Client Supabase côté navigateur : clé publishable uniquement, la session vient des cookies.
// Toutes ses lectures et écritures passent par la RLS, comme un utilisateur.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
