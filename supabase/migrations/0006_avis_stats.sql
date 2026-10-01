-- Gamification : avis après une mise en relation acceptée, et statistiques calculées (jamais stockées).

create table public.avis (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes_contact (id) on delete cascade,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  cible_id uuid not null references public.profils (id) on delete cascade,
  note int not null check (note between 1 and 5),
  commentaire text check (commentaire is null or char_length(commentaire) <= 300),
  cree_le timestamptz not null default now(),
  unique (demande_id, auteur_id),
  check (auteur_id <> cible_id)
);

create index avis_cible_idx on public.avis (cible_id);

-- Un avis n'existe que pour une mise en relation ACCEPTÉE dont je fais partie ; la cible est l'autre personne.
create function public.avis_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_demandeur uuid;
  v_destinataire uuid;
  v_statut text;
begin
  select demandeur_id, destinataire_id, statut into v_demandeur, v_destinataire, v_statut
  from public.demandes_contact where id = new.demande_id;
  new.auteur_id := (select auth.uid());
  if v_statut is distinct from 'acceptee' or new.auteur_id not in (v_demandeur, v_destinataire) then
    raise exception 'Un avis n''est possible qu''après une mise en relation acceptée' using errcode = '42501';
  end if;
  new.cible_id := case when new.auteur_id = v_demandeur then v_destinataire else v_demandeur end;
  new.cree_le := now();
  return new;
end;
$$;

create trigger avis_avant_insertion
  before insert on public.avis
  for each row execute function public.avis_avant_insertion();

alter table public.avis enable row level security;

create policy "avis_lecture_connectes" on public.avis for select to authenticated using (true); -- avis publics, comme sur Google
create policy "avis_creation_par_soi" on public.avis for insert to authenticated with check ((select auth.uid()) = auteur_id);
create policy "avis_suppression_auteur_ou_admin" on public.avis for delete to authenticated
  using ((select auth.uid()) = auteur_id or public.est_admin());

-- Faits bruts d'un profil. Les points, niveaux et badges sont calculés côté appli (src/lib/gamification).
-- Anti-triche : on compte des PERSONNES différentes aidées, pas des demandes (deux amis ne peuvent pas farmer).
create function public.stats_profil(cible uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with relations as (
    select d.demandeur_id, d.destinataire_id, a.type,
           case when d.demandeur_id = cible then d.destinataire_id else d.demandeur_id end as partenaire,
           (a.type = 'propose' and d.destinataire_id = cible) or (a.type = 'cherche' and d.demandeur_id = cible) as j_aide
    from public.demandes_contact d
    join public.annonces a on a.id = d.annonce_id
    where d.statut = 'acceptee' and cible in (d.demandeur_id, d.destinataire_id)
  )
  select json_build_object(
    'annonces', (select count(*) from public.annonces where auteur_id = cible and statut <> 'masquee'),
    'categories', (select count(distinct categorie) from public.annonces where auteur_id = cible and statut <> 'masquee'),
    'aides_donnees', (select count(distinct partenaire) from relations where j_aide),
    'aides_recues', (select count(distinct partenaire) from relations where not j_aide),
    'croisements', (
      select count(distinct r.partenaire) from relations r
      join public.profils moi on moi.id = cible
      join public.profils autre on autre.id = r.partenaire
      where moi.ecole <> autre.ecole
    ),
    'nb_avis', (select count(*) from public.avis where cible_id = cible),
    'note_moyenne', (select round(avg(note)::numeric, 1) from public.avis where cible_id = cible)
  );
$$;

revoke execute on function public.stats_profil(uuid) from public, anon;
grant execute on function public.stats_profil(uuid) to authenticated;

-- Classement : les faits de tous les profils (aucune donnée de contact).
create function public.stats_classement()
returns table (id uuid, pseudo text, prenom text, ecole text, avatar_chemin text, stats json)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.pseudo, p.prenom, p.ecole, p.avatar_chemin, public.stats_profil(p.id)
  from public.profils p
  order by p.cree_le
  limit 500;
$$;

revoke execute on function public.stats_classement() from public, anon;
grant execute on function public.stats_classement() to authenticated;
