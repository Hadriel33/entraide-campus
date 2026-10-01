"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bouton } from "@/components/ui/bouton";

export type Message = { id: string; auteur_id: string; contenu: string; cree_le: string };

function heure(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

// Conversation en direct. La sécurité est en base : la RLS ne renvoie (et Realtime ne diffuse) que les
// messages des conversations dont je suis participant, et le trigger refuse toute autre écriture.
export function Conversation({ demandeId, moi, initiaux, prenomAutre }: { demandeId: string; moi: string; initiaux: Message[]; prenomAutre: string }) {
  const [messages, setMessages] = useState<Message[]>(initiaux);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const bas = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`conversation-${demandeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `demande_id=eq.${demandeId}` }, (charge) => {
        const m = charge.new as Message;
        setMessages((liste) => (liste.some((x) => x.id === m.id) ? liste : [...liste, m]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [demandeId]);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu || contenu.length > 1000) return;
    setEnvoi(true);
    setErreur(null);
    const { data, error } = await createClient()
      .from("messages")
      .insert({ demande_id: demandeId, contenu })
      .select("id, auteur_id, contenu, cree_le")
      .single<Message>();
    setEnvoi(false);
    if (error || !data) {
      setErreur("Message non envoyé. Réessaie.");
      return;
    }
    setMessages((liste) => (liste.some((x) => x.id === data.id) ? liste : [...liste, data]));
    setTexte("");
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex max-h-[60dvh] min-h-48 flex-col gap-2 overflow-y-auto rounded-carte border border-ligne bg-surface p-4" aria-live="polite">
        {messages.length === 0 && (
          <li className="m-auto max-w-xs text-center text-sm text-encre-douce">
            Pas encore de message. Dis bonjour à {prenomAutre} et proposez un moment pour vous voir.
          </li>
        )}
        {messages.map((m) => {
          const deMoi = m.auteur_id === moi;
          return (
            <li key={m.id} className={`pop flex max-w-[80%] flex-col gap-0.5 ${deMoi ? "self-end items-end" : "self-start items-start"}`}>
              <p className={`rounded-carte px-3.5 py-2 text-[15px] whitespace-pre-line ${deMoi ? "bg-encre text-surface" : "bg-papier-fonce"}`}>{m.contenu}</p>
              <span className="text-[11px] text-encre-douce">{heure(m.cree_le)}</span>
            </li>
          );
        })}
        <div ref={bas} />
      </ol>

      <form onSubmit={envoyer} className="flex items-end gap-2">
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
        <Bouton disabled={envoi || !texte.trim()}>{envoi ? "..." : "Envoyer"}</Bouton>
      </form>
      {erreur && (
        <p role="alert" className="text-sm text-alerte">
          {erreur}
        </p>
      )}
    </div>
  );
}
