import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BoutonLien } from "@/components/ui/bouton";
import { Colette } from "@/components/colette/colette";

type Impact = { etudiants: number; annonces_actives: number; entraides: number; croisements: number };

// Exemples d'affichage pour la page publique (les vraies annonces sont réservées aux étudiants connectés).
const EXEMPLES = [
  { papier: "papier-lilas", type: "Je propose", titre: "Shooting portrait pour ton book", texte: "Lumière naturelle sur le campus, retouche incluse.", note: "Gratuit !", place: "top-2 left-6 -rotate-[4deg]" },
  { papier: "papier-ciel", type: "Je cherche", titre: "Aide sur mon site Next.js", texte: "Je bloque sur la connexion. En échange : du motion.", note: "Troc", place: "top-14 right-0 rotate-3" },
  { papier: "papier-ocre", type: "Je propose", titre: "Covoit Mérignac vers le campus, lundi 8 h", texte: "", note: "Frais partagés", place: "top-[290px] left-0 rotate-2" },
  { papier: "papier-jaune", type: "Je cherche", titre: "Relecture de mon mémoire", texte: "", note: "À discuter", place: "top-[320px] right-5 -rotate-[2.5deg]" },
];

const CATEGORIES_DEFILE = ["Photo", "Dev web", "Coloc", "Covoit", "Design", "Data et IA", "Shooting", "Motion", "Prêt de matériel", "Binôme", "Rédaction", "UX/UI"];
const COULEURS_BARRE = ["text-bandeau", "text-lilas", "text-ciel", "text-ocre"];

export default async function Home() {
  const { supabase, user } = await getSession();
  // Connecté : on arrive sur son bureau.
  if (user) redirect("/bureau");
  // Compteur d'impact : agrégats publics uniquement (fonction stats_publiques, aucune donnée personnelle).
  const { data } = await supabase.rpc("stats_publiques");
  const impact = data as Impact | null;

  return (
    <div className="-mx-4 flex flex-col overflow-x-clip">
      {/* Affiche : les verbes de la charte ESP sur bandeaux, et le mur en vrac à côté. */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-20 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-7">
          <h1 className="flex flex-col items-start gap-2 whitespace-nowrap">
            <span className="apparition titre-charte couche-fixe teinte-lilas bg-bandeau px-3 pt-1.5 text-affiche">Propose</span>
            <span className="apparition titre-charte couche-fixe teinte-ciel ml-6 bg-lilas px-3 pt-1.5 text-affiche sm:ml-11" style={{ "--i": 2 } as React.CSSProperties}>
              Cherche
            </span>
            <span className="apparition titre-charte couche-fixe teinte-ocre ml-12 bg-ciel px-3 pt-1.5 text-affiche sm:ml-22" style={{ "--i": 4 } as React.CSSProperties}>
              Entraide-toi
            </span>
          </h1>
          <p className="max-w-xl font-serif text-xl leading-snug text-encre/80 sm:text-[1.4rem]">
            Le tableau d&apos;affichage des étudiants de l&apos;ESD et de l&apos;ESP Bordeaux. Un shooting, un coup de main sur ton code, une coloc, un covoit : tout
            s&apos;échange ici.
          </p>
          <div className="flex flex-wrap gap-3">
            <BoutonLien href="/inscription" className="min-h-13 px-6 text-lg">
              Créer mon compte
            </BoutonLien>
            <BoutonLien href="/connexion" variante="contour" className="min-h-13 px-5 text-lg">
              J&apos;ai déjà un compte
            </BoutonLien>
          </div>
          <p className="flex -rotate-2 items-end gap-2 font-main text-xl text-alerte">
            {/* Flèche griffonnée qui remonte vers « Créer mon compte » */}
            <svg viewBox="0 0 44 40" className="-mt-6 h-10 w-11 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M42 34C26 35 12 28 9 6" />
              <path d="M3 12l6-7 6 6" />
            </svg>
            réservé aux mails @mail-esd.com et @mail-esp.com
          </p>
        </div>

        <div className="relative hidden h-[640px] sm:block" aria-hidden>
          {EXEMPLES.map((e, i) => (
            <article key={e.titre} className={`colle postit ${e.papier} absolute flex w-64 flex-col gap-2.5 p-5 pt-7 ${e.place}`} style={{ "--i": i + 3 } as React.CSSProperties}>
              <span className="scotch" />
              <span className={`titre-charte self-start rounded-[3px] px-1.5 pt-0.5 text-sm ${e.type === "Je cherche" ? "bg-encre text-surface" : "border-[1.5px] border-encre"}`}>
                {e.type}
              </span>
              <strong className="text-lg leading-tight">{e.titre}</strong>
              {e.texte && <span className="text-sm text-encre/70">{e.texte}</span>}
              <span className="-rotate-3 self-end font-main text-xl font-bold text-alerte">{e.note}</span>
            </article>
          ))}
          <div className="absolute bottom-0 left-1/3 -translate-x-1/2">
            <Colette anim="coucou" taille={130} />
          </div>
        </div>
      </section>

      {/* Bande des catégories qui défile */}
      <div className="-rotate-[1.2deg] overflow-hidden bg-encre py-4 text-surface" aria-label="Ce qui s'échange">
        <div className="defile flex w-max gap-7">
          {[0, 1].map((n) => (
            <span key={n} className="titre-charte flex shrink-0 gap-7 text-3xl sm:text-4xl" aria-hidden={n === 1}>
              {CATEGORIES_DEFILE.map((c, i) => (
                <span key={c} className="flex gap-7">
                  {c}
                  <span className={COULEURS_BARRE[i % 4]}>/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Comment ça marche : trois post-it punaisés */}
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pt-28 pb-10">
        <h2 className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="titre-charte text-titre">Comment ça marche</span>
          <span className="-rotate-2 font-main text-2xl text-encre-douce">trois post-it, c&apos;est tout</span>
        </h2>
        <div className="grid items-start gap-12 md:grid-cols-3">
          {[
            { papier: "papier-jaune", rot: "-2deg", titre: "Tu affiches", texte: "Ce que tu sais faire ou ce qu'il te faut. Ton profil se remplit tout seul depuis ton CV, tu valides." },
            { papier: "papier-lilas", rot: "1.5deg", titre: "On te demande", texte: "Un étudiant clique « Demander le contact ». Ton numéro reste caché tant que tu n'as pas dit oui." },
            { papier: "papier-ciel", rot: "-1deg", titre: "Vous discutez", texte: "Tu acceptes : la discussion s'ouvre dans l'appli. Après l'entraide, un avis, des points, un badge." },
          ].map((e, i) => (
            <div key={e.titre} className={`postit ${e.papier} flex flex-col gap-3 p-7 pt-9 ${i === 1 ? "md:mt-8" : ""}`} style={{ "--rot": e.rot } as React.CSSProperties}>
              <span className="punaise" aria-hidden />
              <h3 className="titre-charte text-4xl">{e.titre}</h3>
              <p className="leading-relaxed">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESD × ESP */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 py-20 md:grid-cols-2">
        <div className="relative h-80" aria-hidden>
          <div className="absolute top-0 left-0 w-72 -rotate-3 bg-ciel p-7 shadow-[6px_6px_0_0_var(--color-encre)] sm:w-80">
            <span className="titre-charte block text-6xl">ESD</span>
            <span className="font-semibold">Dev, data, UX, no-code</span>
          </div>
          <div className="absolute right-0 bottom-0 w-72 rotate-3 bg-lilas p-7 shadow-[6px_6px_0_0_var(--color-encre)] sm:w-80">
            <span className="titre-charte block text-6xl">ESP</span>
            <span className="font-semibold">Créa, pub, photo, vidéo</span>
          </div>
          <span className="absolute top-36 left-1/2 -translate-x-1/3 -rotate-[8deg] font-main text-4xl font-bold text-alerte">ça matche</span>
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="titre-charte text-titre">Le dev de l&apos;un, la créa de l&apos;autre</h2>
          <p className="font-serif text-xl leading-relaxed text-encre/80">
            Sur un même campus, deux écoles qui se complètent. Chaque entraide entre un étudiant ESD et un étudiant ESP rapporte un bonus « croisement » au
            classement, et ta classe monte avec toi.
          </p>
        </div>
      </section>

      {/* Réservé à l'école */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 py-14 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h2 className="titre-charte text-titre">Entre étudiants de l&apos;école, point</h2>
          <p className="font-serif text-xl leading-relaxed text-encre/80">
            Pour entrer, il faut un mail de l&apos;ESD ou de l&apos;ESP. Pas d&apos;inconnus, pas de faux profils : tout le monde sur le mur est sur le campus.
          </p>
        </div>
        <div className="postit papier-gris flex flex-col gap-3 p-7 pt-9" style={{ "--rot": "1.5deg" } as React.CSSProperties}>
          <span className="punaise" aria-hidden />
          {["prenom.nom@mail-esd.com", "prenom.nom@mail-esp.com"].map((m) => (
            <p key={m} className="flex items-center gap-2.5 rounded-ui bg-ok-fond px-4 py-3 text-lg font-semibold">
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-ok" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12l5 5 9-10" />
              </svg>
              {m}
            </p>
          ))}
          <p className="flex items-center gap-2.5 rounded-ui bg-surface/70 px-4 py-3 text-lg text-encre-douce line-through">
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-alerte" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
            quelquun@gmail.com
          </p>
          <span className="-rotate-2 self-end font-main text-xl text-alerte">que des gens du campus</span>
        </div>
      </section>

      {impact && impact.etudiants >= 5 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-10" aria-label="Post-it campus en chiffres">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { valeur: impact.etudiants, label: "étudiants inscrits", teinte: "teinte-bandeau" },
              { valeur: impact.annonces_actives, label: "post-it sur le mur", teinte: "teinte-lilas" },
              { valeur: impact.entraides, label: "entraides réalisées", teinte: "teinte-ciel" },
              { valeur: impact.croisements, label: "entre ESD et ESP", teinte: "teinte-ocre" },
            ].map((c) => (
              <div key={c.label} className={`couche-fixe ${c.teinte} flex flex-col-reverse rounded-carte border border-ligne bg-surface p-5`}>
                <dt className="text-sm text-encre-douce">{c.label}</dt>
                <dd className="titre-charte text-5xl">{c.valeur}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Dernier appel */}
      <section className="mt-16 flex flex-col items-center gap-6 bg-bandeau px-4 py-20 text-center">
        <Colette anim="saute" taille={110} />
        <h2 className="titre-charte text-titre">Ton premier post-it t&apos;attend</h2>
        <BoutonLien href="/inscription" className="min-h-14 px-7 text-lg shadow-[5px_5px_0_0_var(--color-lilas)]">
          Créer mon compte avec mon mail d&apos;école
        </BoutonLien>
      </section>
    </div>
  );
}
