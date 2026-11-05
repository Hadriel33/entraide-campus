-- 0031 (05/11/2026) : une photo sur un post-it (objet à prêter, chambre, shooting...).
-- Aucune policy RLS existante n'est modifiée : nouvelles policies sur le nouveau bucket seulement.
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
