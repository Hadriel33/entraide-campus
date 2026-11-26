import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { Bouton } from "@/components/ui/bouton";
import { BadgeCampus } from "@/components/ui/badge";
import { Section, Sommaire } from "@/components/ui/section";
import { TitrePage } from "@/components/ui/titre-page";
import { BoutonTheme } from "@/components/app/theme";
import { ZoneSensible } from "../compte/zone-sensible";
import { basculerFil } from "../compte/actions";
import { BoiteSuggestions } from "@/components/reglages/boite-suggestions";
import { CATEGORIES_SUGGESTION, type CategorieSuggestion } from "@/lib/suggestions/validation";
import { jourCampus } from "@/lib/temps";

export const metadata: Metadata = { title: "Réglages" };

// Les réglages : tout ce qui n'est pas « qui je suis » (ça, c'est Mon profil).
export default async function PageReglages() {
  const { supabase, user, profil } = await exigerSession();
  // Mes suggestions déjà envoyées et leur suite (la RLS ne renvoie que les miennes).
  const { data: mesSuggestions } = await supabase
    .from("suggestions")
    .select("id, categorie, texte, statut, cree_le")
    .eq("auteur_id", user.id)
    .order("cree_le", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TitrePage
        accroche={
          <span className="flex flex-wrap items-center gap-2">
            {user.email} <BadgeCampus campus={profil.campus} />
          </span>
        }
      >
        Réglages
      </TitrePage>
      <Sommaire
        liens={[
          { href: "#fil", label: "Confidentialité" },
          { href: "#apparence", label: "Apparence" },
          { href: "#suggestions", label: "Suggestions" },
          { href: "#compte", label: "Compte" },
        ]}
      />

      <p className="rounded-carte border border-ligne bg-surface px-5 py-4 text-sm">
        Tes coordonnées sont maintenant dans{" "}
        <Link href="/compte#coordonnees" className="font-semibold underline decoration-2 underline-offset-4 hover:decoration-bandeau">
          Mon profil, étape 3
        </Link>
        .
      </p>

      <Section id="fil" titre="Apparaître dans le fil" aide="Le fil montre « @lea a aidé @tom ». Une entraide n'y apparaît que si les deux personnes ont dit oui. Jamais de message ni de coordonnées.">
        <form action={basculerFil} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="fil" value={profil.fil_public ? "non" : "oui"} />
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${profil.fil_public ? "bg-ok-fond text-ok" : "bg-papier-fonce text-encre-douce"}`}>
            {profil.fil_public ? "Tu apparais dans le fil" : "Tu n'apparais pas dans le fil"}
          </span>
          <Bouton variante="contour">{profil.fil_public ? "Ne plus apparaître" : "Apparaître dans le fil"}</Bouton>
        </form>
      </Section>

      <Section id="apparence" titre="Apparence" aide="Le tableau noir : l'appli passe en sombre, pratique le soir. Le réglage reste sur cet appareil.">
        <BoutonTheme className="self-start border border-ligne-forte px-3 py-2 font-semibold" />
      </Section>

      <Section
        id="suggestions"
        titre="Boîte à suggestions"
        aide="Une idée, un bug, un truc qui manque ? Ça arrive directement à l'équipe, et tu vois ici ce qu'on en fait."
      >
        <BoiteSuggestions />
        {mesSuggestions && mesSuggestions.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-ligne pt-4">
            <h3 className="text-sm font-semibold">Tes dernières suggestions</h3>
            <ul className="flex flex-col gap-2">
              {mesSuggestions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.statut === "faite" ? "bg-ok-fond text-ok" : s.statut === "lue" ? "bg-papier-fonce" : "border border-ligne-forte"}`}
                  >
                    {s.statut === "faite" ? "C'est fait ✓" : s.statut === "lue" ? "Lue par l'équipe" : "Envoyée"}
                  </span>
                  <span className="text-encre-douce">
                    {CATEGORIES_SUGGESTION[s.categorie as CategorieSuggestion]} · {jourCampus(s.cree_le)}
                  </span>
                  <span className="w-full truncate">{s.texte}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="compte" titre="Mon compte" aide={`Ton campus : ${profil.campus}. Seul un admin peut le changer (c'est lui qui compte au championnat).`}>
        <Link href="/compte/mot-de-passe" className="self-start text-sm font-semibold underline-offset-2 hover:underline">
          Changer mon mot de passe
        </Link>
        <div className="flex flex-col gap-2 border-t border-ligne pt-4">
          <h3 className="font-semibold">Supprimer mon compte</h3>
          <p className="text-sm text-encre-douce">Ton droit à l&apos;effacement (RGPD). Voir aussi la page Confidentialité.</p>
          <ZoneSensible />
        </div>
      </Section>
    </div>
  );
}
