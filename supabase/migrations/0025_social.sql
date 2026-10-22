-- Retour du prof (22/10) : un côté réseau social qui donne envie de revenir.
-- Salons (général, mon campus, ma classe), réactions et commentaires sur les annonces et les entraides du fil.
-- Règle d'or n°1 tenue partout : pas de téléphone ni d'email écrits en public, on passe par « Demander le contact ».
-- Règle d'or n°3 inchangée : les conversations privées restent dans « messages » (deux participants).

-- =========================================================================
-- 0. Outils communs
-- =========================================================================
-- Même règle que detecterCoordonnees (src/lib/ia/regles.ts).
create function public.contient_coordonnees(t text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select t ~ '(\+33[ .-]?|(^|[^0-9])0)[1-9]([ .-]?[0-9]{2}){4}([^0-9]|$)'
      or t ~* '[^[:space:]@]+@[^[:space:]@]+\.[a-z]{2,}';
$$;

-- Les salons où j'ai ma place : le général, celui de mon campus, celui de ma classe (l'admin voit tout).
create function public.peut_lire_salon(s text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select s = 'general'
      or exists (
        select 1 from public.profils p
        where p.id = (select auth.uid())
          and (s = 'campus:' || p.campus or (p.classe_id is not null and s = 'classe:' || p.classe_id::text) or p.role = 'admin')
      );
$$;
revoke execute on function public.peut_lire_salon(text) from public, anon;
grant execute on function public.peut_lire_salon(text) to authenticated;

-- Une cible (annonce ou entraide du fil) est-elle visible par moi ?
-- Annonce : mêmes règles que la policy annonces_lecture (0023). Entraide : acceptée et les deux d'accord pour le fil.
create function public.cible_visible(cible_type text, cible uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case cible_type
    when 'annonce' then exists (
      select 1 from public.annonces a
      where a.id = cible
        and ((a.statut = 'publiee' and a.moderation <> 'a_verifier') or a.auteur_id = (select auth.uid()) or public.est_admin())
    )
    when 'entraide' then exists (
      select 1 from public.demandes_contact d
      join public.profils x on x.id = d.demandeur_id
      join public.profils y on y.id = d.destinataire_id
      where d.id = cible and d.statut = 'acceptee' and x.fil_public and y.fil_public
    )
    else false
  end;
$$;
revoke execute on function public.cible_visible(text, uuid) from public, anon;
grant execute on function public.cible_visible(text, uuid) to authenticated;

-- Qui « possède » une cible (pour ne pas réagir à ses propres posts et pour notifier).
create function public.proprietaires_cible(cible_type text, cible uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select case cible_type
    when 'annonce' then (select array[a.auteur_id] from public.annonces a where a.id = cible)
    when 'entraide' then (select array[d.demandeur_id, d.destinataire_id] from public.demandes_contact d where d.id = cible)
  end;
$$;
revoke execute on function public.proprietaires_cible(text, uuid) from public, anon, authenticated;

-- =========================================================================
-- 1. Salons
-- =========================================================================
create table public.salon_messages (
  id uuid primary key default gen_random_uuid(),
  salon text not null check (
    salon = 'general'
    or salon ~ '^campus:(Paris|Lyon|Bordeaux|Toulouse|Nantes|Lille)$'
    or salon ~ '^classe:[0-9a-f-]{36}$'
  ),
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  contenu text not null check (char_length(btrim(contenu)) between 1 and 500),
  cree_le timestamptz not null default now()
);
create index salon_messages_salon_idx on public.salon_messages (salon, cree_le desc);

create function public.salon_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  new.auteur_id := (select auth.uid());
  new.cree_le := now();
  if not public.peut_lire_salon(new.salon) then
    raise exception 'Ce salon n''est pas le tien' using errcode = '42501';
  end if;
  if public.contient_coordonnees(new.contenu) then
    raise exception 'Pas de numéro ni d''email dans les salons : passe par « Demander le contact ».' using errcode = '22023';
  end if;
  if (select count(*) from public.salon_messages where auteur_id = new.auteur_id and cree_le > now() - interval '10 minutes') >= 20 then
    raise exception 'Tu écris beaucoup : patiente quelques minutes.' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
revoke execute on function public.salon_avant_insertion() from public, anon, authenticated;
create trigger salon_messages_avant_insertion before insert on public.salon_messages
  for each row execute function public.salon_avant_insertion();

alter table public.salon_messages enable row level security;
create policy "salon_lecture_membres" on public.salon_messages for select to authenticated
  using (public.peut_lire_salon(salon));
create policy "salon_envoi_membres" on public.salon_messages for insert to authenticated
  with check ((select auth.uid()) = auteur_id and public.peut_lire_salon(salon));
create policy "salon_suppression_auteur_admin" on public.salon_messages for delete to authenticated
  using ((select auth.uid()) = auteur_id or (select public.est_admin()));
revoke all on public.salon_messages from anon;
revoke update, truncate on public.salon_messages from authenticated;
grant select, insert, delete on public.salon_messages to authenticated;
alter publication supabase_realtime add table public.salon_messages;

-- =========================================================================
-- 2. Réactions (bravo, feu, merci, mdr) : une de chaque par personne et par post, pas sur ses propres posts.
--    Elles ne rapportent AUCUN point : rien à gagner à en abuser.
-- =========================================================================
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  cible_type text not null check (cible_type in ('annonce', 'entraide')),
  cible_id uuid not null,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  type text not null check (type in ('bravo', 'feu', 'merci', 'mdr')),
  cree_le timestamptz not null default now(),
  unique (cible_type, cible_id, auteur_id, type)
);
create index reactions_cible_idx on public.reactions (cible_type, cible_id);

create function public.reaction_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  new.auteur_id := (select auth.uid());
  new.cree_le := now();
  if not public.cible_visible(new.cible_type, new.cible_id) then
    raise exception 'Post introuvable' using errcode = '42501';
  end if;
  if new.auteur_id = any (coalesce(public.proprietaires_cible(new.cible_type, new.cible_id), '{}')) then
    raise exception 'Pas de réaction sur ton propre post' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke execute on function public.reaction_avant_insertion() from public, anon, authenticated;
create trigger reactions_avant_insertion before insert on public.reactions
  for each row execute function public.reaction_avant_insertion();

alter table public.reactions enable row level security;
create policy "reactions_lecture" on public.reactions for select to authenticated
  using (public.cible_visible(cible_type, cible_id));
create policy "reactions_ajout_soi" on public.reactions for insert to authenticated
  with check ((select auth.uid()) = auteur_id);
create policy "reactions_retrait_soi" on public.reactions for delete to authenticated
  using ((select auth.uid()) = auteur_id);
revoke all on public.reactions from anon;
revoke update, truncate on public.reactions from authenticated;
grant select, insert, delete on public.reactions to authenticated;

-- =========================================================================
-- 3. Commentaires
-- =========================================================================
create table public.commentaires (
  id uuid primary key default gen_random_uuid(),
  cible_type text not null check (cible_type in ('annonce', 'entraide')),
  cible_id uuid not null,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  contenu text not null check (char_length(btrim(contenu)) between 1 and 300),
  cree_le timestamptz not null default now()
);
create index commentaires_cible_idx on public.commentaires (cible_type, cible_id, cree_le);

create function public.commentaire_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  new.auteur_id := (select auth.uid());
  new.cree_le := now();
  if not public.cible_visible(new.cible_type, new.cible_id) then
    raise exception 'Post introuvable' using errcode = '42501';
  end if;
  if public.contient_coordonnees(new.contenu) then
    raise exception 'Pas de numéro ni d''email en commentaire : passe par « Demander le contact ».' using errcode = '22023';
  end if;
  if (select count(*) from public.commentaires where auteur_id = new.auteur_id and cree_le > now() - interval '10 minutes') >= 15 then
    raise exception 'Tu commentes beaucoup : patiente quelques minutes.' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
revoke execute on function public.commentaire_avant_insertion() from public, anon, authenticated;
create trigger commentaires_avant_insertion before insert on public.commentaires
  for each row execute function public.commentaire_avant_insertion();

alter table public.commentaires enable row level security;
create policy "commentaires_lecture" on public.commentaires for select to authenticated
  using (public.cible_visible(cible_type, cible_id));
create policy "commentaires_ajout_soi" on public.commentaires for insert to authenticated
  with check ((select auth.uid()) = auteur_id);
create policy "commentaires_suppression_auteur_admin" on public.commentaires for delete to authenticated
  using ((select auth.uid()) = auteur_id or (select public.est_admin()));
revoke all on public.commentaires from anon;
revoke update, truncate on public.commentaires from authenticated;
grant select, insert, delete on public.commentaires to authenticated;

-- =========================================================================
-- 4. Notifications : quelqu'un commente mon post (ce qui fait revenir).
-- =========================================================================
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('demande_recue', 'demande_acceptee', 'demande_refusee', 'message', 'avis', 'annonce_masquee', 'annonce_expire', 'commentaire'));

create function public.notifier_commentaire()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dest uuid;
  v_lien text := case new.cible_type when 'annonce' then '/annonces/' || new.cible_id || '#commentaires' else '/fil#e-' || new.cible_id end;
begin
  foreach v_dest in array coalesce(public.proprietaires_cible(new.cible_type, new.cible_id), '{}') loop
    if v_dest <> new.auteur_id then
      insert into public.notifications (destinataire_id, type, texte, lien)
      values (v_dest, 'commentaire', '@' || public.pseudo_de(new.auteur_id) || ' a commenté : « ' || left(new.contenu, 80) || ' »', v_lien);
    end if;
  end loop;
  return new;
end;
$$;
revoke execute on function public.notifier_commentaire() from public, anon, authenticated;
create trigger commentaires_notifier after insert on public.commentaires
  for each row execute function public.notifier_commentaire();

-- =========================================================================
-- 5. Le fil social : les entraides du fil avec leur id (pour réagir et commenter).
--    Nouvelle fonction : fil_du_campus reste pour le code actuel.
-- =========================================================================
create function public.fil_social(limite integer default 30)
returns table (id uuid, aidant_pseudo text, aidant_campus text, aidant_avatar text, aidant_couleur text,
               aide_pseudo text, aide_campus text, aide_avatar text, aide_couleur text,
               categorie text, titre text, quand timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, ai.pseudo, ai.campus, ai.avatar_chemin, ai.colette_couleur,
         ad.pseudo, ad.campus, ad.avatar_chemin, ad.colette_couleur,
         a.categorie, a.titre, coalesce(d.repondu_le, d.cree_le)
  from public.demandes_contact d
  join public.annonces a on a.id = d.annonce_id
  join public.profils ai on ai.id = case when a.type = 'propose' then d.destinataire_id else d.demandeur_id end
  join public.profils ad on ad.id = case when a.type = 'propose' then d.demandeur_id else d.destinataire_id end
  where d.statut = 'acceptee'
    and ai.fil_public and ad.fil_public
    and coalesce(d.repondu_le, d.cree_le) > now() - interval '60 days'
  order by coalesce(d.repondu_le, d.cree_le) desc
  limit least(greatest(limite, 1), 60);
$$;
revoke execute on function public.fil_social(integer) from public, anon;
grant execute on function public.fil_social(integer) to authenticated;
