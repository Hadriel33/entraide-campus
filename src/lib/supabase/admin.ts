import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client « serveur » avec la clé secrète (rôle service_role) : sert UNIQUEMENT à écrire le résultat
// de la modération IA, que les utilisateurs n'ont pas le droit d'écrire eux-mêmes.
// Jamais importé côté client (server-only), jamais préfixé NEXT_PUBLIC_.
// Sans la variable SUPABASE_SECRET_KEY, renvoie null : les annonces restent « en attente » d'un humain.
export function clientServeur() {
  const cle = process.env.SUPABASE_SECRET_KEY;
  if (!cle) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
