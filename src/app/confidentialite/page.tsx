import type { Metadata } from "next";
import { TitrePage } from "@/components/ui/titre-page";

export const metadata: Metadata = { title: "Confidentialité et mentions légales" };

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{titre}</h2>
      <div className="flex flex-col gap-2 text-encre-douce [&_strong]:text-encre">{children}</div>
    </section>
  );
}

export default function PageConfidentialite() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-10">
      <TitrePage accroche="Ce qu'on garde, pourquoi, et comment tout effacer. En clair.">Confidentialité</TitrePage>

      <Bloc titre="Qui sommes-nous ?">
        <p>
          L&apos;entraide du campus est un <strong>projet étudiant non officiel</strong>, réalisé dans le cadre du module Vibe
          Coding (M2 Data) à l&apos;ESD Bordeaux. Il n&apos;est pas édité par l&apos;ESD, l&apos;ESP ni leur groupe. Responsable
          du traitement : l&apos;étudiant auteur du projet, joignable via l&apos;espace de modération de l&apos;appli.
        </p>
      </Bloc>

      <Bloc titre="Les données que nous gardons">
        <ul className="list-inside list-disc">
          <li>
            <strong>Ton compte</strong> : email, mot de passe (chiffré, illisible même pour nous), prénom, pseudo, école.
          </li>
          <li>
            <strong>Ton profil</strong> : photo, bio et compétences, si tu choisis de les ajouter.
          </li>
          <li>
            <strong>Tes coordonnées</strong> : téléphone, email de contact et réseau. Elles ne sont visibles que par les
            personnes dont tu acceptes la demande, ou qui acceptent la tienne.
          </li>
          <li>
            <strong>Ton activité</strong> : annonces, demandes de contact, messages, avis et signalements.
          </li>
        </ul>
        <p>Aucune donnée n&apos;est vendue ni utilisée pour de la publicité. Il n&apos;y a ni pisteur publicitaire, ni cookie de mesure d&apos;audience.</p>
      </Bloc>

      <Bloc titre="L'intelligence artificielle">
        <p>
          <strong>Ton CV</strong> : si tu l&apos;utilises pour remplir tes compétences, il est envoyé une seule fois à un modèle
          d&apos;IA (Google Gemini, via Vercel), puis <strong>oublié</strong>. Il n&apos;est jamais enregistré. Tu relis et tu
          valides chaque compétence avant qu&apos;elle apparaisse sur ton profil.
        </p>
        <p>
          <strong>Tes annonces</strong> sont relues par une IA de modération (arnaques, contenus inappropriés, coordonnées
          écrites dans le texte). Elle ne supprime rien : un modérateur humain prend toujours la décision.
        </p>
      </Bloc>

      <Bloc titre="Où sont tes données ?">
        <p>
          Base de données et fichiers : Supabase (serveurs en Union européenne). Hébergement du site : Vercel. Les échanges
          sont chiffrés (HTTPS).
        </p>
      </Bloc>

      <Bloc titre="Tes droits">
        <p>
          Tu peux à tout moment <strong>modifier</strong> tes informations dans « Mon profil » et <strong>supprimer ton compte</strong>{" "}
          (en bas de « Mon profil »). La suppression efface immédiatement et définitivement ton profil, tes coordonnées, ta photo,
          tes annonces, tes demandes, tes messages et tes avis.
        </p>
        <p>Cookies : uniquement ceux nécessaires pour rester connecté. Aucun cookie optionnel, donc pas de bandeau.</p>
      </Bloc>
    </article>
  );
}
