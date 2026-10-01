-- Lot « ce qui fait la différence » (01/10/2026) :
-- notifications en direct, favoris, quartier et tram, expiration des annonces, recherche, compteur d'impact.

-- =========================================================================
-- 1. Notifications : créées UNIQUEMENT par la base (triggers), lues seulement par leur destinataire.
-- =========================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  destinataire_id uuid not null references public.profils (id) on delete cascade,
  type text not null check (type in ('demande_recue', 'demande_acceptee', 'demande_refusee', 'message', 'avis', 'annonce_masquee', 'annonce_expire')),
  texte text not null check (char_length(texte) <= 200),
  lien text not null check (lien like '/%' and char_length(lien) <= 200), -- chemin interne uniquement
  lu boolean not null default false,
  cree_le timestamptz not null default now()
);

create index notifications_boite_idx on public.notifications (destinataire_id, lu, cree_le desc);

alter table public.notifications enable row level security;
create policy "notifications_lecture_soi" on public.notifications for select to authenticated using ((select auth.uid()) = destinataire_id);
create policy "notifications_marquer_lu_soi" on public.notifications for update to authenticated
  using ((select auth.uid()) = destinataire_id) with check ((select auth.uid()) = destinataire_id);
create policy "notifications_suppression_soi" on public.notifications for delete to authenticated using ((select auth.uid()) = destinataire_id);
revoke insert, update on public.notifications from authenticated, anon;
grant update (lu) on public.notifications to authenticated;

alter publication supabase_realtime add table public.notifications;

create function public.pseudo_de(p uuid) returns text language sql stable security definer set search_path = '' as $$
  select pseudo from public.profils where id = p;
$$;
revoke execute on function public.pseudo_de(uuid) from public, anon, authenticated;

create function public.notifier_demande()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titre text := (select titre from public.annonces where id = new.annonce_id);
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (new.destinataire_id, 'demande_recue', '@' || public.pseudo_de(new.demandeur_id) || ' veut te contacter pour « ' || left(v_titre, 60) || ' »', '/demandes');
  elsif new.statut = 'acceptee' and old.statut = 'en_attente' then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (new.demandeur_id, 'demande_acceptee', '@' || public.pseudo_de(new.destinataire_id) || ' a accepté ta demande : la discussion est ouverte', '/demandes/' || new.id);
  elsif new.statut = 'refusee' and old.statut = 'en_attente' then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (new.demandeur_id, 'demande_refusee', 'Ta demande pour « ' || left(v_titre, 60) || ' » n''a pas été retenue', '/demandes?onglet=envoyees');
  end if;
  return new;
end;
$$;
revoke execute on function public.notifier_demande() from public, anon, authenticated;
create trigger demandes_notifier after insert or update of statut on public.demandes_contact for each row execute function public.notifier_demande();

-- Un seul « nouveau message » non lu par conversation (pas de pluie de notifications).
create function public.notifier_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dest uuid;
  v_lien text := '/demandes/' || new.demande_id;
begin
  select case when demandeur_id = new.auteur_id then destinataire_id else demandeur_id end into v_dest
  from public.demandes_contact where id = new.demande_id;
  if not exists (select 1 from public.notifications where destinataire_id = v_dest and lien = v_lien and type = 'message' and not lu) then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (v_dest, 'message', '@' || public.pseudo_de(new.auteur_id) || ' t''a écrit', v_lien);
  end if;
  return new;
end;
$$;
revoke execute on function public.notifier_message() from public, anon, authenticated;
create trigger messages_notifier after insert on public.messages for each row execute function public.notifier_message();

create function public.notifier_avis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (destinataire_id, type, texte, lien)
  values (new.cible_id, 'avis', '@' || public.pseudo_de(new.auteur_id) || ' t''a laissé un avis (' || new.note || '/5)', '/profils/' || public.pseudo_de(new.cible_id));
  return new;
end;
$$;
revoke execute on function public.notifier_avis() from public, anon, authenticated;
create trigger avis_notifier after insert on public.avis for each row execute function public.notifier_avis();

create function public.notifier_masquage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.statut = 'masquee' and old.statut is distinct from 'masquee' then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (new.auteur_id, 'annonce_masquee', 'Ton annonce « ' || left(new.titre, 60) || ' » est en attente de vérification', '/annonces/' || new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.notifier_masquage() from public, anon, authenticated;
create trigger annonces_notifier_masquage after update of statut on public.annonces for each row execute function public.notifier_masquage();

-- =========================================================================
-- 2. Favoris : privés (chacun ne voit que les siens).
-- =========================================================================
create table public.favoris (
  profil_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (profil_id, annonce_id)
);
alter table public.favoris enable row level security;
create policy "favoris_lecture_soi" on public.favoris for select to authenticated using ((select auth.uid()) = profil_id);
create policy "favoris_ajout_soi" on public.favoris for insert to authenticated with check ((select auth.uid()) = profil_id);
create policy "favoris_retrait_soi" on public.favoris for delete to authenticated using ((select auth.uid()) = profil_id);

-- =========================================================================
-- 3. Bordeaux : quartier et ligne de tram (mêmes listes que src/lib/annonces/validation.ts).
-- =========================================================================
alter table public.annonces
  add column quartier text check (quartier in ('victor_hugo', 'centre', 'chartrons', 'saint_michel', 'saint_jean', 'bastide', 'bacalan', 'cauderan', 'talence_pessac', 'merignac', 'begles', 'hors_bordeaux')),
  add column tram text check (tram in ('A', 'B', 'C', 'D'));
grant update (quartier, tram) on public.annonces to authenticated;

-- =========================================================================
-- 4. Expiration : 14 jours pour logement, trajets, matériel, shooting, coups de main ; 45 jours sinon.
--    L'auteur prolonge avec une fonction (il ne peut pas écrire une date lointaine lui-même).
-- =========================================================================
create function public.duree_expiration(c text) returns interval language sql immutable set search_path = '' as $$
  select case when c in ('coloc', 'covoiturage', 'materiel', 'shooting', 'coup_de_main') then interval '14 days' else interval '45 days' end;
$$;

alter table public.annonces
  add column expire_le timestamptz,
  add column relance_envoyee boolean not null default false;
update public.annonces set expire_le = cree_le + public.duree_expiration(categorie) where expire_le is null;
alter table public.annonces alter column expire_le set not null;
create index annonces_expiration_idx on public.annonces (expire_le);

create function public.annonces_fixer_expiration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.expire_le := now() + public.duree_expiration(new.categorie);
    new.relance_envoyee := false;
  elsif (new.expire_le, new.relance_envoyee) is distinct from (old.expire_le, old.relance_envoyee)
        and (select auth.role()) <> 'service_role' and current_setting('entraide.prolongation', true) is distinct from 'oui' then
    new.expire_le := old.expire_le; -- seule la fonction prolonger_annonce peut changer la date
    new.relance_envoyee := old.relance_envoyee;
  end if;
  return new;
end;
$$;
create trigger annonces_expiration before insert or update on public.annonces for each row execute function public.annonces_fixer_expiration();

create function public.prolonger_annonce(p_annonce uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('entraide.prolongation', 'oui', true);
  update public.annonces
     set expire_le = now() + public.duree_expiration(categorie), relance_envoyee = false
   where id = p_annonce and auteur_id = (select auth.uid()) and statut <> 'masquee';
  if not found then
    raise exception 'Annonce introuvable' using errcode = '42501';
  end if;
end;
$$;
revoke execute on function public.prolonger_annonce(uuid) from public, anon;
grant execute on function public.prolonger_annonce(uuid) to authenticated;

-- Relance automatique « Toujours d'actualité ? » 3 jours avant l'expiration (appelée chaque jour par pg_cron).
create function public.relancer_annonces_bientot_expirees()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  with a_relancer as (
    update public.annonces
       set relance_envoyee = true
     where statut = 'publiee' and not relance_envoyee and expire_le between now() and now() + interval '3 days'
    returning id, auteur_id, titre
  )
  insert into public.notifications (destinataire_id, type, texte, lien)
  select auteur_id, 'annonce_expire', 'Ton annonce « ' || left(titre, 60) || ' » expire bientôt : toujours d''actualité ?', '/annonces/' || id
  from a_relancer;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.relancer_annonces_bientot_expirees() from public, anon, authenticated;

-- =========================================================================
-- 5. Recherche plein texte en français, insensible aux accents.
-- =========================================================================
create extension if not exists unaccent with schema extensions;

create function public.sans_accent(t text) returns text language sql immutable parallel safe set search_path = '' as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, t);
$$;

alter table public.annonces
  add column recherche tsvector generated always as (
    to_tsvector('french', public.sans_accent(coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' || coalesce(lieu, '')))
  ) stored;
create index annonces_recherche_idx on public.annonces using gin (recherche);

-- =========================================================================
-- 6. Compteur d'impact : agrégats publics uniquement (aucune donnée personnelle).
-- =========================================================================
create function public.stats_publiques()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'etudiants', (select count(*) from public.profils),
    'annonces_actives', (select count(*) from public.annonces where statut = 'publiee' and expire_le > now()),
    'entraides', (select count(*) from public.demandes_contact where statut = 'acceptee'),
    'croisements', (
      select count(*) from public.demandes_contact d
      join public.profils p1 on p1.id = d.demandeur_id
      join public.profils p2 on p2.id = d.destinataire_id
      where d.statut = 'acceptee' and p1.ecole <> p2.ecole
    )
  );
$$;
revoke execute on function public.stats_publiques() from public;
grant execute on function public.stats_publiques() to anon, authenticated;
