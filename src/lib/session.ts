import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfilSession = {
  id: string;
  prenom: string;
  pseudo: string;
  ecole: string;
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

// Utilisateur et profil courants, lus une seule fois par requête (cache React).
// L'identité vient toujours de supabase.auth.getUser(), jamais d'un paramètre.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profil: null };
  const { data: profil } = await supabase
    .from("profils")
    .select("id, prenom, pseudo, ecole, avatar_chemin, bio, competences, role, classe_id, colette_couleur, colette_humeur, colette_accessoire, colette_motif, fil_public")
    .eq("id", user.id)
    .single<ProfilSession>();
  return { supabase, user, profil };
});

export async function exigerSession() {
  const session = await getSession();
  if (!session.user || !session.profil) redirect("/connexion");
  return session as { supabase: typeof session.supabase; user: NonNullable<typeof session.user>; profil: ProfilSession };
}
