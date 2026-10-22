"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { salonsDe, type Salon } from "@/lib/social/social";
import { Avatar } from "@/components/ui/avatar";
import { ilYa } from "@/lib/temps";

type Personne = { pseudo: string; avatar_chemin: string | null; colette_couleur?: string };
type Conversation = { id: string; repondu_le: string | null; annonce: { titre: string } | null; demandeur: Personne | null; destinataire: Personne | null; demandeur_id: string };
type MessageSalon = { id: string; auteur_id: string; contenu: string; cree_le: string; auteur: Personne | null };

// La tête de Colette en lettre : une enveloppe post-it avec ses yeux, et sa punaise en guise de cachet.
function ColetteLettre() {
  return (
    <svg viewBox="0 0 64 64" className="size-10" aria-hidden>
      <rect x="6" y="14" width="52" height="38" rx="4" className="fill-postit-jaune stroke-encre" strokeWidth="3" />
      <path d="M8 17 32 36 56 17" className="fill-none stroke-encre" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="24" cy="42" r="2.6" className="fill-encre" />
      <circle cx="40" cy="42" r="2.6" className="fill-encre" />
      <path d="M28 46.5c2.4 2 5.6 2 8 0" className="fill-none stroke-encre" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="32" cy="12" r="5" className="fill-accent stroke-encre" strokeWidth="2" />
    </svg>
  );
}

// Un salon en direct : les 50 derniers messages, puis Realtime (qui respecte la RLS : je ne reçois que mes salons).
function ChatSalon({ salon, moi, retour }: { salon: Salon; moi: string; retour: () => void }) {
  const [messages, setMessages] = useState<MessageSalon[]>([]);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const fil = useRef<HTMLOListElement>(null);
  const SELECT = "id, auteur_id, contenu, cree_le, auteur:profils!salon_messages_auteur_id_fkey(pseudo, avatar_chemin, colette_couleur)";

  useEffect(() => {
    const supabase = createClient();
    let actif = true;
    supabase
      .from("salon_messages")
      .select(SELECT)
      .eq("salon", salon.id)
      .order("cree_le", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (actif) setMessages(((data ?? []) as unknown as MessageSalon[]).reverse());
      });
    const canal = supabase
      .channel(`salon-${salon.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "salon_messages", filter: `salon=eq.${salon.id}` }, async ({ new: m }) => {
        const { data } = await supabase.from("salon_messages").select(SELECT).eq("id", (m as { id: string }).id).maybeSingle();
        if (data) setMessages((l) => (l.some((x) => x.id === data.id) ? l : [...l, data as unknown as MessageSalon]));
      })
      .subscribe();
    return () => {
      actif = false;
      supabase.removeChannel(canal);
    };
  }, [salon.id]);

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight });
  }, [messages.length]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu) return;
    setErreur(null);
    const { data, error } = await createClient().from("salon_messages").insert({ salon: salon.id, contenu }).select(SELECT).single();
    if (error) {
      // Messages écrits par la base (coordonnées, anti-spam) : déjà en français et clairs.
      setErreur(error.code === "22023" || error.code === "P0429" ? error.message : "Message impossible. Réessaie.");
      return;
    }
    setTexte("");
    setMessages((l) => (l.some((x) => x.id === data.id) ? l : [...l, data as unknown as MessageSalon]));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-ligne px-3 py-2">
        <button type="button" onClick={retour} className="presse rounded-ui px-2 py-1 text-sm font-semibold text-encre-douce hover:text-encre" aria-label="Retour aux salons">
          ‹ Salons
        </button>
        <strong className="truncate">{salon.nom}</strong>
      </div>
      <ol ref={fil} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
        {messages.length === 0 && <li className="m-auto text-center font-main text-lg text-encre-douce">Personne n&apos;a encore écrit. Lance la discussion !</li>}
        {messages.map((m) => {
          const mien = m.auteur_id === moi;
          return (
            <li key={m.id} className={`flex items-end gap-2 ${mien ? "flex-row-reverse" : ""}`}>
              {!mien && <Avatar chemin={m.auteur?.avatar_chemin} nom={m.auteur?.pseudo ?? "?"} taille="sm" colette={m.auteur ?? undefined} />}
              <div className={`flex max-w-[80%] flex-col rounded-carte px-3 py-1.5 text-sm ${mien ? "bg-encre text-surface" : "bg-papier-fonce"}`}>
                {!mien && <span className="text-xs font-semibold">@{m.auteur?.pseudo}</span>}
                <span className="break-words">{m.contenu}</span>
                <span className={`text-[10px] ${mien ? "text-surface/60" : "text-encre-douce"}`}>{ilYa(m.cree_le)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {erreur && (
        <p role="alert" className="px-3 text-xs text-alerte">
          {erreur}
        </p>
      )}
      <form onSubmit={envoyer} className="flex gap-2 border-t border-ligne p-2">
        <label htmlFor="salon-texte" className="sr-only">
          Ton message
        </label>
        <input
          id="salon-texte"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={500}
          autoComplete="off"
          placeholder={`Écrire dans ${salon.nom}...`}
          className="min-h-10 min-w-0 flex-1 rounded-full border border-ligne-forte bg-surface px-4 text-sm outline-none focus:border-encre"
        />
        <button className="presse min-h-10 rounded-full bg-encre px-4 text-sm font-semibold text-surface">Envoyer</button>
      </form>
    </div>
  );
}

// La bulle en bas à droite : mes conversations privées et les salons du campus, sans quitter la page.
export function BulleColette({
  moi,
  campus,
  classe,
  nonLus,
}: {
  moi: string;
  campus: string;
  classe: { id: string; nom: string } | null;
  nonLus: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState<"perso" | "salons">("perso");
  const [salon, setSalon] = useState<Salon | null>(null);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const salons = salonsDe({ campus, classe });

  useEffect(() => {
    if (!ouvert || conversations) return;
    createClient()
      .from("demandes_contact")
      .select(
        "id, repondu_le, demandeur_id, annonce:annonces(titre), demandeur:profils!demandes_contact_demandeur_id_fkey(pseudo, avatar_chemin, colette_couleur), destinataire:profils!demandes_contact_destinataire_id_fkey(pseudo, avatar_chemin, colette_couleur)",
      )
      .eq("statut", "acceptee")
      .order("repondu_le", { ascending: false })
      .limit(20)
      .then(({ data }) => setConversations((data ?? []) as unknown as Conversation[]));
  }, [ouvert, conversations]);

  const onglet_ = "flex-1 border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-encre-douce aria-selected:border-accent aria-selected:text-encre";

  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6" onKeyDown={(e) => e.key === "Escape" && setOuvert(false)}>
      {ouvert && (
        <section
          className="monte flex h-[min(32rem,70dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-carte border border-ligne-forte bg-surface shadow-xl"
          aria-label="Messages"
        >
          {!salon && (
            <div role="tablist" className="flex border-b border-ligne">
              <button type="button" role="tab" aria-selected={onglet === "perso"} onClick={() => setOnglet("perso")} className={onglet_}>
                Perso
              </button>
              <button type="button" role="tab" aria-selected={onglet === "salons"} onClick={() => setOnglet("salons")} className={onglet_}>
                Salons
              </button>
            </div>
          )}
          {salon ? (
            <ChatSalon salon={salon} moi={moi} retour={() => setSalon(null)} />
          ) : onglet === "perso" ? (
            <ul className="flex flex-1 flex-col overflow-y-auto p-1.5">
              {conversations === null && <li className="m-auto text-sm text-encre-douce">Chargement...</li>}
              {conversations?.length === 0 && (
                <li className="m-auto max-w-60 text-center font-main text-lg text-encre-douce">Pas encore de discussion. Elles s&apos;ouvrent quand une demande est acceptée.</li>
              )}
              {conversations?.map((c) => {
                const autre = c.demandeur_id === moi ? c.destinataire : c.demandeur;
                return (
                  <li key={c.id}>
                    <Link href={`/demandes/${c.id}`} onClick={() => setOuvert(false)} className="presse flex items-center gap-3 rounded-ui p-2.5 hover:bg-papier-fonce">
                      <Avatar chemin={autre?.avatar_chemin} nom={autre?.pseudo ?? "?"} colette={autre ?? undefined} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-semibold">@{autre?.pseudo}</span>
                        <span className="truncate text-xs text-encre-douce">{c.annonce?.titre}</span>
                      </span>
                      {c.repondu_le && <span className="shrink-0 text-[11px] text-encre-douce">{ilYa(c.repondu_le)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-1.5">
              {salons.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setSalon(s)} className="presse flex w-full items-center gap-3 rounded-ui p-2.5 text-left hover:bg-papier-fonce">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-papier-fonce font-main text-lg font-bold">#</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{s.nom}</span>
                      <span className="text-xs text-encre-douce">
                        {s.id === "general" ? "Tous les campus" : s.id.startsWith("campus:") ? "Les étudiants de ton campus" : "Ta classe"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li className="mt-auto px-2.5 pb-2 text-xs text-encre-douce">Pas de numéro ni d&apos;email dans les salons : pour échanger tes coordonnées, passe par « Demander le contact ».</li>
            </ul>
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={ouvert ? "Fermer les messages" : `Messages${nonLus ? ` (${nonLus} non lus)` : ""}`}
        className="presse relative flex size-15 items-center justify-center rounded-full border-2 border-encre bg-surface shadow-[3px_3px_0_0_var(--color-encre)] hover:-translate-y-0.5"
      >
        <ColetteLettre />
        {nonLus > 0 && !ouvert && (
          <span className="pop absolute -top-1.5 -right-1.5 min-w-6 rounded-full border-2 border-surface bg-accent px-1 text-center text-xs leading-5 font-bold text-surface">{nonLus}</span>
        )}
      </button>
    </div>
  );
}
