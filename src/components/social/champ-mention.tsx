"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { insererMention, mentionEnCours } from "@/lib/social/mentions";

type Personne = { pseudo: string; prenom: string };

// Champ texte qui propose des pseudos quand on tape « @ » (commentaires, invitation dans un post-it).
// Flèches pour choisir, Entrée ou clic pour insérer, Échap pour fermer. Les profils viennent de la base,
// filtrés par la RLS (étudiants connectés seulement).
export function ChampMention({
  name,
  id,
  placeholder,
  maxLength,
  defaultValue = "",
  className = "",
}: {
  name: string;
  id?: string;
  placeholder?: string;
  maxLength?: number;
  defaultValue?: string;
  className?: string;
}) {
  const [texte, setTexte] = useState(defaultValue);
  const [enCours, setEnCours] = useState<{ debut: number; prefixe: string; curseur: number } | null>(null);
  const [choix, setChoix] = useState<Personne[]>([]);
  const [actif, setActif] = useState(0);
  const champ = useRef<HTMLInputElement>(null);
  const liste = useId();

  // Cherche les pseudos qui commencent par ce qui est tapé (une lettre au moins), 150 ms après la frappe.
  useEffect(() => {
    if (!enCours || enCours.prefixe.length < 1) return;
    const t = window.setTimeout(async () => {
      const { data } = await createClient()
        .from("profils")
        .select("pseudo, prenom")
        .ilike("pseudo", `${enCours.prefixe.replace(/[%_]/g, "")}%`)
        .order("pseudo")
        .limit(5);
      setChoix((data ?? []) as Personne[]);
      setActif(0);
    }, 150);
    return () => window.clearTimeout(t);
  }, [enCours]);

  const ouvert = !!enCours && enCours.prefixe.length >= 1 && choix.length > 0;

  function suivre(valeur: string, curseur: number) {
    setTexte(valeur);
    const m = mentionEnCours(valeur, curseur);
    setEnCours(m ? { ...m, curseur } : null);
    if (!m) setChoix([]);
  }

  function inserer(pseudo: string) {
    if (!enCours) return;
    const r = insererMention(texte, enCours.debut, enCours.curseur, pseudo);
    setTexte(r.texte);
    setEnCours(null);
    setChoix([]);
    requestAnimationFrame(() => {
      champ.current?.focus();
      champ.current?.setSelectionRange(r.curseur, r.curseur);
    });
  }

  return (
    <span className="relative flex min-w-0 flex-1">
      <input
        ref={champ}
        id={id}
        name={name}
        value={texte}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={ouvert}
        aria-controls={liste}
        aria-autocomplete="list"
        onChange={(e) => suivre(e.target.value, e.target.selectionStart ?? e.target.value.length)}
        onKeyDown={(e) => {
          if (!ouvert) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActif((i) => (i + 1) % choix.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActif((i) => (i - 1 + choix.length) % choix.length);
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            inserer(choix[actif].pseudo);
          } else if (e.key === "Escape") {
            setEnCours(null);
          }
        }}
        onBlur={() => window.setTimeout(() => setEnCours(null), 150)}
        className={className}
      />
      {ouvert && (
        <ul id={liste} role="listbox" className="pop absolute bottom-full left-0 z-30 mb-1 flex w-64 flex-col overflow-hidden rounded-ui border border-encre bg-surface shadow-[3px_3px_0_0_var(--color-bandeau)]">
          {choix.map((p, i) => (
            <li key={p.pseudo} role="option" aria-selected={i === actif}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => inserer(p.pseudo)}
                className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm ${i === actif ? "bg-papier-fonce" : "hover:bg-papier-fonce"}`}
              >
                <strong>@{p.pseudo}</strong>
                <span className="truncate text-encre-douce">{p.prenom}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
