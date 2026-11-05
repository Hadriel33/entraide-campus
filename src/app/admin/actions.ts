"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigerSession } from "@/lib/session";
import { estCampus } from "@/lib/auth/validation";

// Vérification côté serveur, en plus de la RLS et des fonctions SQL qui refusent déjà un non-admin.
async function exigerAdmin() {
  const session = await exigerSession();
  if (session.profil.role !== "admin") notFound();
  return session;
}

export async function modererAnnonce(
  id: string,
  statut: "masquee" | "publiee",
) {
  const { supabase } = await exigerAdmin();
  await supabase.from("annonces").update({ statut }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/annonces");
  redirect("/admin?onglet=moderation");
}

export async function supprimerAnnonceAdmin(id: string) {
  const { supabase } = await exigerAdmin();
  await supabase.from("annonces").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/annonces");
  redirect("/admin?onglet=moderation");
}

export async function traiterSignalement(id: string) {
  const { supabase } = await exigerAdmin();
  await supabase.from("signalements").update({ statut: "traite" }).eq("id", id);
  revalidatePath("/admin");
  redirect("/admin?onglet=moderation");
}

export async function changerRole(cible: string, role: "admin" | "etudiant") {
  const { supabase } = await exigerAdmin();
  await supabase.rpc("definir_role", { cible, nouveau_role: role });
  revalidatePath("/admin");
  redirect("/admin?onglet=etudiants");
}

// Corriger le campus d'un étudiant (erreur à l'inscription). La base vérifie aussi que c'est un admin.
export async function changerCampus(cible: string, formData: FormData) {
  const { supabase } = await exigerAdmin();
  const campus = String(formData.get("campus") ?? "");
  if (!estCampus(campus)) redirect("/admin?onglet=etudiants&erreur=campus");
  await supabase.rpc("changer_campus", { cible, nouveau: campus });
  revalidatePath("/admin");
  redirect("/admin?onglet=etudiants");
}

// Décision humaine sur une annonce passée par la modération IA : l'admin a toujours le dernier mot.
export async function validerModeration(id: string) {
  const { supabase } = await exigerAdmin();
  const { data } = await supabase
    .from("annonces")
    .select("statut")
    .eq("id", id)
    .single();
  await supabase
    .from("annonces")
    .update({
      moderation: "ok",
      moderation_raisons: [],
      modere_le: new Date().toISOString(),
      ...(data?.statut === "masquee" ? { statut: "publiee" } : {}),
    })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/annonces");
  redirect("/admin?ok=moderation");
}

// ---------- Classes (liste gérée par les admins, RLS : écriture admin uniquement) ----------

export async function creerClasse(formData: FormData) {
  const { supabase } = await exigerAdmin();
  const campus = String(formData.get("campus") ?? "");
  const nom = String(formData.get("nom") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!estCampus(campus) || nom.length < 2 || nom.length > 60)
    redirect("/admin?onglet=classes&erreur=classe");
  await supabase.from("classes").insert({ ecole: "ESP", campus, nom });
  revalidatePath("/admin");
  redirect("/admin?onglet=classes&ok=classe_creee");
}

export async function supprimerClasse(id: string) {
  const { supabase } = await exigerAdmin();
  await supabase.from("classes").delete().eq("id", id);
  revalidatePath("/admin");
  redirect("/admin?onglet=classes&ok=classe_supprimee");
}

export async function validerClasse(id: string) {
  const { supabase } = await exigerAdmin();
  await supabase.from("classes").update({ validee: true }).eq("id", id);
  revalidatePath("/admin");
  redirect("/admin?onglet=classes&ok=classe_validee");
}

// Diagnostic des IA en prod (admin seulement) : deux vrais appels au modèle et la présence de la clé
// serveur (jamais sa valeur). Sert à vérifier un déploiement, et à le montrer pendant la démo.
export type EtatIA = {
  cleServeur: boolean;
  moderation: { ok: boolean; ms: number; detail: string };
  photo: { ok: boolean; ms: number; detail: string };
  matching: { ok: boolean; ms: number; detail: string };
} | null;

export async function verifierIA(): Promise<EtatIA> {
  await exigerAdmin();
  const { modererAnnonce, matcherAnnonces } = await import("@/lib/ia/modele");
  const { resumerErreur } = await import("@/lib/ia/regles");
  const chrono = async <T>(f: () => Promise<T>) => {
    const t0 = Date.now();
    const r = await f();
    return { r, ms: Date.now() - t0 };
  };
  // L'un après l'autre : deux appels simultanés peuvent toucher la limite de l'offre gratuite.
  const causes: { moderation?: string; photo?: string; matching?: string } = {};
  const m = await chrono(() =>
    modererAnnonce(
      {
        titre: "Cours de maths",
        description: "Appelle-moi au 06 12 34 56 78 pour réserver un cours.",
        lieu: null,
      },
      (e) => (causes.moderation = resumerErreur(e)),
    ),
  );
  // La photo piégée : un texte parfaitement normal, mais un numéro de téléphone écrit sur la photo.
  const hote = (await headers()).get("host");
  const ph = await chrono(() =>
    modererAnnonce(
      {
        titre: "Je prête ma perceuse",
        description: "Perceuse disponible le week-end, pour vos petits travaux de déménagement.",
        lieu: null,
        photoUrl: `${hote?.startsWith("localhost") ? "http" : "https"}://${hote}/ia-test/photo-telephone.png`,
      },
      (e) => (causes.photo = resumerErreur(e)),
    ),
  );
  const p = await chrono(() =>
    matcherAnnonces(
      { competences: ["Power BI"], propose: [], cherche: [] },
      [
        {
          id: "test",
          type: "cherche",
          categorie: "coup_de_main",
          titre: "Suivre les adhérents de l'asso",
          description:
            "On voudrait un tableau de bord clair au lieu de notre Excel.",
        },
      ],
      (e) => (causes.matching = resumerErreur(e)),
    ),
  );
  return {
    cleServeur: !!process.env.SUPABASE_SECRET_KEY,
    moderation: m.r
      ? {
          ok: m.r.statut !== "ok",
          ms: m.ms,
          detail: `verdict « ${m.r.statut} » sur une annonce avec un numéro`,
        }
      : { ok: false, ms: m.ms, detail: `pas de réponse du modèle : ${causes.moderation ?? "cause inconnue"}` },
    photo: ph.r
      ? {
          ok: ph.r.statut !== "ok",
          ms: ph.ms,
          detail: `verdict « ${ph.r.statut} » sur un texte normal avec un numéro écrit sur la photo${ph.r.raisons[0] ? ` : ${ph.r.raisons[0]}` : ""}`,
        }
      : { ok: false, ms: ph.ms, detail: `pas de réponse du modèle : ${causes.photo ?? "cause inconnue"}` },
    matching: p.r
      ? {
          ok: (p.r.get("test")?.pertinence ?? 0) >= 2,
          ms: p.ms,
          detail: `note ${p.r.get("test")?.pertinence ?? 0}/3 : ${p.r.get("test")?.raison || "sans raison"}`,
        }
      : { ok: false, ms: p.ms, detail: `pas de réponse du modèle : ${causes.matching ?? "cause inconnue"}` },
  };
}

// Commentaire ou message de salon signalé : le supprimer (la RLS laisse l'admin le faire), puis classer.
export async function traiterSignalementMessage(id: string, supprimer: boolean) {
  const { supabase } = await exigerAdmin();
  if (supprimer) {
    const { data: s } = await supabase.from("signalements_messages").select("cible_type, cible_id").eq("id", id).maybeSingle();
    if (s) await supabase.from(s.cible_type === "commentaire" ? "commentaires" : "salon_messages").delete().eq("id", s.cible_id);
  }
  await supabase.from("signalements_messages").update({ statut: "traite" }).eq("id", id);
  revalidatePath("/admin");
  redirect("/admin?onglet=moderation&ok=moderation");
}
