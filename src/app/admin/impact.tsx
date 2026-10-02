import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES, type Categorie } from "@/lib/annonces/validation";
import { teinte } from "@/lib/design/teintes";
import { Colette } from "@/components/colette/colette";

type Impact = {
  entonnoir: {
    inscrits: number;
    ont_publie: number;
    ont_demande: number;
    en_relation: number;
    ont_note: number;
  };
  demandes: {
    total: number;
    acceptees: number;
    refusees: number;
    en_attente: number;
    delai_median_heures: number | null;
  };
  croisement: { entraides: number; esd_esp: number };
  ecoles: Record<string, number>;
  categories: {
    categorie: Categorie;
    offres: number;
    demandes: number;
    entraides: number;
  }[];
  activite: {
    jour: string;
    inscriptions: number;
    annonces: number;
    entraides: number;
  }[];
  moderation: {
    ok: number;
    a_verifier: number;
    refus_probable: number;
    en_attente: number;
    corrections_proposees: number;
  };
};

function pct(n: number, sur: number) {
  return sur > 0 ? Math.round((n / sur) * 100) : 0;
}

function delai(h: number | null) {
  if (h === null) return "pas encore";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} j`;
}

// Une série de 30 barres (une par jour), avec le total et le jour le plus actif en clair.
function Serie({
  titre,
  valeurs,
  jours,
  couleur,
}: {
  titre: string;
  valeurs: number[];
  jours: string[];
  couleur: string;
}) {
  const max = Math.max(1, ...valeurs);
  const total = valeurs.reduce((s, v) => s + v, 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{titre}</span>
        <span className="text-encre-douce">{total} sur 30 jours</span>
      </div>
      <div
        className="flex h-16 items-end gap-[3px]"
        role="img"
        aria-label={`${titre} : ${total} sur 30 jours`}
      >
        {valeurs.map((v, i) => (
          <span
            key={jours[i]}
            title={`${new Date(jours[i]).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} : ${v}`}
            className={`flex-1 rounded-t-[2px] ${v ? couleur : "bg-ligne"}`}
            style={{ height: `${v ? Math.max(8, (v / max) * 100) : 4}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Le tableau de bord d'impact : ce que l'appli change vraiment sur le campus (agrégats seulement, admin uniquement).
export async function TableauImpact({
  supabase,
}: {
  supabase: SupabaseClient;
}) {
  const { data, error } = await supabase.rpc("stats_impact");
  if (error || !data)
    return (
      <p className="text-sm text-alerte">
        Tableau indisponible pour le moment.
      </p>
    );
  const s = data as Impact;
  const e = s.entonnoir;
  const etapes = [
    { label: "Inscrits", n: e.inscrits },
    { label: "Ont publié une annonce", n: e.ont_publie },
    { label: "Ont demandé un contact", n: e.ont_demande },
    { label: "Ont été mis en relation", n: e.en_relation },
    { label: "Ont laissé un avis", n: e.ont_note },
  ];
  const maxCat = Math.max(
    1,
    ...s.categories.map((c) => Math.max(c.offres, c.demandes)),
  );
  const repondues = s.demandes.acceptees + s.demandes.refusees;
  const jours = s.activite.map((a) => a.jour);

  return (
    <div className="flex flex-col gap-10">
      <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          {
            valeur: e.inscrits,
            label: `inscrits (ESD ${s.ecoles.ESD ?? 0}, ESP ${s.ecoles.ESP ?? 0})`,
            teinte: "teinte-bandeau",
          },
          {
            valeur: s.croisement.entraides,
            label: "entraides réalisées",
            teinte: "teinte-lilas",
          },
          {
            valeur: `${pct(s.croisement.esd_esp, s.croisement.entraides)} %`,
            label: "des entraides entre ESD et ESP",
            teinte: "teinte-ciel",
          },
          {
            valeur: delai(s.demandes.delai_median_heures),
            label: "délai médian pour répondre à une demande",
            teinte: "teinte-ocre",
          },
        ].map((c) => (
          <div
            key={c.label}
            className={`couche-fixe ${c.teinte} flex flex-col-reverse gap-1 rounded-carte border border-ligne bg-surface p-5`}
          >
            <dt className="text-sm text-encre-douce">{c.label}</dt>
            <dd className="titre-charte text-5xl">{c.valeur}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-4" aria-labelledby="entonnoir">
          <h2 id="entonnoir" className="titre-charte text-section">
            L&apos;entonnoir de l&apos;entraide
          </h2>
          <ol className="flex flex-col gap-2.5">
            {etapes.map((et, i) => (
              <li key={et.label} className="flex flex-col gap-1">
                <span className="flex justify-between text-sm">
                  <span className="font-semibold">{et.label}</span>
                  <span className="text-encre-douce">
                    {et.n} {i > 0 && `(${pct(et.n, e.inscrits)} %)`}
                  </span>
                </span>
                <span className="block h-7 overflow-hidden rounded-ui bg-papier-fonce">
                  <span
                    className="block h-full rounded-ui bg-bandeau"
                    style={{ width: `${Math.max(2, pct(et.n, e.inscrits))}%` }}
                  />
                </span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-encre-douce">
            Demandes : {s.demandes.acceptees} acceptées, {s.demandes.refusees}{" "}
            refusées, {s.demandes.en_attente} en attente
            {repondues > 0 &&
              ` (${pct(s.demandes.acceptees, repondues)} % d'acceptation)`}
            .
          </p>
        </section>

        <section
          className="flex flex-col gap-4"
          aria-labelledby="offre-demande"
        >
          <h2 id="offre-demande" className="titre-charte text-section">
            Offre et demande par catégorie
          </h2>
          <p className="flex gap-4 text-xs text-encre-douce">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-[2px] bg-encre" aria-hidden /> je
              propose
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-[2px] border-2 border-encre"
                aria-hidden
              />{" "}
              je cherche
            </span>
          </p>
          {s.categories.length === 0 && (
            <p className="text-sm text-encre-douce">Aucune annonce en cours.</p>
          )}
          <ul className="flex flex-col gap-3">
            {s.categories.map((c) => (
              <li
                key={c.categorie}
                className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-3 text-sm"
              >
                <span className="flex items-center gap-1.5 truncate font-semibold">
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${teinte(c.categorie).point}`}
                    aria-hidden
                  />
                  {CATEGORIES[c.categorie]}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span
                      className="block h-3 rounded-[2px] bg-encre"
                      style={{ width: `${(c.offres / maxCat) * 85}%` }}
                    />
                    <span className="text-xs">{c.offres}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className="block h-3 rounded-[2px] border-2 border-encre"
                      style={{ width: `${(c.demandes / maxCat) * 85}%` }}
                    />
                    <span className="text-xs">{c.demandes}</span>
                    {c.demandes > c.offres && (
                      <span className="-rotate-2 font-main text-sm text-alerte">
                        il manque des gens
                      </span>
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="activite">
        <h2 id="activite" className="titre-charte text-section">
          Les 30 derniers jours
        </h2>
        <div className="grid gap-6 rounded-carte border border-ligne bg-surface p-5 md:grid-cols-3">
          <Serie
            titre="Inscriptions"
            valeurs={s.activite.map((a) => a.inscriptions)}
            jours={jours}
            couleur="bg-ciel"
          />
          <Serie
            titre="Annonces publiées"
            valeurs={s.activite.map((a) => a.annonces)}
            jours={jours}
            couleur="bg-lilas"
          />
          <Serie
            titre="Entraides"
            valeurs={s.activite.map((a) => a.entraides)}
            jours={jours}
            couleur="bg-ocre"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="ia">
        <h2 id="ia" className="flex items-center gap-3">
          <span className="titre-charte text-section">La modération IA</span>
          <Colette anim="tampon" taille={56} />
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "validées", n: s.moderation.ok },
            { label: "à vérifier", n: s.moderation.a_verifier },
            { label: "refus probable", n: s.moderation.refus_probable },
            { label: "en attente de l'IA", n: s.moderation.en_attente },
            {
              label: "corrections proposées",
              n: s.moderation.corrections_proposees,
            },
          ].map((m) => (
            <div
              key={m.label}
              className="flex flex-col-reverse rounded-ui border border-ligne bg-surface p-3"
            >
              <dt className="text-xs text-encre-douce">{m.label}</dt>
              <dd className="titre-charte text-3xl">{m.n}</dd>
            </div>
          ))}
        </dl>
        {s.moderation.en_attente > 0 &&
          s.moderation.ok +
            s.moderation.a_verifier +
            s.moderation.refus_probable ===
            0 && (
            <p className="rounded-ui bg-postit-jaune px-3 py-2 text-sm">
              Toutes les annonces sont « en attente » : l&apos;IA ne peut pas
              écrire son verdict. Vérifie que <code>SUPABASE_SECRET_KEY</code>{" "}
              est bien dans les variables Vercel.
            </p>
          )}
      </section>
    </div>
  );
}
