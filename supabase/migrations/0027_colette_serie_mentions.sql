-- 0027 (28/10/2026) : donner envie de revenir.
-- 1. Garde-robe de Colette : 4 tenues et 2 motifs de plus (mêmes listes que src/lib/profils/colette.ts).
-- 2. Série : nombre de semaines d'affilée où j'ai participé (publier, commenter, réagir, écrire dans un salon, s'entraider).
-- 3. stats_profil : + commentaires, réactions reçues, série (pour débloquer les nouvelles pièces).
-- 4. @mentions : « @pseudo » dans un commentaire prévient la personne (sur un post visible de tous seulement).
-- Aucune policy RLS n'est modifiée.

-- ---------- 1. Garde-robe ----------
alter table public.profils drop constraint profils_colette_accessoire_check;
alter table public.profils add constraint profils_colette_accessoire_check check (colette_accessoire in (
  'aucun', 'photo', 'design', 'dev', 'data', 'coloc', 'covoit', 'casque', 'noel',
  'noeud', 'echarpe', 'cape', 'bde', 'etoile', 'couronne', 'diplome',
  'fleur', 'micro', 'lunettes_coeur', 'flamme'
));
alter table public.profils drop constraint profils_colette_motif_check;
alter table public.profils add constraint profils_colette_motif_check check (colette_motif in (
  'uni', 'ligne', 'pois', 'quadrille', 'dore', 'mariniere', 'etoiles'
));

-- ---------- 2. Série de semaines ----------
-- Semaines (lundi) où j'ai participé, de la plus récente à la plus ancienne. La série compte les semaines
-- consécutives depuis la plus récente, à condition que celle-ci soit cette semaine ou la précédente
-- (on a jusqu'à dimanche soir pour garder sa série).
create function public.serie_semaines(cible uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with semaines as (
    select distinct date_trunc('week', quand) as s
    from (
      select cree_le as quand from public.annonces where auteur_id = cible
      union all select cree_le from public.commentaires where auteur_id = cible
      union all select cree_le from public.reactions where auteur_id = cible
      union all select cree_le from public.salon_messages where auteur_id = cible
      union all select coalesce(repondu_le, cree_le) from public.demandes_contact
        where statut = 'acceptee' and cible in (demandeur_id, destinataire_id)
    ) t
    where quand > now() - interval '1 year'
  ),
  numerotees as (
    select s, row_number() over (order by s desc) as rn from semaines
  )
  select case
    when (select max(s) from semaines) is null
      or (select max(s) from semaines) < date_trunc('week', now()) - interval '1 week' then 0
    else (
      select count(*)::int from numerotees
      where s = (select max(s) from semaines) - (rn - 1) * interval '1 week'
    )
  end;
$$;
revoke execute on function public.serie_semaines(uuid) from public, anon;
grant execute on function public.serie_semaines(uuid) to authenticated;

-- ---------- 3. Statistiques ----------
-- Même signature et mêmes clés qu'en 0024, plus trois clés.
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
    'defis_reussis', public.defis_reussis(cible, depuis),
    'commentaires', (select count(*) from public.commentaires where auteur_id = cible and cree_le >= depuis),
    'reactions_recues', (
      (select count(*) from public.reactions r join public.annonces a on a.id = r.cible_id
        where r.cible_type = 'annonce' and a.auteur_id = cible and r.auteur_id <> cible and r.cree_le >= depuis)
      + (select count(*) from public.reactions r join public.demandes_contact d on d.id = r.cible_id
        where r.cible_type = 'entraide' and cible in (d.demandeur_id, d.destinataire_id) and r.auteur_id <> cible and r.cree_le >= depuis)
    ),
    'serie', public.serie_semaines(cible)
  );
$$;

-- Conditions de déblocage (les mêmes que src/lib/profils/colette.ts).
create or replace function public.objet_colette_debloque(s json, objet text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case objet
    when 'noeud' then coalesce((s->>'annonces')::int, 0) >= 1
    when 'echarpe' then coalesce((s->>'nb_avis')::int, 0) >= 1
    when 'pois' then coalesce((s->>'aides_recues')::int, 0) >= 1
    when 'bde' then coalesce((s->>'croisements')::int, 0) >= 1
    when 'etoile' then coalesce((s->>'defis_reussis')::int, 0) >= 1
    when 'cape' then coalesce((s->>'aides_donnees')::int, 0) >= 3
    when 'quadrille' then coalesce((s->>'categories')::int, 0) >= 3
    when 'couronne' then coalesce((s->>'nb_avis')::int, 0) >= 3 and coalesce((s->>'note_moyenne')::numeric, 0) >= 4.5
    when 'diplome' then coalesce((s->>'aides_donnees')::int, 0) >= 10
    when 'dore' then coalesce((s->>'aides_donnees')::int, 0) >= 10
    when 'micro' then coalesce((s->>'commentaires')::int, 0) >= 3
    when 'lunettes_coeur' then coalesce((s->>'reactions_recues')::int, 0) >= 5
    when 'flamme' then coalesce((s->>'serie')::int, 0) >= 3
    when 'etoiles' then coalesce((s->>'serie')::int, 0) >= 2
    else true
  end;
$$;

-- ---------- 4. @mentions ----------
-- Même format de pseudo que la base (0003) et que src/lib/social/mentions.ts ; 5 personnes au plus.
-- Pas sur un post caché (annonce en attente de vérification) : on ne révèle pas un post qu'on ne peut pas lire.
-- L'auteur du post est déjà prévenu par notifier_commentaire : pas de double notification.
create function public.notifier_mentions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dest uuid;
  v_lien text := case new.cible_type when 'annonce' then '/annonces/' || new.cible_id || '#commentaires' else '/fil#e-' || new.cible_id end;
begin
  if new.cible_type = 'annonce' and not exists (
    select 1 from public.annonces a where a.id = new.cible_id and a.statut = 'publiee' and a.moderation <> 'a_verifier'
  ) then
    return new;
  end if;
  for v_dest in
    select p.id from public.profils p
    where p.pseudo in (
        select lower(m[1])
        from regexp_matches(new.contenu, '(?:^|[^a-zA-Z0-9._@])@([a-zA-Z0-9_][a-zA-Z0-9._]{1,18}[a-zA-Z0-9_])', 'g') as m
        limit 5
      )
      and p.id <> new.auteur_id
      and not (p.id = any (coalesce(public.proprietaires_cible(new.cible_type, new.cible_id), '{}')))
  loop
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (v_dest, 'commentaire', left('@' || public.pseudo_de(new.auteur_id) || ' t''a mentionné : « ' || left(new.contenu, 80) || ' »', 200), v_lien);
  end loop;
  return new;
end;
$$;
revoke execute on function public.notifier_mentions() from public, anon, authenticated;
create trigger commentaires_mentions after insert on public.commentaires
  for each row execute function public.notifier_mentions();
