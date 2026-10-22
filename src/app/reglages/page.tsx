import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { Bouton } from "@/components/ui/bouton";
import { BadgeCampus } from "@/components/ui/badge";
import { Section, Sommaire } from "@/components/ui/section";
import { TitrePage } from "@/components/ui/titre-page";
import { BoutonTheme } from "@/components/app/theme";
import { FormulaireCoordonnees } from "../compte/formulaires";
import { ZoneSensible } from "../compte/zone-sensible";
import { basculerFil } from "../compte/actions";

export const metadata: Metadata = { title: "Réglages" };

// Les réglages : tout ce qui n'est pas « qui je suis » (ça, c'est Mon profil).
export default async function PageReglages() {
  const { supabase, user, profil } = await exigerSession();
  const { data: coordonnees } = await supabase.from("coordonnees").select("telephone, email, reseau").eq("id", user.id).single();

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
          { href: "#coordonnees", label: "Coordonnées" },
          { href: "#fil", label: "Confidentialité" },
          { href: "#apparence", label: "Apparence" },
          { href: "#compte", label: "Compte" },
        ]}
      />

      <Section
        id="coordonnees"
        titre="Mes coordonnées"
        aide="Cachées par défaut. Seules les personnes dont tu acceptes la demande (ou qui acceptent la tienne) peuvent les voir."
      >
        <FormulaireCoordonnees telephone={coordonnees?.telephone ?? ""} email={coordonnees?.email ?? ""} reseau={coordonnees?.reseau ?? ""} />
      </Section>

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
