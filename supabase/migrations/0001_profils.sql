-- Étape 3 : profils des étudiants.
-- Un profil est créé automatiquement à l'inscription (trigger), jamais par l'utilisateur.
-- Les coordonnées (téléphone, etc.) NE sont PAS ici : elles auront leur table protégée (étape 5).

create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null check (char_length(btrim(prenom)) between 1 and 40),
  ecole text not null check (ecole in ('ESD', 'ESP')),
  cree_le timestamptz not null default now()
);

alter table public.profils enable row level security;

-- Lecture : tout étudiant connecté peut voir le prénom et l'école (auteur d'une annonce).
create policy "profils_lecture_connectes"
  on public.profils for select
  to authenticated
  using (true); -- justifié : prénom + école uniquement, aucune donnée de contact dans cette table

-- Modification : uniquement son propre profil (règle d'or n°2 appliquée aux profils).
create policy "profils_modification_soi"
  on public.profils for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Pas de policy insert ni delete : création par le trigger, suppression en cascade avec le compte.
-- On ne peut changer que son prénom, pas son id ni sa date de création.
revoke update on public.profils from authenticated, anon;
grant update (prenom) on public.profils to authenticated;

create function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profils (id, prenom, ecole)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'prenom'),
    new.raw_user_meta_data ->> 'ecole'
  );
  return new;
end;
$$;

revoke execute on function public.creer_profil() from public, anon, authenticated;

create trigger a_l_inscription_creer_profil
  after insert on auth.users
  for each row execute function public.creer_profil();
