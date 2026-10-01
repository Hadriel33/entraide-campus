-- Gamification v2 : défi de la semaine, titres de spécialité, classement de la semaine.
-- Toujours calculé à partir des faits protégés : rien n'est stocké, rien n'est modifiable par l'utilisateur.

-- Rotation des défis : même ordre que DEFIS dans src/lib/gamification/defis.ts (semaine ISO modulo 4).
-- 0 croisement ESD × ESP (1) · 1 accepter 2 demandes (2) · 2 laisser 2 avis (2) · 3 publier une annonce (1)
create function public.objectif_defi(debut timestamptz) returns int language sql immutable set search_path = '' as $$
  select case (extract(week from debut)::int % 4) when 0 then 1 when 1 then 2 when 2 then 2 else 1 end;
$$;

create function public.progression_defi(cible uuid, debut timestamptz)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case (extract(week from debut)::int % 4)
    when 0 then (
      select count(*)::int from public.demandes_contact d
      join public.profils p1 on p1.id = d.demandeur_id
      join public.profils p2 on p2.id = d.destinataire_id
      where d.statut = 'acceptee' and cible in (d.demandeur_id, d.destinataire_id) and p1.ecole <> p2.ecole
        and d.repondu_le >= debut and d.repondu_le < debut + interval '7 days')
    when 1 then (
      select count(*)::int from public.demandes_contact
      where destinataire_id = cible and statut = 'acceptee' and repondu_le >= debut and repondu_le < debut + interval '7 days')
    when 2 then (
      select count(*)::int from public.avis
      where auteur_id = cible and cree_le >= debut and cree_le < debut + interval '7 days')
    else (
      select count(*)::int from public.annonces
      where auteur_id = cible and statut <> 'masquee' and cree_le >= debut and cree_le < debut + interval '7 days')
  end;
$$;
revoke execute on function public.progression_defi(uuid, timestamptz) from public, anon, authenticated;

create function public.defis_reussis(cible uuid, depuis timestamptz default '-infinity')
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from generate_series(date_trunc('week', now()) - interval '25 weeks', date_trunc('week', now()), interval '1 week') as s(semaine)
  where s.semaine >= date_trunc('week', greatest(depuis, '2000-01-01'::timestamptz))
    and public.progression_defi(cible, s.semaine) >= public.objectif_defi(s.semaine);
$$;
revoke execute on function public.defis_reussis(uuid, timestamptz) from public, anon, authenticated;

-- Défi de la semaine de l'utilisateur connecté (et seulement le sien).
create function public.mon_defi()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'progression', public.progression_defi((select auth.uid()), date_trunc('week', now())),
    'objectif', public.objectif_defi(date_trunc('week', now())),
    'fin', date_trunc('week', now()) + interval '7 days'
  );
$$;
revoke execute on function public.mon_defi() from public, anon;
grant execute on function public.mon_defi() to authenticated;

-- stats_profil v2 : période (pour le classement de la semaine), aides par catégorie (titres), défis réussis.
drop function public.stats_classement();
drop function public.stats_profil(uuid);

create function public.stats_profil(cible uuid, depuis timestamptz default '-infinity')
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with relations as (
    select a.categorie,
           case when d.demandeur_id = cible then d.destinataire_id else d.demandeur_id end as partenaire,
           (a.type = 'propose' and d.destinataire_id = cible) or (a.type = 'cherche' and d.demandeur_id = cible) as j_aide
    from public.demandes_contact d
    join public.annonces a on a.id = d.annonce_id
    where d.statut = 'acceptee' and cible in (d.demandeur_id, d.destinataire_id)
      and coalesce(d.repondu_le, d.cree_le) >= depuis
  )
  select json_build_object(
    'annonces', (select count(*) from public.annonces where auteur_id = cible and statut <> 'masquee' and cree_le >= depuis),
    'categories', (select count(distinct categorie) from public.annonces where auteur_id = cible and statut <> 'masquee' and cree_le >= depuis),
    'aides_donnees', (select count(distinct partenaire) from relations where j_aide),
    'aides_recues', (select count(distinct partenaire) from relations where not j_aide),
    'croisements', (
      select count(distinct r.partenaire) from relations r
      join public.profils moi on moi.id = cible
      join public.profils autre on autre.id = r.partenaire
      where moi.ecole <> autre.ecole
    ),
    'nb_avis', (select count(*) from public.avis where cible_id = cible and cree_le >= depuis),
    'note_moyenne', (select round(avg(note)::numeric, 1) from public.avis where cible_id = cible and cree_le >= depuis),
    'aides_par_categorie', (
      select coalesce(json_object_agg(categorie, n), '{}'::json)
      from (select categorie, count(distinct partenaire) as n from relations where j_aide group by categorie) t
    ),
    'defis_reussis', public.defis_reussis(cible, depuis)
  );
$$;
revoke execute on function public.stats_profil(uuid, timestamptz) from public, anon;
grant execute on function public.stats_profil(uuid, timestamptz) to authenticated;

create function public.stats_classement(depuis timestamptz default '-infinity')
returns table (id uuid, pseudo text, prenom text, ecole text, avatar_chemin text, stats json)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.pseudo, p.prenom, p.ecole, p.avatar_chemin, public.stats_profil(p.id, depuis)
  from public.profils p
  order by p.cree_le
  limit 500;
$$;
revoke execute on function public.stats_classement(timestamptz) from public, anon;
grant execute on function public.stats_classement(timestamptz) to authenticated;
