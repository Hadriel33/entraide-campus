-- Palier 2 : messagerie. Règle d'or n°3 : une conversation n'est lisible que par ses deux participants.
-- Une conversation = une demande de contact ACCEPTÉE (pas de message avant l'accord).

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes_contact (id) on delete cascade,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  contenu text not null check (char_length(btrim(contenu)) between 1 and 1000),
  cree_le timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (demande_id, cree_le);

-- La base impose l'auteur et vérifie que la conversation existe, est acceptée et me concerne.
create function public.message_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.demandes_contact
    where id = new.demande_id and statut = 'acceptee'
      and (select auth.uid()) in (demandeur_id, destinataire_id)
  ) then
    raise exception 'Conversation indisponible' using errcode = '42501';
  end if;
  new.auteur_id := (select auth.uid());
  new.cree_le := now();
  return new;
end;
$$;

revoke execute on function public.message_avant_insertion() from public, anon, authenticated;

create trigger messages_avant_insertion
  before insert on public.messages
  for each row execute function public.message_avant_insertion();

alter table public.messages enable row level security;

create policy "messages_lecture_participants"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.demandes_contact d
      where d.id = demande_id and (select auth.uid()) in (d.demandeur_id, d.destinataire_id)
    )
  );

create policy "messages_envoi_participant"
  on public.messages for insert
  to authenticated
  with check ((select auth.uid()) = auteur_id);

-- Pas de modification ni de suppression : l'historique d'une conversation reste fidèle.
revoke update, delete, truncate on public.messages from authenticated, anon;

-- Messages en direct (Realtime respecte la RLS : chacun ne reçoit que ses conversations).
alter publication supabase_realtime add table public.messages;
