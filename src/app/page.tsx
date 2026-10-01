import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BoutonLien } from "@/components/ui/bouton";
import { Badge } from "@/components/ui/badge";
import { TitrePage } from "@/components/ui/titre-page";

type Impact = { etudiants: number; annonces_actives: number; entraides: number; croisements: number };

export default async function Home() {
  const { supabase, user } = await getSession();
  // Connecté : on va directement aux annonces.
  if (user) redirect("/annonces");
  // Compteur d'impact : agrégats publics uniquement (fonction stats_publiques, aucune donnée personnelle).
  const { data } = await supabase.rpc("stats_publiques");
  const impact = data as Impact | null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 py-16">
      {/* Affiche à la manière de la charte ESP : un verbe par bandeau, couches décalées. Décoratif. */}
      <div className="flex flex-col items-start gap-1.5" aria-hidden>
        {[
          { mot: "Propose", fond: "bg-bandeau", couche: "teinte-lilas", decale: "" },
          { mot: "Cherche", fond: "bg-lilas", couche: "teinte-ciel", decale: "sm:ml-10" },
          { mot: "Entraide-toi", fond: "bg-ciel", couche: "teinte-ocre", decale: "sm:ml-20" },
        ].map((b, i) => (
          <span
            key={b.mot}
            className={`apparition couche-fixe titre-charte px-3 pt-1 text-5xl sm:text-7xl ${b.fond} ${b.couche} ${b.decale}`}
            style={{ "--i": i * 2 } as React.CSSProperties}
          >
            {b.mot}
          </span>
        ))}
      </div>
      <TitrePage accroche="Propose ce que tu sais faire, trouve ce dont tu as besoin. Entre étudiants de l'ESD et de l'ESP Bordeaux.">
        L&apos;entraide du campus
      </TitrePage>
      <div className="flex flex-wrap gap-2">
        <Badge variante="offre">Je propose : photo, vidéo, design, dev, data</Badge>
        <Badge variante="besoin">Je cherche : coloc, covoiturage, coup de main</Badge>
      </div>

      {/* Affiché seulement quand il y a de quoi montrer : une rangée de zéros ferait fuir les premiers visiteurs. */}
      {impact && impact.etudiants >= 5 && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="L'entraide en chiffres">
          {[
            { valeur: impact.etudiants, label: "étudiants inscrits" },
            { valeur: impact.annonces_actives, label: "annonces en cours" },
            { valeur: impact.entraides, label: "entraides réalisées" },
            { valeur: impact.croisements, label: "entre ESD et ESP" },
          ].map((c, i) => (
            <div
              key={c.label}
              className={`apparition couche-fixe rounded-carte border border-ligne bg-surface p-4 ${["teinte-bandeau", "teinte-lilas", "teinte-ciel", "teinte-ocre"][i]}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <dd className="titre-charte text-4xl">{c.valeur}</dd>
              <dt className="text-sm text-encre-douce">{c.label}</dt>
            </div>
          ))}
        </dl>
      )}

      <p className="max-w-xl text-encre-douce">
        Réservé aux emails de l&apos;école. Tes coordonnées restent cachées : elles ne s&apos;échangent qu&apos;après ton accord,
        et une discussion s&apos;ouvre alors entre vous.
      </p>
      <div className="flex flex-wrap gap-3">
        <BoutonLien href="/inscription">Créer mon compte</BoutonLien>
        <BoutonLien href="/connexion" variante="contour">
          Se connecter
        </BoutonLien>
      </div>
    </section>
  );
}
