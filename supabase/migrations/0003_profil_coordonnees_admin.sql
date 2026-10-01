-- Profil enrichi (pseudo, photo, bio), rôle admin protégé, coordonnées dans une table à part, bucket des avatars.

-- 1. Profil : pseudo unique, photo (chemin dans le bucket, forcément dans MON dossier), bio, rôle.
alter table public.profils
  add column pseudo text not null unique check (pseudo ~ '^[a-z0-9_][a-z0-9._]{1,18}[a-z0-9_]$'),
  add column avatar_chemin text check (avatar_chemin is null or (avatar_chemin like id::text || '/%' and char_length(avatar_chemin) <= 200)),
  add column bio text check (bio is null or char_length(bio) <= 160),
  add column role text not null default 'etudiant' check (role in ('etudiant', 'admin'));

-- L'utilisateur modifie son prénom, son pseudo, sa photo et sa bio. JAMAIS son rôle ni son école.
revoke update on public.profils from authenticated, anon;
grant update (prenom, pseudo, avatar_chemin, bio) on public.profils to authenticated;

-- 2. Coordonnées : visibles par soi seulement ici ; l'accès après accord est ajouté en 0004.
create table public.coordonnees (
  id uuid primary key references public.profils (id) on delete cascade,
  telephone text check (telephone is null or telephone ~ '^(0|\+33)[1-9][0-9]{8}$'),
  email text check (email is null or (char_length(email) <= 200 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  reseau text check (reseau is null or char_length(reseau) <= 60),
  modifie_le timestamptz not null default now()
);

alter table public.coordonnees enable row level security;

create policy "coordonnees_modification_soi"
  on public.coordonnees for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on public.coordonnees from authenticated, anon;
grant update (telephone, email, reseau) on public.coordonnees to authenticated;

-- 3. Création automatique du profil ET des coordonnées à l'inscription.
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profils (id, prenom, ecole, pseudo)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'prenom'),
    new.raw_user_meta_data ->> 'ecole',
    lower(btrim(new.raw_user_meta_data ->> 'pseudo'))
  );
  insert into public.coordonnees (id, email) values (new.id, new.email);
  return new;
end;
$$;

-- 4. Rôle admin : fonctions utilisées par les policies et l'espace admin.
create function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profils where id = (select auth.uid()) and role = 'admin');
$$;

revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- Seul un admin nomme ou retire un admin, et il ne peut pas se retirer lui-même (pas d'appli sans admin).
create function public.definir_role(cible uuid, nouveau_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Réservé aux admins' using errcode = '42501';
  end if;
  if nouveau_role not in ('etudiant', 'admin') then
    raise exception 'Rôle inconnu';
  end if;
  if cible = (select auth.uid()) and nouveau_role <> 'admin' then
    raise exception 'Un admin ne peut pas se retirer lui-même ses droits';
  end if;
  update public.profils set role = nouveau_role where id = cible;
end;
$$;

revoke execute on function public.definir_role(uuid, text) from public, anon;
grant execute on function public.definir_role(uuid, text) to authenticated;

-- Disponibilité d'un pseudo, appelée avant l'inscription (donc aussi par un visiteur).
create function public.pseudo_disponible(p text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profils where pseudo = lower(btrim(p)));
$$;

revoke execute on function public.pseudo_disponible(text) from public;
grant execute on function public.pseudo_disponible(text) to anon, authenticated;

-- 5. Photos de profil : bucket public en lecture, écriture limitée à son propre dossier.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy "avatars_lecture_soi" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_ajout_soi" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_remplacement_soi" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_suppression_soi" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
