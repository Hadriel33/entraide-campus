import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BoutonLien } from "@/components/ui/bouton";
import { Colette } from "@/components/colette/colette";
import { ColetteGuide } from "@/components/accueil/colette-guide";
import { DemoSuivi } from "@/components/accueil/demo-suivi";

type Impact = { etudiants: number; annonces_actives: number; entraides: number; croisements: number; campus?: number };

// Exemples d'affichage pour la page publique (les vraies annonces sont réservées aux étudiants connectés).
const EXEMPLES = [
  { papier: "papier-lilas", type: "Je propose", titre: "Shooting portrait pour ton book", texte: "Lumière naturelle sur le campus, retouche incluse.", note: "Gratuit !", place: "top-0 left-0 -rotate-[4deg]" },
  { papier: "papier-ciel", type: "Je cherche", titre: "Aide sur mon site Next.js", texte: "Je bloque sur la connexion. En échange : du motion.", note: "Troc", place: "top-24 right-0 rotate-3" },
  { papier: "papier-ocre", type: "Je propose", titre: "Covoit Mérignac vers le campus, lundi 8 h", texte: "", note: "Frais partagés", place: "top-[300px] left-3 rotate-2" },
  { papier: "papier-jaune", type: "Je cherche", titre: "Relecture de mon mémoire", texte: "", note: "À discuter", place: "top-[380px] right-2 -rotate-[2.5deg]" },
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
      {/* Affiche : les verbes de la charte sur bandeaux, et le mur en vrac à côté. */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-6 pb-20 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-7">
          <h1 className="flex flex-col items-start gap-2 whitespace-nowrap">
            <span className="apparition titre-charte couche-fixe teinte-lilas bg-bandeau px-3 pt-1.5 text-affiche">Propose</span>
            <span className="apparition titre-charte couche-fixe teinte-ciel ml-6 bg-lilas px-3 pt-1.5 text-affiche sm:ml-11" style={{ "--i": 2 } as React.CSSProperties}>
              Cherche
            </span>
            <span className="apparition titre-charte couche-fixe teinte-ocre ml-12 bg-ciel px-3 pt-1.5 text-affiche sm:ml-22" style={{ "--i": 4 } as React.CSSProperties}>
              Entraide
            </span>
          </h1>
          <p className="max-w-xl font-serif text-xl leading-snug text-encre/80 sm:text-[1.4rem]">
            Le tableau d&apos;affichage des étudiants, campus par campus. Un shooting, un coup de main sur ton code, une coloc, un covoit : tout
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

        <div className="relative hidden h-[690px] sm:block" aria-hidden>
          {EXEMPLES.map((e, i) => (
            <article key={e.titre} className={`colle postit ${e.papier} absolute flex w-60 flex-col gap-2.5 p-5 pt-7 ${e.place}`} style={{ "--i": i + 3 } as React.CSSProperties}>
              <span className="scotch" />
              <span className={`titre-charte self-start rounded-[3px] px-1.5 pt-0.5 text-sm ${e.type === "Je cherche" ? "bg-encre text-surface" : "border-[1.5px] border-encre"}`}>
                {e.type}
              </span>
              <strong className="text-lg leading-tight">{e.titre}</strong>
              {e.texte && <span className="text-sm text-encre/70">{e.texte}</span>}
              <span className="-rotate-3 self-end font-main text-xl font-bold text-alerte">{e.note}</span>
            </article>
          ))}
          <div className="absolute bottom-0 left-0 flex items-end gap-2">
            <Colette anim="coucou" taille={130} />
            <span className="pop mb-24 rounded-carte border-2 border-encre bg-surface px-3 py-2 font-main text-lg leading-snug whitespace-nowrap shadow-[3px_3px_0_0_var(--color-bandeau)]" style={{ animationDelay: "0.9s" }}>
              Salut, moi c&apos;est Colette.
              <br />
              Je te fais visiter ?
            </span>
          </div>
        </div>
      </section>

      {/* Bande des catégories qui défile */}
      <div className="-rotate-[1.2deg] overflow-hidden bg-encre py-4 text-surface" aria-label="Ce qui s'échange" data-colette="Photo, code, coloc, covoit... Ici, tout s'échange entre étudiants." data-cote="gauche" data-anim="saute">
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
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pt-28 pb-10" data-colette="Ton numéro reste caché tant que tu n'as pas dit oui. Promis, c'est vérifié en base." data-cote="droite" data-anim="tampon">
        <h2 className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="titre-charte text-titre">Comment ça marche</span>
          <span className="-rotate-2 font-main text-2xl text-encre-douce">trois post-it, c&apos;est tout</span>
        </h2>
        <div className="grid items-start gap-12 md:grid-cols-3">
          {[
            { papier: "papier-jaune", rot: "-2deg", titre: "Tu affiches", texte: "Ce que tu sais faire ou ce qu'il te faut. Ton profil se remplit tout seul depuis ton CV, tu valides." },
            { papier: "papier-lilas", rot: "1.5deg", titre: "On te demande", texte: "Un étudiant clique « Demander le contact ». Ton numéro reste caché tant que tu n'as pas dit oui." },
            { papier: "papier-ciel", rot: "-1deg", titre: "Vous discutez", texte: "Tu acceptes : vos coordonnées s'échangent et la discussion s'ouvre. Après l'entraide, un avis et des points pour ton campus." },
          ].map((e, i) => (
            <div key={e.titre} className="revele">
            <div className={`postit ${e.papier} flex flex-col gap-3 p-7 pt-9 ${i === 1 ? "md:mt-8" : ""}`} style={{ "--rot": e.rot } as React.CSSProperties}>
              <span className="punaise" aria-hidden />
              <h3 className="titre-charte text-4xl">{e.titre}</h3>
              <p className="leading-relaxed">{e.texte}</p>
            </div>
            </div>
          ))}
        </div>
      </section>

      {/* Le suivi façon colis, en démonstration (la vraie barre, qui tourne toute seule). */}
      <section
        className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2"
        data-colette="Et moi, je fais la livreuse. Tu suis ton entraide comme un colis !"
        data-cote="gauche"
        data-anim="danse"
      >
        <div className="flex flex-col gap-5">
          <h2 className="flex flex-col items-start gap-1">
            <span className="titre-charte text-titre">Suis ton entraide</span>
            <span className="-rotate-2 font-main text-2xl text-encre-douce">comme un colis, avec Colette</span>
          </h2>
        </div>
        <div className="revele postit papier-ciel p-5 pt-7" style={{ "--rot": "1deg" } as React.CSSProperties}>
          <span className="punaise" aria-hidden />
          <DemoSuivi />
        </div>
      </section>

      {/* Les 4 IA : à quoi elles servent, et qui décide. */}
      <section
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16"
        data-colette="J'ai quatre IA dans la poche. Elles aident, c'est toi qui décides."
        data-cote="droite"
        data-anim="lit"
      >
        <h2 className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="titre-charte text-titre">Colette a quatre IA</span>
          <span className="-rotate-2 font-main text-2xl text-encre-douce">et c&apos;est toi qui valides</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { papier: "papier-jaune", rot: "-1.5deg", titre: "Elle lit ton CV", texte: "Elle te propose tes compétences. Tu gardes ce qui est juste. Le CV n'est jamais stocké." },
            { papier: "papier-lilas", rot: "1deg", titre: "Elle écrit ton post-it", texte: "Une phrase suffit : elle rédige le titre et le texte. Tu relis avant de publier." },
            { papier: "papier-ciel", rot: "-0.5deg", titre: "Elle relit tout", texte: "Texte et photo, avant publication. Un numéro qui traîne ? Elle propose une version sans." },
            { papier: "papier-ocre", rot: "1.5deg", titre: "Elle trie pour toi", texte: "Le tableau « Pour moi » met en haut ce qui colle à tes compétences, et dit pourquoi." },
          ].map((e) => (
            <div key={e.titre} className="revele">
              <div className={`postit ${e.papier} flex h-full flex-col gap-2 p-6 pt-8`} style={{ "--rot": e.rot } as React.CSSProperties}>
                <span className="scotch" aria-hidden />
                <h3 className="titre-charte text-2xl leading-none">{e.titre}</h3>
                <p className="text-[0.95rem] leading-relaxed">{e.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Le championnat des campus */}
      <section
        className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 py-20 md:grid-cols-2"
        data-colette="Chaque entraide fait marquer des points à ton campus. Allez Bordeaux !"
        data-cote="gauche"
        data-anim="saute"
      >
        <div className="revele relative grid grid-cols-3 gap-3" aria-hidden>
          {[
            { c: "Paris", fond: "bg-ciel", rot: "-3deg" },
            { c: "Lyon", fond: "bg-lilas", rot: "2deg" },
            { c: "Bordeaux", fond: "bg-bandeau", rot: "-1deg" },
            { c: "Toulouse", fond: "bg-ocre", rot: "3deg" },
            { c: "Nantes", fond: "bg-ciel", rot: "-2deg" },
            { c: "Lille", fond: "bg-lilas", rot: "1.5deg" },
          ].map((x) => (
            <div key={x.c} className={`${x.fond} flex aspect-square items-end p-3 shadow-[4px_4px_0_0_var(--color-encre)]`} style={{ rotate: x.rot }}>
              <span className="titre-charte text-xl sm:text-2xl">{x.c}</span>
            </div>
          ))}
          <span className="absolute -top-8 right-0 -rotate-[6deg] font-main text-3xl font-bold text-alerte">qui sera en tête ?</span>
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="titre-charte text-titre">Six campus, un championnat</h2>
          <p className="font-serif text-xl leading-relaxed text-encre/80">
            Chaque coup de main accepté fait gagner des points à ton campus. Une saison dure un mois : le 1er, tout repart à zéro, et ta classe
            monte avec toi.
          </p>
        </div>
      </section>

      {/* Réservé à l'école */}
      <section
        className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 py-14 md:grid-cols-2"
        data-colette="Pas d'inconnus : il faut ton mail de l'école, et je vérifie que c'est bien le tien."
        data-cote="droite"
        data-anim="cherche"
      >
        <div className="flex flex-col gap-5">
          <h2 className="titre-charte text-titre">Entre étudiants de l&apos;école, point</h2>
          <p className="font-serif text-xl leading-relaxed text-encre/80">
            Pour entrer, il faut ton mail de l&apos;école (l&apos;ancienne adresse marche aussi). Pas d&apos;inconnus, pas de faux profils : tout le monde sur le tableau est de l&apos;école.
          </p>
        </div>
        <div className="revele postit papier-gris flex flex-col gap-3 p-7 pt-9" style={{ "--rot": "1.5deg" } as React.CSSProperties}>
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
        <section
          className="revele mx-auto w-full max-w-6xl px-4 py-10"
          aria-label="Post-it campus en chiffres"
          data-colette="Et ça, c'est le campus en vrai, en direct."
          data-cote="gauche"
          data-anim="coucou"
        >
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { valeur: impact.etudiants, label: "étudiants inscrits", teinte: "teinte-bandeau" },
              { valeur: impact.annonces_actives, label: "post-it sur le tableau", teinte: "teinte-lilas" },
              { valeur: impact.entraides, label: "entraides réalisées", teinte: "teinte-ciel" },
              { valeur: `${impact.campus ?? 1} / 6`, label: "campus déjà lancés", teinte: "teinte-ocre" },
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
      <section
        className="mt-16 flex flex-col items-center gap-6 bg-bandeau px-4 py-20 text-center"
        data-colette="Allez, ton premier post-it t'attend. Je te tiens la porte !"
        data-cote="droite"
        data-anim="saute"
      >
        {/* Rond blanc : Colette jaune sur le bandeau jaune, on ne la voyait pas. */}
        <span className="flex size-36 items-center justify-center rounded-full bg-surface ring-2 ring-encre">
          <Colette anim="saute" taille={104} />
        </span>
        <h2 className="titre-charte text-titre">Ton premier post-it t&apos;attend</h2>
        <BoutonLien href="/inscription" className="min-h-14 px-7 text-lg shadow-[5px_5px_0_0_var(--color-lilas)]">
          Créer mon compte avec mon mail d&apos;école
        </BoutonLien>
      </section>
      <ColetteGuide />
    </div>
  );
}
