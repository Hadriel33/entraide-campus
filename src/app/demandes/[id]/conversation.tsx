"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { heureCampus } from "@/lib/temps";
import { MiniPostit, SELECT_MINI, type MiniAnnonce } from "@/components/annonces/mini-postit";
import { Bouton } from "@/components/ui/bouton";
import { Colette } from "@/components/colette/colette";
import { STICKERS, contenuSticker, stickerDe } from "@/lib/messages/stickers";

export type Message = {
  id: string;
  auteur_id: string;
  contenu: string;
  cree_le: string;
  annonce_id?: string | null; // post-it partagé (0033)
  annonce?: MiniAnnonce | null;
};

const heure = heureCampus; // à l'heure de Paris, identique serveur et navigateur

// Conversation en direct. La sécurité est en base : la RLS ne renvoie (et Realtime ne diffuse) que les
// messages des conversations dont je suis participant, et le trigger refuse toute autre écriture.
export function Conversation({
  demandeId,
  moi,
  initiaux,
  prenomAutre,
  noms,
  debut,
}: {
  demandeId: string;
  moi: string;
  initiaux: Message[];
  prenomAutre: string;
  /** Discussion de groupe : le pseudo de chaque participant, affiché au-dessus de ses messages. */
  noms?: Record<string, string>;
  /** Le début de l'histoire, en tête du fil : la demande (avec son petit mot) puis l'acceptation. */
  debut?: { demandeur: string; message: string | null; demandeLe: string; accepteur: string; accepteLe: string | null };
}) {
  const [messages, setMessages] = useState<Message[]>(initiaux);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [planche, setPlanche] = useState(false);
  const fil = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`conversation-${demandeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `demande_id=eq.${demandeId}`,
        },
        async (charge) => {
          let m = charge.new as Message;
          // Un post-it partagé : on relit le message avec son post-it (la RLS décide s'il est encore visible).
          if (m.annonce_id) {
            const { data } = await supabase.from("messages").select(`id, auteur_id, contenu, cree_le, ${SELECT_MINI}`).eq("id", m.id).maybeSingle();
            if (data) m = data as unknown as Message;
          }
          setMessages((liste) =>
            liste.some((x) => x.id === m.id) ? liste : [...liste, m],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [demandeId]);

  useEffect(() => {
    // On fait défiler la liste des messages, pas la page entière (scrollIntoView remontait toute la page).
    const ol = fil.current;
    if (ol) ol.scrollTo({ top: ol.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (await publier(texte.trim())) setTexte("");
  }

  async function envoyerSticker(code: string) {
    setPlanche(false);
    await publier(contenuSticker(code));
  }

  async function publier(contenu: string) {
    if (!contenu || contenu.length > 1000) return false;
    setEnvoi(true);
    setErreur(null);
    const { data, error } = await createClient()
      .from("messages")
      .insert({ demande_id: demandeId, contenu })
      .select("id, auteur_id, contenu, cree_le")
      .single<Message>();
    setEnvoi(false);
    if (error || !data) {
      setErreur(
        error?.code === "P0429"
          ? error.message
          : "Message non envoyé. Réessaie.",
      );
      return false;
    }
    setMessages((liste) =>
      liste.some((x) => x.id === data.id) ? liste : [...liste, data],
    );
    return true;
  }

  return (
    <div className="flex flex-col gap-3">
      <ol
        ref={fil}
        className="flex max-h-[65dvh] min-h-72 flex-col gap-3 overflow-y-auto rounded-carte border border-ligne bg-surface p-4 sm:p-5"
        aria-live="polite"
      >
        {debut && (
          <li className="flex flex-col items-center gap-2 border-b border-dashed border-ligne pb-3 text-center text-sm text-encre-douce">
            <span>
              <strong className="text-encre">@{debut.demandeur}</strong> a demandé le contact · {heure(debut.demandeLe)}
            </span>
            {debut.message && <span className="max-w-md rounded-carte bg-postit-jaune px-4 py-2 font-main text-lg leading-snug text-encre">« {debut.message} »</span>}
            {debut.accepteLe && (
              <span className="rounded-full bg-ok-fond px-3 py-1 text-xs font-semibold text-ok">
                @{debut.accepteur} a accepté · {heure(debut.accepteLe)} : vos coordonnées sont visibles
              </span>
            )}
          </li>
        )}
        {messages.length === 0 && (
          <li className="m-auto max-w-xs text-center text-sm text-encre-douce">
            Pas encore de message. Dis bonjour à {prenomAutre} et proposez un
            moment pour vous voir.
          </li>
        )}
        {messages.map((m) => {
          const deMoi = m.auteur_id === moi;
          const sticker = stickerDe(m.contenu);
          return (
            <li
              key={m.id}
              className={`pop flex max-w-[85%] flex-col gap-1 ${deMoi ? "self-end items-end" : "self-start items-start"}`}
            >
              {noms && !deMoi && <span className="px-1 text-xs font-bold text-encre-douce">@{noms[m.auteur_id] ?? "?"}</span>}
              {sticker ? (
                <p
                  className="flex flex-col items-center"
                  title={sticker.legende}
                >
                  <Colette
                    couleur={sticker.couleur}
                    humeur={sticker.humeur}
                    anim={sticker.anim}
                    accessoire={sticker.accessoire}
                    saison={false}
                    taille={84}
                    titre={sticker.legende}
                  />
                  <span
                    className={`-mt-1 -rotate-2 font-main text-lg ${deMoi ? "text-alerte" : "text-encre"}`}
                  >
                    {sticker.legende}
                  </span>
                </p>
              ) : (
                <p
                  className={`rounded-carte px-4 py-2.5 text-base leading-snug whitespace-pre-line ${deMoi ? "bg-encre text-surface" : "bg-papier-fonce"}`}
                >
                  {m.contenu}
                </p>
              )}
              {m.annonce_id && <MiniPostit annonce={m.annonce ?? null} />}
              <span className="text-[11px] text-encre-douce">
                {heure(m.cree_le)}
              </span>
            </li>
          );
        })}
      </ol>

      {planche && (
        <div
          id="planche-stickers"
          className="pop grid grid-cols-4 gap-1 rounded-carte border border-ligne bg-surface p-2 sm:grid-cols-8"
          role="group"
          aria-label="Stickers de Colette"
        >
          {STICKERS.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => envoyerSticker(s.code)}
              disabled={envoi}
              className="presse group flex flex-col items-center gap-0.5 rounded-ui p-1.5 hover:bg-papier-fonce"
            >
              <span className="transition-transform group-hover:-translate-y-1 group-hover:-rotate-3">
                <Colette
                  couleur={s.couleur}
                  humeur={s.humeur}
                  accessoire={s.accessoire}
                  saison={false}
                  taille={48}
                  titre={s.legende}
                />
              </span>
              <span className="text-[11px] leading-tight font-semibold">
                {s.legende}
              </span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={envoyer} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setPlanche((v) => !v)}
          aria-expanded={planche}
          aria-controls="planche-stickers"
          title="Envoyer un sticker de Colette"
          className={`presse flex size-12 shrink-0 items-center justify-center rounded-ui border ${planche ? "border-encre bg-bandeau" : "border-ligne-forte bg-surface hover:border-encre"}`}
        >
          <Colette
            couleur="jaune"
            humeur="contente"
            saison={false}
            taille={32}
            titre="Stickers de Colette"
          />
        </button>
        <label className="sr-only" htmlFor="message">
          Ton message
        </label>
        <textarea
          id="message"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          maxLength={1000}
          placeholder={`Écris à ${prenomAutre}... (Entrée pour envoyer)`}
          className="min-h-12 flex-1 resize-none rounded-ui border border-ligne-forte bg-surface px-3 py-2 outline-none focus:border-encre"
        />
        <Bouton disabled={envoi || !texte.trim()}>
          {envoi ? "..." : "Envoyer"}
        </Bouton>
      </form>
      {erreur && (
        <p role="alert" className="text-sm text-alerte">
          {erreur}
        </p>
      )}
    </div>
  );
}
