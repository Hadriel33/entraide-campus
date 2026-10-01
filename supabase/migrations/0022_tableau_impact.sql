-- Tableau de bord d'impact (admin) : l'entonnoir de l'entraide, les délais, le croisement ESD × ESP,
-- l'offre et la demande par catégorie, l'activité sur 30 jours et l'état de la modération IA.
-- Uniquement des agrégats (aucun nom, aucun message), et seulement pour un admin.

create function public.stats_impact()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resultat json;
begin
  if not public.est_admin() then
    raise exception 'Réservé aux admins' using errcode = '42501';
  end if;

  with acceptees as (
    select d.*, a.categorie, pd.ecole as ecole_demandeur, pa.ecole as ecole_destinataire
    from public.demandes_contact d
    join public.annonces a on a.id = d.annonce_id
    join public.profils pd on pd.id = d.demandeur_id
    join public.profils pa on pa.id = d.destinataire_id
    where d.statut = 'acceptee'
  ),
  repondues as (
    select extract(epoch from (repondu_le - cree_le)) / 3600.0 as heures, statut
    from public.demandes_contact
    where statut in ('acceptee', 'refusee') and repondu_le is not null
  ),
  jours as (
    select generate_series(current_date - 29, current_date, interval '1 day')::date as jour
  )
  select json_build_object(
    'entonnoir', json_build_object(
      'inscrits', (select count(*) from public.profils),
      'ont_publie', (select count(distinct auteur_id) from public.annonces),
      'ont_demande', (select count(distinct demandeur_id) from public.demandes_contact),
      'en_relation', (select count(distinct x) from (select demandeur_id as x from acceptees union select destinataire_id from acceptees) t),
      'ont_note', (select count(distinct auteur_id) from public.avis)
    ),
    'demandes', json_build_object(
      'total', (select count(*) from public.demandes_contact),
      'acceptees', (select count(*) from public.demandes_contact where statut = 'acceptee'),
      'refusees', (select count(*) from public.demandes_contact where statut = 'refusee'),
      'en_attente', (select count(*) from public.demandes_contact where statut = 'en_attente'),
      'delai_median_heures', (select round((percentile_cont(0.5) within group (order by heures))::numeric, 1) from repondues)
    ),
    'croisement', json_build_object(
      'entraides', (select count(*) from acceptees),
      'esd_esp', (select count(*) from acceptees where ecole_demandeur <> ecole_destinataire)
    ),
    'ecoles', (select coalesce(json_object_agg(ecole, n), '{}'::json) from (select ecole, count(*) n from public.profils group by ecole) e),
    'categories', (
      select coalesce(json_agg(json_build_object('categorie', categorie, 'offres', offres, 'demandes', demandes, 'entraides', entraides) order by offres + demandes desc), '[]'::json)
      from (
        select a.categorie,
               count(*) filter (where a.type = 'propose') as offres,
               count(*) filter (where a.type = 'cherche') as demandes,
               (select count(*) from acceptees x where x.categorie = a.categorie) as entraides
        from public.annonces a
        where a.statut = 'publiee' and a.expire_le > now()
        group by a.categorie
      ) c
    ),
    'activite', (
      select json_agg(json_build_object(
        'jour', j.jour,
        'inscriptions', (select count(*) from public.profils p where p.cree_le::date = j.jour),
        'annonces', (select count(*) from public.annonces a where a.cree_le::date = j.jour),
        'entraides', (select count(*) from public.demandes_contact d where d.statut = 'acceptee' and coalesce(d.repondu_le, d.cree_le)::date = j.jour)
      ) order by j.jour)
      from jours j
    ),
    'moderation', (
      select json_build_object(
        'ok', count(*) filter (where moderation = 'ok'),
        'a_verifier', count(*) filter (where moderation = 'a_verifier'),
        'refus_probable', count(*) filter (where moderation = 'refus_probable'),
        'en_attente', count(*) filter (where moderation = 'en_attente'),
        'corrections_proposees', count(*) filter (where moderation_suggestion is not null)
      )
      from public.annonces
    )
  ) into resultat;
  return resultat;
end;
$$;
revoke execute on function public.stats_impact() from public, anon;
grant execute on function public.stats_impact() to authenticated;
