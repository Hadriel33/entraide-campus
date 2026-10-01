-- Modération : un admin masque ou supprime n'importe quelle annonce, et traite les signalements.

alter table public.annonces drop constraint annonces_statut_check;
alter table public.annonces add constraint annonces_statut_check check (statut in ('publiee', 'archivee', 'masquee'));

-- Un auteur ne peut ni masquer ni démasquer : c'est le rôle de l'admin.
create function public.annonces_garde_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (old.statut = 'masquee' or new.statut = 'masquee') and old.statut is distinct from new.statut and not public.est_admin() then
    raise exception 'Seul un admin peut masquer ou rétablir une annonce' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger annonces_garde_moderation
  before update on public.annonces
  for each row execute function public.annonces_garde_moderation();

create policy "annonces_lecture_admin" on public.annonces for select to authenticated using (public.est_admin());
create policy "annonces_modification_admin" on public.annonces for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "annonces_suppression_admin" on public.annonces for delete to authenticated using (public.est_admin());

-- Signalements : n'importe quel étudiant signale, seul un admin les lit et les traite.
create table public.signalements (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  motif text not null check (motif in ('arnaque', 'inapproprie', 'coordonnees', 'hors_sujet', 'autre')),
  details text check (details is null or char_length(details) <= 300),
  statut text not null default 'ouvert' check (statut in ('ouvert', 'traite')),
  cree_le timestamptz not null default now(),
  unique (annonce_id, auteur_id)
);

alter table public.signalements enable row level security;

create policy "signalements_creation_par_soi" on public.signalements for insert to authenticated
  with check ((select auth.uid()) = auteur_id and statut = 'ouvert');
create policy "signalements_lecture_admin_ou_auteur" on public.signalements for select to authenticated
  using (public.est_admin() or (select auth.uid()) = auteur_id);
create policy "signalements_traitement_admin" on public.signalements for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

revoke update on public.signalements from authenticated, anon;
grant update (statut) on public.signalements to authenticated;

-- Chiffres du tableau de bord admin.
create function public.stats_admin()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Réservé aux admins' using errcode = '42501';
  end if;
  return json_build_object(
    'etudiants', (select count(*) from public.profils),
    'annonces', (select count(*) from public.annonces where statut = 'publiee'),
    'mises_en_relation', (select count(*) from public.demandes_contact where statut = 'acceptee'),
    'signalements_ouverts', (select count(*) from public.signalements where statut = 'ouvert')
  );
end;
$$;

revoke execute on function public.stats_admin() from public, anon;
grant execute on function public.stats_admin() to authenticated;
