import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfilSession = {
  id: string;
  prenom: string;
  pseudo: string;
  ecole: string;
  campus: string;
  avatar_chemin: string | null;
  bio: string | null;
  competences: string[];
  role: "etudiant" | "admin";
  classe_id: string | null;
  colette_couleur: string;
  colette_humeur: string;
  colette_accessoire: string;
  colette_motif: string;
  fil_public: boolean;
};

export type UtilisateurSession = { id: string; email: string | null };

// Utilisateur et profil courants, lus une seule fois par requête (cache React).
// L'identité vient du jeton vérifié par getClaims (signature ES256 vérifiée localement, expiration comprise),
// jamais d'un paramètre. Avant : getUser, un aller-retour au serveur d'authentification sur chaque page.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user: UtilisateurSession | null = data?.claims
    ? { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null }
    : null;
  if (!user) return { supabase, user: null, profil: null };
  const { data: profil } = await supabase
    .from("profils")
    .select("id, prenom, pseudo, ecole, campus, avatar_chemin, bio, competences, role, classe_id, colette_couleur, colette_humeur, colette_accessoire, colette_motif, fil_public")
    .eq("id", user.id)
    .single<ProfilSession>();
  return { supabase, user, profil };
});

export async function exigerSession() {
  const session = await getSession();
  if (!session.user || !session.profil) redirect("/connexion");
  return session as { supabase: typeof session.supabase; user: NonNullable<typeof session.user>; profil: ProfilSession };
}
