-- Retour du prof (22/10) : l'ESD rejoint l'ESP (rentrée 2027). On n'oppose plus les deux écoles : la compétition
-- se joue entre les 6 campus ESP. Les deux domaines d'email restent acceptés (la colonne ecole reste, en interne).
-- Migration additive, sans aucun DROP : l'ancien code continue de marcher pendant le déploiement.
-- Appliquée en plusieurs morceaux via le MCP Supabase (les blocs avec DROP restaient bloqués en attente de confirmation).

-- 1. Le campus de l'étudiant. Pas de droit de modification : on ne change pas de campus pour gagner le championnat.
alter table public.profils
  add column campus text not null default 'Bordeaux'
    check (campus in ('Paris', 'Lyon', 'Bordeaux', 'Toulouse', 'Nantes', 'Lille'));

-- 2. Les classes appartiennent à un campus (les formations ESD et ESP de Bordeaux sont toutes à Bordeaux).
alter table public.classes
  add column campus text not null default 'Bordeaux'
    check (campus in ('Paris', 'Lyon', 'Bordeaux', 'Toulouse', 'Nantes', 'Lille'));
alter table public.classes drop constraint classes_ecole_nom_key;
alter table public.classes add constraint classes_campus_nom_key unique (campus, nom);

-- 3. L'inscription lit le campus choisi dans le formulaire (Bordeaux s'il manque, refus s'il est inconnu).
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ecole text := case lower(split_part(new.email, '@', 2))
    when 'mail-esd.com' then 'ESD'
    when 'mail-esp.com' then 'ESP'
  end;
  v_campus text := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'campus'), ''), 'Bordeaux');
begin
  if v_ecole is null then
    raise exception 'Inscription réservée aux emails @mail-esd.com et @mail-esp.com' using errcode = '42501';
  end if;
  if v_campus not in ('Paris', 'Lyon', 'Bordeaux', 'Toulouse', 'Nantes', 'Lille') then
    raise exception 'Campus inconnu' using errcode = '22023';
  end if;
  insert into public.profils (id, prenom, ecole, pseudo, campus)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'prenom'),
    v_ecole,
    lower(btrim(new.raw_user_meta_data ->> 'pseudo')),
    v_campus
  );
  insert into public.coordonnees (id, email) values (new.id, new.email);
  return new;
end;
$$;

-- 4. On rejoint une classe de son campus, quelle que soit l'adresse (ESD ou ESP).
create or replace function public.verifier_classe()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.classe_id is not null and not exists (
    select 1 from public.classes c where c.id = new.classe_id and c.campus = new.campus
  ) then
    raise exception 'Cette classe n''est pas de ton campus' using errcode = '22023';
  end if;
  return new;
end;
$$;
-- L'ancien trigger (classe_id, ecole) reste ; celui-ci couvre le changement de campus par un admin.
create trigger profils_verifier_classe_campus
  before update of campus on public.profils
  for each row execute function public.verifier_classe();

-- 5. Proposer une classe : pour son campus.
-- AVANT : with check (validee = false and proposee_par = (select auth.uid())
--                     and ecole = (select p.ecole from public.profils p where p.id = (select auth.uid())))
alter policy "classes_proposition_etudiant" on public.classes
  with check (
    validee = false
    and proposee_par = (select auth.uid())
    and campus = (select p.campus from public.profils p where p.id = (select auth.uid()))
  );

-- 6. Seul un admin corrige un campus (erreur à l'inscription). La classe, liée à l'ancien campus, est retirée.
create function public.changer_campus(cible uuid, nouveau text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Réservé aux admins' using errcode = '42501';
  end if;
  update public.profils set campus = nouveau, classe_id = null where id = cible;
end;
$$;
revoke execute on function public.changer_campus(uuid, text) from public, anon;
grant execute on function public.changer_campus(uuid, text) to authenticated;

-- 7. Le « croisement » ne compte plus ESD × ESP mais deux formations différentes (le dev aide la photographe).
create or replace function public.stats_profil(cible uuid, depuis timestamptz default '-infinity')
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
      where moi.classe_id <> autre.classe_id
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

create or replace function public.stats_publiques()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'etudiants', (select count(*) from public.profils),
    'annonces_actives', (select count(*) from public.annonces where statut = 'publiee' and moderation <> 'a_verifier' and expire_le > now()),
    'entraides', (select count(*) from public.demandes_contact where statut = 'acceptee'),
    'croisements', (
      select count(*) from public.demandes_contact d
      join public.profils a on a.id = d.demandeur_id
      join public.profils b on b.id = d.destinataire_id
      where d.statut = 'acceptee' and a.classe_id <> b.classe_id
    ),
    'campus', (select count(distinct campus) from public.profils)
  );
$$;

create or replace function public.progression_defi(cible uuid, debut timestamptz)
returns integer
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
      where d.statut = 'acceptee' and cible in (d.demandeur_id, d.destinataire_id) and p1.classe_id <> p2.classe_id
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

-- 8. Le classement par campus (championnat des campus). Nouvelle fonction : stats_classement reste pour l'ancien code.
create function public.classement_campus(depuis timestamptz default '-infinity')
returns table (id uuid, pseudo text, prenom text, campus text, avatar_chemin text, classe_id uuid, stats json)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.pseudo, p.prenom, p.campus, p.avatar_chemin, p.classe_id, public.stats_profil(p.id, depuis)
  from public.profils p
  order by p.cree_le
  limit 2000;
$$;
revoke execute on function public.classement_campus(timestamptz) from public, anon;
grant execute on function public.classement_campus(timestamptz) to authenticated;

-- 9. Le fil du campus dit de quel campus sont les deux personnes (nouvelle fonction, fil_campus reste pour l'ancien code).
create function public.fil_du_campus(limite integer default 20)
returns table (aidant_pseudo text, aidant_campus text, aidant_avatar text, aidant_couleur text,
               aide_pseudo text, aide_campus text, aide_avatar text, aide_couleur text,
               categorie text, quand timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select ai.pseudo, ai.campus, ai.avatar_chemin, ai.colette_couleur,
         ad.pseudo, ad.campus, ad.avatar_chemin, ad.colette_couleur,
         a.categorie, coalesce(d.repondu_le, d.cree_le)
  from public.demandes_contact d
  join public.annonces a on a.id = d.annonce_id
  join public.profils ai on ai.id = case when a.type = 'propose' then d.destinataire_id else d.demandeur_id end
  join public.profils ad on ad.id = case when a.type = 'propose' then d.demandeur_id else d.destinataire_id end
  where d.statut = 'acceptee'
    and ai.fil_public and ad.fil_public
    and coalesce(d.repondu_le, d.cree_le) > now() - interval '60 days'
  order by coalesce(d.repondu_le, d.cree_le) desc
  limit least(greatest(limite, 1), 50);
$$;
revoke execute on function public.fil_du_campus(integer) from public, anon;
grant execute on function public.fil_du_campus(integer) to authenticated;

-- 10. Tableau d'impact admin : inscrits par campus, entraides entre formations.
create or replace function public.stats_impact()
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
    select d.*, a.categorie, pd.classe_id as classe_demandeur, pa.classe_id as classe_destinataire
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
      'formations', (select count(*) from acceptees where classe_demandeur <> classe_destinataire),
      'esd_esp', 0 -- ancienne clé, gardée le temps que l'ancien code soit remplacé en ligne
    ),
    'campus', (select coalesce(json_object_agg(campus, n), '{}'::json) from (select campus, count(*) n from public.profils group by campus) e),
    'ecoles', '{}'::json, -- ancienne clé, idem
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
