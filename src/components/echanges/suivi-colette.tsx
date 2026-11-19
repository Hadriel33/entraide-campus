import { Colette } from "@/components/colette/colette";
import { BoutonEtape } from "./bouton-etape";
import { avancerEntraide, confirmerEntraide } from "@/app/demandes/actions";
import { ETAPES, MOT_MAX, RECU, etapesSuivantes, peutConfirmer, rang, type Etape } from "@/lib/echanges/suivi";

// Le suivi façon colis : une ligne à 4 arrêts, Colette livreuse marche jusqu'à l'étape en cours avec la tenue
// de l'étape, et le petit mot de celui qui aide s'affiche dans sa bulle. Celui qui aide avance ; l'autre
// confirme « Bien reçu ». Les règles sont en base (0034) : ce composant ne fait que les montrer.
export function SuiviColette({
  demandeId,
  etape,
  mot,
  aide,
  prenomAutre,
  retour,
  compact = false,
  lienAvis,
  avisDonne = false,
}: {
  demandeId: string;
  etape: Etape | null;
  mot: string | null;
  /** Suis-je celui qui aide (celui qui avance le suivi) ? */
  aide: boolean;
  prenomAutre: string;
  retour: "liste" | "discussion";
  /** Dans la liste « Mes échanges » : la ligne et le bouton principal seulement. */
  compact?: boolean;
  /** Une fois terminé : où laisser son avis (la discussion renvoie vers la carte de « Mes échanges »). */
  lienAvis?: string;
  avisDonne?: boolean;
}) {
  const r = rang(etape);
  const fini = etape === "recu";
  const courante = fini ? null : r >= 0 ? ETAPES[r] : null;
  const look = fini ? RECU.colette : (courante?.colette ?? { anim: "dort" as const, humeur: "dort" as const, accessoire: "aucun" as const });
  // Position de Colette sur la ligne : au départ, puis sur chaque arrêt (le dernier = livré ou reçu).
  const position = fini ? 100 : r < 0 ? 0 : (r / (ETAPES.length - 1)) * 100;
  // D'où elle part en marchant : l'étape d'avant (on la voit avancer à chaque ouverture et à chaque clic).
  const depart = fini || r <= 0 ? position : ((r - 1) / (ETAPES.length - 1)) * 100;
  const trajet = { "--depart": `${depart}%`, "--arrivee": `${position}%` } as React.CSSProperties;
  const bulle = mot ?? (fini ? RECU.phrase : courante?.phrase ?? (aide ? `Dis à ${prenomAutre} où tu en es.` : `${prenomAutre} te tiendra au courant ici.`));
  const suivantes = aide ? etapesSuivantes(etape) : [];

  return (
    <section aria-label="Suivi de l'entraide" className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface/80 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="titre-charte text-base">Suivi de l&apos;entraide</h3>
        <span className="text-xs font-semibold text-encre-douce">
          {fini ? "Terminé" : courante ? courante.label : "Pas encore commencé"}
        </span>
      </div>

      {/* La ligne : Colette au-dessus de l'arrêt en cours, sa bulle à côté. */}
      <div className={`relative mx-4 ${compact ? "mt-14" : "mt-20"} mb-7`}>
        <div className="h-1 rounded-full bg-papier-fonce" aria-hidden>
          <div key={`barre-${etape}`} className="barre-remplit h-1 rounded-full bg-encre" style={{ width: `${position}%`, ...trajet }} />
        </div>
        <ol className="absolute inset-x-0 -top-1.5 flex justify-between" aria-label="Étapes">
          {ETAPES.map((e, i) => (
            <li key={e.code} className="relative flex flex-col items-center" aria-current={courante?.code === e.code ? "step" : undefined}>
              <span className={`size-4 rounded-full border-2 border-encre ${i <= r || fini ? "bg-bandeau" : "bg-surface"}`} aria-hidden />
              <span className={`absolute top-5 text-[11px] leading-tight font-semibold whitespace-nowrap ${i <= r || fini ? "text-encre" : "text-encre-douce"} ${i === 0 ? "left-0" : i === ETAPES.length - 1 ? "right-0" : "-translate-x-1/2 left-1/2"}`}>
                {e.label}
              </span>
            </li>
          ))}
        </ol>
        <div
          key={`colette-${etape}`}
          className={`absolute bottom-2 flex -translate-x-1/2 items-end ${depart !== position ? "colette-marche" : ""}`}
          style={{ left: `${position}%`, ...trajet }}
        >
          <Colette {...look} saison={false} taille={compact ? 52 : 72} titre={`Colette livreuse : ${fini ? RECU.label : (courante?.label ?? "au départ")}`} />
        </div>
      </div>
      <p className={`pop self-center rounded-carte border border-encre bg-bandeau px-3 py-1.5 text-center font-main text-lg leading-snug ${compact ? "line-clamp-2" : ""}`} key={`${etape}-${mot}`}>
        {mot ? `« ${bulle} »` : bulle}
      </p>

      {/* Celui qui aide : avancer d'une étape (ou garder l'étape pour changer son mot). */}
      {suivantes.length > 0 && (
        <form action={avancerEntraide.bind(null, demandeId)} className="flex flex-col gap-2">
          <input type="hidden" name="retour" value={retour} />
          {!compact && (
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Un petit mot pour {prenomAutre} (facultatif)
              <input
                name="mot"
                maxLength={MOT_MAX}
                defaultValue={mot ?? ""}
                placeholder="Ex. : je monte la vidéo, je t'envoie un aperçu jeudi"
                className="min-h-10 rounded-ui border border-ligne-forte bg-surface px-3 text-base font-normal outline-none focus:border-encre"
              />
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            {suivantes.map((code) => {
              const e = ETAPES.find((x) => x.code === code)!;
              const memeEtape = code === etape;
              return (
                <BoutonEtape key={code} code={code} variante={code === suivantes.find((c) => c !== etape) ? "plein" : "contour"} className="text-sm">
                  {memeEtape ? "Changer mon mot" : e.label}
                </BoutonEtape>
              );
            })}
          </div>
        </form>
      )}

      {/* Ce qui se passe ensuite, dit simplement (sinon on ne sait pas comment « fermer » l'échange). */}
      {aide && etape === "livre" && (
        <p className="text-sm text-encre-douce">Livré ! L&apos;échange se ferme quand {prenomAutre} confirme « Bien reçu ».</p>
      )}
      {!aide && !fini && etape !== "livre" && (
        <p className="text-sm text-encre-douce">Quand ce sera livré, tu fermeras l&apos;échange ici avec « Bien reçu ».</p>
      )}
      {fini && avisDonne && <p className="text-sm font-semibold">Entraide terminée, merci pour ton avis.</p>}
      {fini && !avisDonne && (
        <p className="pop flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold">
          Entraide terminée. Dernière étape : ton avis sur {prenomAutre}.
          {lienAvis && (
            <a href={lienAvis} className="rounded-ui bg-encre px-3 py-1.5 text-surface hover:bg-encre/85">
              Laisser mon avis
            </a>
          )}
        </p>
      )}

      {/* Celui qui reçoit : « Bien reçu » une fois livré, ce qui termine l'entraide (et appelle un avis). */}
      {peutConfirmer({ etape, aide }) && (
        <form action={confirmerEntraide.bind(null, demandeId, retour)}>
          <BoutonEtape variante="plein" className="w-full sm:w-auto">
            Bien reçu, merci !
          </BoutonEtape>
        </form>
      )}
    </section>
  );
}
