"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bouton } from "@/components/ui/bouton";
import { Colette } from "@/components/colette/colette";
import { STICKERS, contenuSticker, stickerDe } from "@/lib/messages/stickers";
import type { Suggestion } from "@/lib/messages/brise-glace";

export type Message = {
  id: string;
  auteur_id: string;
  contenu: string;
  cree_le: string;
};

function heure(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Conversation en direct. La sécurité est en base : la RLS ne renvoie (et Realtime ne diffuse) que les
// messages des conversations dont je suis participant, et le trigger refuse toute autre écriture.
export function Conversation({
  demandeId,
  moi,
  initiaux,
  prenomAutre,
  suggestions = [],
}: {
  demandeId: string;
  moi: string;
  initiaux: Message[];
  prenomAutre: string;
  suggestions?: Suggestion[];
}) {
  const [messages, setMessages] = useState<Message[]>(initiaux);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [planche, setPlanche] = useState(false);
  const [idees, setIdees] = useState(false);
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
        (charge) => {
          const m = charge.new as Message;
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
        className="flex max-h-[60dvh] min-h-48 flex-col gap-2 overflow-y-auto rounded-carte border border-ligne bg-surface p-4"
        aria-live="polite"
      >
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
              className={`pop flex max-w-[80%] flex-col gap-0.5 ${deMoi ? "self-end items-end" : "self-start items-start"}`}
            >
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
                  className={`rounded-carte px-3.5 py-2 text-[15px] whitespace-pre-line ${deMoi ? "bg-encre text-surface" : "bg-papier-fonce"}`}
                >
                  {m.contenu}
                </p>
              )}
              <span className="text-[11px] text-encre-douce">
                {heure(m.cree_le)}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Colette souffle une première phrase (tant que je n'ai rien écrit, ou à la demande). */}
      {suggestions.length > 0 &&
        (idees || !messages.some((m) => m.auteur_id === moi)) && (
          <div className="pop flex flex-col gap-2 rounded-carte border border-dashed border-ligne-forte bg-surface p-3">
            <p className="flex items-center gap-2 font-main text-lg">
              <Colette anim="reflechit" taille={36} saison={false} />
              Colette te souffle :
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.ton}
                  type="button"
                  onClick={() => {
                    setTexte(s.texte);
                    setIdees(false);
                    document.getElementById("message")?.focus();
                  }}
                  className={`presse rounded-ui px-3 py-1.5 text-left text-sm hover:-translate-y-0.5 ${s.ton === "blague" ? "bg-postit-jaune" : s.ton === "sympa" ? "bg-postit-lilas" : "bg-postit-ciel"}`}
                >
                  {s.texte}
                </button>
              ))}
            </div>
          </div>
        )}

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
        {suggestions.length > 0 &&
          messages.some((m) => m.auteur_id === moi) && (
            <button
              type="button"
              onClick={() => setIdees((v) => !v)}
              aria-pressed={idees}
              title="Une idée de phrase ?"
              className="presse hidden min-h-12 shrink-0 rounded-ui border border-ligne-forte bg-surface px-2.5 text-sm font-semibold hover:border-encre sm:block"
            >
              Une idée ?
            </button>
          )}
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
