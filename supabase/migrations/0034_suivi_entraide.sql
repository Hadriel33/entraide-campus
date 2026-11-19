-- 0034 (19/11/2026) : le suivi d'une entraide, façon colis, avec Colette livreuse.
-- Celui qui aide avance les étapes (C'est parti, Je m'y mets, Presque fini, C'est livré) avec un petit mot
-- (« je monte la vidéo ») ; l'autre confirme « Bien reçu ». Chacun est prévenu par une notification.
--
-- Aucune règle RLS existante n'est modifiée : une NOUVELLE table, lisible par les seuls participants de l'échange
-- (même périmètre que la demande), et AUCUNE écriture directe : tout passe par deux fonctions qui vérifient qui aide.
-- Seule la liste des types de notification s'allonge (contrainte CHECK, pas une policy) :
--   AVANT : ..., 'commentaire', 'soutien', 'groupe'
--   APRÈS : ..., 'commentaire', 'soutien', 'groupe', 'suivi'

create table public.suivis_entraide (
  demande_id uuid primary key references public.demandes_contact (id) on delete cascade,
  etape text not null check (etape in ('parti', 'en_cours', 'presque', 'livre', 'recu')),
  mot text check (mot is null or char_length(mot) <= 80),
  maj_le timestamptz not null default now()
);

alter table public.suivis_entraide enable row level security;

-- Lisible si la demande l'est : la RLS des demandes ne renvoie que les miennes (demandeur, destinataire, équipe).
create policy "suivis_lecture_participants" on public.suivis_entraide for select to authenticated
  using (exists (select 1 from public.demandes_contact d where d.id = demande_id));

revoke all on public.suivis_entraide from anon, authenticated;
grant select on public.suivis_entraide to authenticated;

-- Qui aide ? « Je propose » : l'auteur ou son équipe (pas le demandeur). « Je cherche » : le demandeur.
create function public.est_aide(p_demande uuid, p_qui uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.demandes_contact d join public.annonces a on a.id = d.annonce_id
    where d.id = p_demande and d.statut = 'acceptee'
      and (
        (a.type = 'propose' and p_qui <> d.demandeur_id and (p_qui = d.destinataire_id or public.est_equipe(d.annonce_id, p_qui)))
        or (a.type = 'cherche' and p_qui = d.demandeur_id)
      )
  );
$$;
revoke execute on function public.est_aide(uuid, uuid) from public, anon, authenticated;

-- Celui qui reçoit l'aide (pour la notification et pour « Bien reçu »).
create function public.receveur_de(p_demande uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case when a.type = 'propose' then d.demandeur_id else d.destinataire_id end
  from public.demandes_contact d join public.annonces a on a.id = d.annonce_id
  where d.id = p_demande;
$$;
revoke execute on function public.receveur_de(uuid) from public, anon, authenticated;

create function public.aidant_de(p_demande uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case when a.type = 'propose' then d.destinataire_id else d.demandeur_id end
  from public.demandes_contact d join public.annonces a on a.id = d.annonce_id
  where d.id = p_demande;
$$;
revoke execute on function public.aidant_de(uuid) from public, anon, authenticated;

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('demande_recue', 'demande_acceptee', 'demande_refusee', 'message', 'avis', 'annonce_masquee', 'annonce_expire', 'commentaire', 'soutien', 'groupe', 'suivi'));

-- Avancer : seulement celui qui aide, seulement vers l'avant, mot court sans coordonnées.
create function public.avancer_entraide(p_demande uuid, p_etape text, p_mot text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moi uuid := (select auth.uid());
  v_ordre text[] := array['parti', 'en_cours', 'presque', 'livre', 'recu'];
  v_actuelle text;
  v_mot text := nullif(btrim(coalesce(p_mot, '')), '');
  v_libelle text;
begin
  if v_moi is null or not public.est_aide(p_demande, v_moi) then
    raise exception 'Échange introuvable' using errcode = '42501';
  end if;
  if p_etape is null or p_etape not in ('parti', 'en_cours', 'presque', 'livre') then
    raise exception 'Étape inconnue' using errcode = '22023';
  end if;
  select etape into v_actuelle from public.suivis_entraide where demande_id = p_demande;
  if v_actuelle in ('livre', 'recu') then
    raise exception 'C''est déjà livré' using errcode = '22023';
  end if;
  if v_actuelle is not null and array_position(v_ordre, p_etape) < array_position(v_ordre, v_actuelle) then
    raise exception 'On ne revient pas en arrière' using errcode = '22023';
  end if;
  if v_mot is not null and (char_length(v_mot) > 80 or public.contient_coordonnees(v_mot)) then
    raise exception 'Petit mot trop long ou avec des coordonnées' using errcode = '22023';
  end if;

  insert into public.suivis_entraide (demande_id, etape, mot, maj_le) values (p_demande, p_etape, v_mot, now())
  on conflict (demande_id) do update set etape = excluded.etape, mot = excluded.mot, maj_le = now();

  v_libelle := case p_etape when 'parti' then 'c''est parti' when 'en_cours' then 'je m''y mets' when 'presque' then 'presque fini' else 'c''est livré !' end;
  insert into public.notifications (destinataire_id, type, texte, lien)
  values (
    public.receveur_de(p_demande), 'suivi',
    left('@' || public.pseudo_de(v_moi) || ' : ' || v_libelle || coalesce(' (' || v_mot || ')', ''), 200),
    '/demandes/' || p_demande
  );
end;
$$;
revoke execute on function public.avancer_entraide(uuid, text, text) from public, anon;
grant execute on function public.avancer_entraide(uuid, text, text) to authenticated;

-- « Bien reçu » : seulement celui qui reçoit l'aide, seulement une fois livré.
create function public.confirmer_entraide(p_demande uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moi uuid := (select auth.uid());
  v_ok boolean;
begin
  -- Un participant de l'échange (demandeur, destinataire ou équipe) qui n'est pas celui qui aide.
  select exists (
    select 1 from public.demandes_contact d
    where d.id = p_demande and d.statut = 'acceptee'
      and (v_moi in (d.demandeur_id, d.destinataire_id) or public.est_equipe(d.annonce_id, v_moi))
  ) into v_ok;
  if v_moi is null or not v_ok or public.est_aide(p_demande, v_moi) then
    raise exception 'Échange introuvable' using errcode = '42501';
  end if;
  update public.suivis_entraide set etape = 'recu', maj_le = now() where demande_id = p_demande and etape = 'livre';
  if not found then
    raise exception 'Pas encore livré' using errcode = '22023';
  end if;
  insert into public.notifications (destinataire_id, type, texte, lien)
  values (public.aidant_de(p_demande), 'suivi', '@' || public.pseudo_de(v_moi) || ' a bien reçu, merci ! Laisse-lui un avis.', '/demandes/' || p_demande);
end;
$$;
revoke execute on function public.confirmer_entraide(uuid) from public, anon;
grant execute on function public.confirmer_entraide(uuid) to authenticated;
