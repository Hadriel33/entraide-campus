// Modèle : Server Action + formulaire avec useActionState (tiré de src/app/(auth)/actions.ts).
// 1) valider avec une fonction testée, 2) identité via getUser() côté serveur, 3) écrire sous RLS.
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Etat = { erreurs?: Partial<Record<string, string>>; message?: string; valeurs?: Record<string, string> };

export async function creerQuelqueChose(_: Etat, formData: FormData): Promise<Etat> {
  const titre = String(formData.get("titre") ?? "").trim();
  if (!titre) return { erreurs: { titre: "Titre obligatoire." }, valeurs: { titre } };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // jamais un userId venu du formulaire
  if (!user) redirect("/connexion");

  const { error } = await supabase.from("<table>").insert({ titre }); // auteur_id = auth.uid() par défaut
  if (error) return { message: "Une erreur est survenue. Réessaie.", valeurs: { titre } };

  redirect("/<page>");
}

// Côté client :
// "use client";
// const [etat, action, enCours] = useActionState<Etat, FormData>(creerQuelqueChose, {});
// <form action={action}> <Champ name="titre" erreur={etat.erreurs?.titre} /> <Bouton disabled={enCours}>...</Bouton> </form>
