-- Étape 4 : annonces.
-- Règle d'accès (en français) : tout étudiant connecté lit les annonces publiées ; l'auteur voit aussi
-- ses annonces archivées ; seul l'auteur crée en son nom, modifie, archive et supprime (règle d'or n°2).
-- Les listes autorisées sont les mêmes que dans src/lib/annonces/validation.ts.

create table public.annonces (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  type text not null check (type in ('propose', 'cherche')),
  categorie text not null check (categorie in (
    'photo', 'video', 'design', 'ux_ui', 'dev', 'data_ia', 'redaction',
    'coloc', 'covoiturage', 'materiel', 'binome', 'shooting', 'coup_de_main'
  )),
  titre text not null check (char_length(btrim(titre)) between 5 and 80),
  description text not null check (char_length(btrim(description)) between 20 and 1000),
  contrepartie text not null check (contrepartie in ('gratuit', 'troc', 'partage_frais', 'remunere', 'a_discuter')),
  lieu text check (lieu is null or char_length(lieu) <= 80),
  statut text not null default 'publiee' check (statut in ('publiee', 'archivee')),
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create index annonces_auteur_idx on public.annonces (auteur_id);
create index annonces_liste_idx on public.annonces (statut, cree_le desc);

alter table public.annonces enable row level security;

create policy "annonces_lecture"
  on public.annonces for select
  to authenticated
  using (statut = 'publiee' or (select auth.uid()) = auteur_id);

create policy "annonces_creation_par_soi"
  on public.annonces for insert
  to authenticated
  with check ((select auth.uid()) = auteur_id);

create policy "annonces_modification_auteur"
  on public.annonces for update
  to authenticated
  using ((select auth.uid()) = auteur_id)
  with check ((select auth.uid()) = auteur_id);

create policy "annonces_suppression_auteur"
  on public.annonces for delete
  to authenticated
  using ((select auth.uid()) = auteur_id);

-- On ne change jamais l'auteur ni les dates à la main.
revoke update on public.annonces from authenticated, anon;
grant update (type, categorie, titre, description, contrepartie, lieu, statut) on public.annonces to authenticated;

create function public.annonces_maj_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

create trigger annonces_avant_modification
  before update on public.annonces
  for each row execute function public.annonces_maj_date();
