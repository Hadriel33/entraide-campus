-- Étape 5 : demandes de contact. Règle d'or n°1 : mes coordonnées ne sont visibles qu'après mon accord.

create table public.demandes_contact (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  demandeur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  destinataire_id uuid not null references public.profils (id) on delete cascade,
  message text check (message is null or char_length(message) <= 300),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee', 'refusee')),
  cree_le timestamptz not null default now(),
  repondu_le timestamptz,
  unique (annonce_id, demandeur_id),
  check (demandeur_id <> destinataire_id)
);

create index demandes_destinataire_idx on public.demandes_contact (destinataire_id, statut);
create index demandes_demandeur_idx on public.demandes_contact (demandeur_id);

-- À la création, la base impose : demandeur = moi, destinataire = auteur de l'annonce, statut = en attente.
create function public.demande_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auteur uuid;
  v_statut text;
begin
  select auteur_id, statut into v_auteur, v_statut from public.annonces where id = new.annonce_id;
  if v_auteur is null or v_statut <> 'publiee' then
    raise exception 'Cette annonce n''est pas disponible';
  end if;
  new.demandeur_id := (select auth.uid());
  new.destinataire_id := v_auteur;
  new.statut := 'en_attente';
  new.repondu_le := null;
  new.cree_le := now();
  if new.demandeur_id = new.destinataire_id then
    raise exception 'Tu ne peux pas demander ton propre contact';
  end if;
  return new;
end;
$$;

create trigger demandes_avant_insertion
  before insert on public.demandes_contact
  for each row execute function public.demande_avant_insertion();

-- Une réponse ne se donne qu'une fois, depuis « en attente ».
create function public.demande_avant_reponse()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.statut <> 'en_attente' then
    raise exception 'Cette demande a déjà reçu une réponse';
  end if;
  if new.statut not in ('acceptee', 'refusee') then
    raise exception 'Réponse invalide';
  end if;
  new.repondu_le := now();
  return new;
end;
$$;

create trigger demandes_avant_reponse
  before update on public.demandes_contact
  for each row execute function public.demande_avant_reponse();

alter table public.demandes_contact enable row level security;

create policy "demandes_lecture_participants"
  on public.demandes_contact for select
  to authenticated
  using ((select auth.uid()) in (demandeur_id, destinataire_id));

create policy "demandes_creation_par_soi"
  on public.demandes_contact for insert
  to authenticated
  with check ((select auth.uid()) = demandeur_id);

create policy "demandes_reponse_destinataire"
  on public.demandes_contact for update
  to authenticated
  using ((select auth.uid()) = destinataire_id)
  with check ((select auth.uid()) = destinataire_id);

create policy "demandes_annulation_demandeur"
  on public.demandes_contact for delete
  to authenticated
  using ((select auth.uid()) = demandeur_id and statut = 'en_attente');

revoke update on public.demandes_contact from authenticated, anon;
grant update (statut) on public.demandes_contact to authenticated;

-- Vrai si moi et la cible avons une mise en relation acceptée (dans un sens ou dans l'autre).
create function public.peut_voir_coordonnees(cible uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.demandes_contact
    where statut = 'acceptee'
      and (
        (demandeur_id = (select auth.uid()) and destinataire_id = cible)
        or (destinataire_id = (select auth.uid()) and demandeur_id = cible)
      )
  );
$$;

revoke execute on function public.peut_voir_coordonnees(uuid) from public, anon;
grant execute on function public.peut_voir_coordonnees(uuid) to authenticated;

-- LA règle d'or n°1, en base : mes coordonnées, ou celles d'une personne avec qui l'accord existe.
create policy "coordonnees_lecture_apres_accord"
  on public.coordonnees for select
  to authenticated
  using ((select auth.uid()) = id or public.peut_voir_coordonnees(id));
