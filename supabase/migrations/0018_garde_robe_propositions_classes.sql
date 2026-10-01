-- 1. Garde-robe de Colette : tenues et motifs à débloquer en s'entraidant.
-- 2. Classes : liste officielle préremplie + un étudiant peut proposer la sienne (validée par un admin).

-- ---------- 1. Garde-robe ----------
alter table public.profils drop constraint if exists profils_colette_accessoire_check;
alter table public.profils add constraint profils_colette_accessoire_check check (colette_accessoire in (
  'aucun', 'photo', 'design', 'dev', 'data', 'coloc', 'covoit', 'casque', 'noel',
  'noeud', 'echarpe', 'cape', 'bde', 'etoile', 'couronne', 'diplome'
));
alter table public.profils add column colette_motif text not null default 'uni'
  check (colette_motif in ('uni', 'ligne', 'pois', 'quadrille', 'dore'));
grant update (colette_motif) on public.profils to authenticated;

-- Conditions de déblocage, calculées depuis les statistiques réelles (les mêmes que src/lib/profils/garde-robe.ts).
create function public.objet_colette_debloque(s json, objet text)
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
    else true
  end;
$$;
revoke execute on function public.objet_colette_debloque(json, text) from public, anon;
grant execute on function public.objet_colette_debloque(json, text) to authenticated;

-- La base refuse un objet pas encore débloqué, même en appelant l'API directement.
create function public.verifier_garde_robe()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s json;
begin
  if new.colette_accessoire is distinct from old.colette_accessoire or new.colette_motif is distinct from old.colette_motif then
    s := public.stats_profil(new.id);
    if not public.objet_colette_debloque(s, new.colette_accessoire) or not public.objet_colette_debloque(s, new.colette_motif) then
      raise exception 'Cet objet n''est pas encore débloqué' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.verifier_garde_robe() from public, anon, authenticated;
create trigger profils_verifier_garde_robe
  before update of colette_accessoire, colette_motif on public.profils
  for each row execute function public.verifier_garde_robe();

-- ---------- 2. Propositions de classes ----------
-- Les intitulés officiels dépassent parfois 40 caractères.
alter table public.classes drop constraint classes_nom_check;
alter table public.classes add constraint classes_nom_check check (char_length(btrim(nom)) between 2 and 60);

alter table public.classes
  add column validee boolean not null default true,
  add column proposee_par uuid references public.profils(id) on delete set null;

drop policy "classes_lecture_connectes" on public.classes;
create policy "classes_lecture"
  on public.classes for select
  to authenticated
  using (validee or proposee_par = (select auth.uid()) or (select public.est_admin()));

-- Un étudiant propose une classe de SON école ; elle reste invisible des autres tant qu'un admin ne l'a pas validée.
create policy "classes_proposition_etudiant"
  on public.classes for insert
  to authenticated
  with check (
    validee = false
    and proposee_par = (select auth.uid())
    and ecole = (select p.ecole from public.profils p where p.id = (select auth.uid()))
  );

-- Anti-spam : 3 propositions par jour au plus.
create function public.limiter_propositions_classes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.validee and (select count(*) from public.classes c where c.proposee_par = new.proposee_par and c.cree_le > now() - interval '24 hours') >= 3 then
    raise exception 'Limite atteinte : 3 propositions de classe par jour.' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
revoke execute on function public.limiter_propositions_classes() from public, anon, authenticated;
create trigger classes_limite before insert on public.classes for each row execute function public.limiter_propositions_classes();

-- Liste préremplie depuis les programmes publics de l'ESD et de l'ESP Bordeaux (rentrée 2026).
-- À corriger par un admin si un intitulé ne correspond pas (onglet Admin > Classes).
insert into public.classes (ecole, nom) values
  ('ESD', 'Bachelor 1'), ('ESD', 'Bachelor 2'),
  ('ESD', 'B3 Marketing digital & IA'), ('ESD', 'B3 Cycle intensif'),
  ('ESD', 'M1 Design & Creative Technologies'), ('ESD', 'M2 Design & Creative Technologies'),
  ('ESD', 'M1 Vidéo & Digital Contents'), ('ESD', 'M2 Vidéo & Digital Contents'),
  ('ESD', 'M1 Business Developer & E-commerce'), ('ESD', 'M2 Business Developer & E-commerce'),
  ('ESD', 'M1 Création digitale & Design d''interface'), ('ESD', 'M2 Création digitale & Design d''interface'),
  ('ESD', 'M1 Data Marketing & IA'), ('ESD', 'M2 Data Marketing & IA'),
  ('ESD', 'M1 UX & UI'), ('ESD', 'M2 UX & UI'),
  ('ESP', 'B1 Communication & Publicité'), ('ESP', 'B2 Communication & Publicité'),
  ('ESP', 'B3 Communication & Marketing'), ('ESP', 'B3 Marketing digital & IA'), ('ESP', 'B3 Événementiel'),
  ('ESP', 'B3 International marketing & communication'), ('ESP', 'B3 Création publicitaire'), ('ESP', 'B3 Cycle intensif'),
  ('ESP', 'M1 Stratégie de marque & Brand content'), ('ESP', 'M2 Stratégie de marque & Brand content'),
  ('ESP', 'M1 Direction artistique & Digital design'), ('ESP', 'M2 Direction artistique & Digital design'),
  ('ESP', 'M1 Marketing de l''influence & événementiel'), ('ESP', 'M2 Marketing de l''influence & événementiel'),
  ('ESP', 'M1 Stratégie média & activation digitale'), ('ESP', 'M2 Stratégie média & activation digitale'),
  ('ESP', 'M1 Marketing de l''entertainment'), ('ESP', 'M2 Marketing de l''entertainment'),
  ('ESP', 'M1 Business Developer & E-commerce'), ('ESP', 'M2 Business Developer & E-commerce')
on conflict (ecole, nom) do nothing;
