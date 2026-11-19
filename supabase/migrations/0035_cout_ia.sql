-- 0035 (19/11/2026) : le coût des IA, avec un plafond total réglable par l'admin (retour de test de Hadriel).
-- Chaque appel d'IA est noté par le serveur (tokens et coût estimé) ; avant chaque appel, le serveur vérifie que
-- le total reste sous le plafond. Au-delà, les IA s'arrêtent et l'appli bascule sur ses secours
-- (relecture humaine, tri par règles).
--
-- Aucune règle RLS existante n'est modifiée : deux NOUVELLES tables.
--   ia_usages   : lecture réservée à l'admin ; écriture par le serveur seulement (clé secrète, jamais côté client).
--                 Un étudiant ne peut ni lire la dépense ni ajouter de fausses lignes pour épuiser le plafond.
--   ia_reglages : une seule ligne (le plafond) ; lecture et modification réservées à l'admin.

create table public.ia_usages (
  id bigint generated always as identity primary key,
  ia text not null check (ia in ('cv', 'moderation', 'redaction', 'tri')),
  modele text not null check (char_length(modele) <= 80),
  tokens_entree integer not null default 0 check (tokens_entree >= 0),
  tokens_sortie integer not null default 0 check (tokens_sortie >= 0),
  cout_eur numeric(12, 6) not null default 0 check (cout_eur >= 0),
  cree_le timestamptz not null default now()
);
create index ia_usages_date_idx on public.ia_usages (cree_le desc);

alter table public.ia_usages enable row level security;
create policy "ia_usages_lecture_admin" on public.ia_usages for select to authenticated using (public.est_admin());
revoke all on public.ia_usages from anon, authenticated;
grant select on public.ia_usages to authenticated;

create table public.ia_reglages (
  id boolean primary key default true check (id), -- une seule ligne
  plafond_eur numeric(10, 2) not null default 5 check (plafond_eur >= 0 and plafond_eur <= 1000),
  maj_le timestamptz not null default now()
);
insert into public.ia_reglages default values;

alter table public.ia_reglages enable row level security;
create policy "ia_reglages_lecture_admin" on public.ia_reglages for select to authenticated using (public.est_admin());
create policy "ia_reglages_modif_admin" on public.ia_reglages for update to authenticated
  using (public.est_admin()) with check (public.est_admin());
revoke all on public.ia_reglages from anon, authenticated;
grant select on public.ia_reglages to authenticated;
grant update (plafond_eur, maj_le) on public.ia_reglages to authenticated;
