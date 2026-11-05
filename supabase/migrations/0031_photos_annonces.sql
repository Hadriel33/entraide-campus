-- 0031 (05/11/2026) : une photo sur un post-it (objet à prêter, chambre, shooting...),
-- et le signalement des commentaires et des messages de salon (la modération ne s'arrête pas au post-it).
-- Aucune policy RLS existante n'est modifiée : nouvelles policies sur le nouveau bucket et la nouvelle table.
-- À lancer AVANT la mise en ligne du code (sinon le tableau ne trouve pas la colonne photo_chemin).

-- 1. La colonne : un chemin « <uid de l'envoyeur>/<uuid>.<jpg|png|webp> », rien d'autre.
alter table public.annonces add column photo_chemin text
  check (photo_chemin is null or photo_chemin ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');
grant update (photo_chemin) on public.annonces to authenticated;

-- 2. On ne pose que SA photo (le dossier doit être le sien), et changer de photo renvoie en relecture IA,
--    exactement comme changer le texte (on reprend annonces_garde_ia de 0021 en y ajoutant la photo).
create or replace function public.annonces_garde_ia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role' or public.est_admin() then
    return new;
  end if;
  if new.photo_chemin is not null
     and (tg_op = 'INSERT' or new.photo_chemin is distinct from old.photo_chemin)
     and split_part(new.photo_chemin, '/', 1) <> (select auth.uid())::text then
    raise exception 'Photo invalide' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    new.moderation := 'en_attente';
    new.moderation_raisons := '{}';
    new.moderation_suggestion := null;
    new.modere_le := null;
    return new;
  end if;
  if (new.moderation, new.moderation_raisons, new.modere_le, new.moderation_suggestion)
     is distinct from (old.moderation, old.moderation_raisons, old.modere_le, old.moderation_suggestion) then
    raise exception 'Seule la modération peut changer ce statut' using errcode = '42501';
  end if;
  if (new.titre, new.description, new.lieu, new.photo_chemin) is distinct from (old.titre, old.description, old.lieu, old.photo_chemin) then
    new.moderation := 'en_attente';
    new.moderation_raisons := '{}';
    new.moderation_suggestion := null;
    new.modere_le := null;
  end if;
  return new;
end;
$$;

-- 3. Le bucket : public en lecture (donnée non sensible : une photo destinée à être montrée sur le tableau,
--    sous un nom aléatoire impossible à deviner), 2 Mo, images seulement. Écriture : son propre dossier.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('annonces', 'annonces', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

-- (la lecture publique passe par l'URL publique du bucket ; via l'API, chacun ne liste que son dossier)
create policy "annonces_photos_lecture_soi" on storage.objects for select to authenticated
  using (bucket_id = 'annonces' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "annonces_photos_ajout_soi" on storage.objects for insert to authenticated
  with check (bucket_id = 'annonces' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "annonces_photos_suppression_soi" on storage.objects for delete to authenticated
  using (bucket_id = 'annonces' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4. Signaler un commentaire ou un message de salon. On garde une copie du message signalé (l'admin le lit même
--    s'il est supprimé ensuite), on vérifie que je peux bien le lire, et pas mes propres messages.
create table public.signalements_messages (
  id uuid primary key default gen_random_uuid(),
  cible_type text not null check (cible_type in ('commentaire', 'salon')),
  cible_id uuid not null,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  auteur_signale_id uuid references public.profils (id) on delete set null,
  contenu_signale text not null default '',
  motif text not null check (motif in ('harcelement', 'inapproprie', 'coordonnees', 'arnaque', 'autre')),
  statut text not null default 'ouvert' check (statut in ('ouvert', 'traite')),
  cree_le timestamptz not null default now(),
  unique (cible_type, cible_id, auteur_id)
);
create index signalements_messages_ouverts_idx on public.signalements_messages (statut, cree_le desc);

create function public.signalement_message_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auteur uuid;
  v_contenu text;
  v_visible boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  if new.cible_type = 'commentaire' then
    select c.auteur_id, c.contenu, public.cible_visible(c.cible_type, c.cible_id) into v_auteur, v_contenu, v_visible
    from public.commentaires c where c.id = new.cible_id;
  else
    select m.auteur_id, m.contenu, public.peut_lire_salon(m.salon) into v_auteur, v_contenu, v_visible
    from public.salon_messages m where m.id = new.cible_id;
  end if;
  if v_auteur is null or not coalesce(v_visible, false) then
    raise exception 'Message introuvable' using errcode = '42501';
  end if;
  if v_auteur = (select auth.uid()) then
    raise exception 'Pas de signalement sur ton propre message' using errcode = '22023';
  end if;
  if (select count(*) from public.signalements_messages where auteur_id = (select auth.uid()) and cree_le > now() - interval '1 day') >= 20 then
    raise exception 'Beaucoup de signalements aujourd''hui : l''équipe regarde déjà.' using errcode = 'P0429';
  end if;
  new.auteur_id := (select auth.uid());
  new.auteur_signale_id := v_auteur;
  new.contenu_signale := left(v_contenu, 1000);
  new.statut := 'ouvert';
  new.cree_le := now();
  return new;
end;
$$;
revoke execute on function public.signalement_message_avant_insertion() from public, anon, authenticated;
create trigger signalements_messages_avant_insertion before insert on public.signalements_messages
  for each row execute function public.signalement_message_avant_insertion();

alter table public.signalements_messages enable row level security;
create policy "signalements_messages_creation_soi" on public.signalements_messages for insert to authenticated
  with check ((select auth.uid()) = auteur_id);
create policy "signalements_messages_lecture_admin_ou_auteur" on public.signalements_messages for select to authenticated
  using (public.est_admin() or (select auth.uid()) = auteur_id);
create policy "signalements_messages_traitement_admin" on public.signalements_messages for update to authenticated
  using (public.est_admin()) with check (public.est_admin());
revoke all on public.signalements_messages from anon;
revoke update, delete, truncate on public.signalements_messages from authenticated;
grant select, insert on public.signalements_messages to authenticated;
grant update (statut) on public.signalements_messages to authenticated;
