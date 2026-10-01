-- Modèle de migration : une table + sa RLS dans le même fichier (tiré de 0001_profils.sql).
-- Remplacer <table>, <colonnes> et adapter les policies à la règle d'accès écrite en français.
-- Règle d'accès (en français, AVANT le SQL) : « Tout étudiant connecté lit. Seul l'auteur modifie et supprime. »

create table public.<table> (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  -- <colonnes> avec des contraintes check (longueurs, valeurs autorisées)
  cree_le timestamptz not null default now()
);

alter table public.<table> enable row level security;

create policy "<table>_lecture_connectes" on public.<table>
  for select to authenticated using (true); -- justifier en commentaire si using (true)

create policy "<table>_creation_par_soi" on public.<table>
  for insert to authenticated with check ((select auth.uid()) = auteur_id);

create policy "<table>_modification_auteur" on public.<table>
  for update to authenticated
  using ((select auth.uid()) = auteur_id)
  with check ((select auth.uid()) = auteur_id);

create policy "<table>_suppression_auteur" on public.<table>
  for delete to authenticated using ((select auth.uid()) = auteur_id);

-- Colonnes sensibles (statut de modération, compteurs...) : révoquer la modification.
-- revoke update (statut) on public.<table> from authenticated;

create index on public.<table> (auteur_id);
