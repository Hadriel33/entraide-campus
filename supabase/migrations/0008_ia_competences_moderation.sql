-- Étapes 6 et 7 : compétences (IA n°1) et modération IA des annonces (IA n°2).

-- 1. Compétences validées par l'étudiant (l'IA propose, lui seul enregistre).
alter table public.profils
  add column competences text[] not null default '{}'
  check (cardinality(competences) <= 15 and char_length(array_to_string(competences, '|')) <= 700);

grant update (competences) on public.profils to authenticated;

-- 2. Modération IA : résultat écrit UNIQUEMENT par le serveur (clé secrète = rôle service_role) ou par un admin.
alter table public.annonces
  add column moderation text not null default 'en_attente' check (moderation in ('en_attente', 'ok', 'a_verifier', 'refus_probable')),
  add column moderation_raisons text[] not null default '{}' check (cardinality(moderation_raisons) <= 5),
  add column modere_le timestamptz;

create index annonces_moderation_idx on public.annonces (moderation) where moderation <> 'ok';

grant update (moderation, moderation_raisons, modere_le) on public.annonces to authenticated;

-- Un étudiant ne peut jamais valider sa propre annonce :
-- à la création, et à chaque modification du texte, elle repasse « en attente » ;
-- toucher directement aux colonnes de modération est refusé (sauf admin ou serveur).
create function public.annonces_garde_ia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role' or public.est_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.moderation := 'en_attente';
    new.moderation_raisons := '{}';
    new.modere_le := null;
    return new;
  end if;
  if (new.moderation, new.moderation_raisons, new.modere_le) is distinct from (old.moderation, old.moderation_raisons, old.modere_le) then
    raise exception 'Seule la modération peut changer ce statut' using errcode = '42501';
  end if;
  if (new.titre, new.description, new.lieu) is distinct from (old.titre, old.description, old.lieu) then
    new.moderation := 'en_attente';
    new.moderation_raisons := '{}';
    new.modere_le := null;
  end if;
  return new;
end;
$$;

create trigger annonces_garde_ia
  before insert or update on public.annonces
  for each row execute function public.annonces_garde_ia();

-- Le serveur (IA) peut masquer une annonce en « refus probable » en attendant l'admin.
create or replace function public.annonces_garde_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (old.statut = 'masquee' or new.statut = 'masquee')
     and old.statut is distinct from new.statut
     and not public.est_admin()
     and (select auth.role()) <> 'service_role' then
    raise exception 'Seul un admin peut masquer ou rétablir une annonce' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- File de l'admin : chiffre ajouté au tableau de bord.
create or replace function public.stats_admin()
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
    'signalements_ouverts', (select count(*) from public.signalements where statut = 'ouvert'),
    'a_moderer', (select count(*) from public.annonces where moderation <> 'ok')
  );
end;
$$;
