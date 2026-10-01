-- Classes (classement « meilleure classe du campus ») et avatar Colette personnalisé.

-- 1. Les classes : une liste gérée par les admins, lue par tous les étudiants connectés.
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  ecole text not null check (ecole in ('ESD', 'ESP')),
  nom text not null check (char_length(btrim(nom)) between 2 and 40),
  cree_le timestamptz not null default now(),
  unique (ecole, nom)
);
alter table public.classes enable row level security;

create policy "classes_lecture_connectes"
  on public.classes for select
  to authenticated
  using (true); -- justifié : simple liste de noms de classes, aucune donnée personnelle

create policy "classes_gestion_admin"
  on public.classes for all
  to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

revoke all on public.classes from anon, authenticated;
grant select, insert, update, delete on public.classes to authenticated; -- la RLS limite l'écriture aux admins

-- 2. Le profil : sa classe et sa Colette (couleur, humeur, accessoire). Valeurs bornées par la base.
alter table public.profils
  add column classe_id uuid references public.classes(id) on delete set null,
  add column colette_couleur text not null default '' check (colette_couleur in ('', 'jaune', 'lilas', 'ciel', 'ocre')),
  add column colette_humeur text not null default 'contente' check (colette_humeur in ('contente', 'surprise', 'fiere', 'concentree')),
  add column colette_accessoire text not null default 'aucun'
    check (colette_accessoire in ('aucun', 'photo', 'design', 'dev', 'data', 'coloc', 'covoit', 'diplome', 'bde', 'noel'));

grant update (classe_id, colette_couleur, colette_humeur, colette_accessoire) on public.profils to authenticated;

-- 3. On ne rejoint qu'une classe de sa propre école (impossible de gonfler la classe d'en face).
create function public.verifier_classe()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.classe_id is not null and not exists (
    select 1 from public.classes c where c.id = new.classe_id and c.ecole = new.ecole
  ) then
    raise exception 'Cette classe n''est pas de ton école' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke execute on function public.verifier_classe() from public, anon, authenticated;

create trigger profils_verifier_classe
  before insert or update of classe_id, ecole on public.profils
  for each row execute function public.verifier_classe();
