-- 0033 (19/11/2026) : partager un post-it dans un salon ou une discussion, et des salons par thème.
-- Idée du prof : faire circuler les post-its comme sur un réseau social.
--
-- Règle d'accès modifiée (avant/après montré à Hadriel) : peut_lire_salon.
--   AVANT : le général, le salon de mon campus, celui de ma classe (l'admin voit tout).
--   APRÈS : pareil, plus les 5 salons par thème, ouverts à tous les étudiants connectés.
-- Règle d'or n°3 inchangée : un partage dans une discussion privée reste lisible par ses seuls participants.

-- 1. Les salons par thème.
alter table public.salon_messages drop constraint salon_messages_salon_check;
alter table public.salon_messages add constraint salon_messages_salon_check check (
  salon = 'general'
  or salon ~ '^campus:(Paris|Lyon|Bordeaux|Toulouse|Nantes|Lille)$'
  or salon ~ '^classe:[0-9a-f-]{36}$'
  or salon in ('theme:photo-video', 'theme:dev', 'theme:design', 'theme:data-ia', 'theme:logement')
);

create or replace function public.peut_lire_salon(s text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select s = 'general'
      or s in ('theme:photo-video', 'theme:dev', 'theme:design', 'theme:data-ia', 'theme:logement')
      or exists (
        select 1 from public.profils p
        where p.id = (select auth.uid())
          and (s = 'campus:' || p.campus or (p.classe_id is not null and s = 'classe:' || p.classe_id::text) or p.role = 'admin')
      );
$$;

-- 2. Un message (salon ou discussion) peut porter un post-it partagé. S'il disparaît, le lien s'efface ;
--    s'il est masqué, la RLS des annonces le cache à ceux qui ne peuvent plus le voir (« Post-it indisponible »).
alter table public.salon_messages add column annonce_id uuid references public.annonces (id) on delete set null;
alter table public.messages add column annonce_id uuid references public.annonces (id) on delete set null;

-- 3. On ne partage qu'un post-it qu'on a le droit de voir (mêmes fonctions qu'en 0025 et 0029, plus ce contrôle).
create or replace function public.salon_avant_insertion()
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
  if new.annonce_id is not null and not public.cible_visible('annonce', new.annonce_id) then
    raise exception 'Post-it introuvable' using errcode = '42501';
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

create or replace function public.message_avant_insertion()
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
      and ((select auth.uid()) in (demandeur_id, destinataire_id) or public.est_equipe(annonce_id, (select auth.uid())))
  ) then
    raise exception 'Conversation indisponible' using errcode = '42501';
  end if;
  if new.annonce_id is not null and not public.cible_visible('annonce', new.annonce_id) then
    raise exception 'Post-it introuvable' using errcode = '42501';
  end if;
  new.auteur_id := (select auth.uid());
  new.cree_le := now();
  return new;
end;
$$;
