-- 0029 (28/10/2026) : post-its de groupe. Un post-it partagé avec 1 à 3 potes, chacun ayant dit oui.
-- Avant/après des règles montré à Hadriel et validé avant application (CLAUDE.md).
--
-- Règle d'or n°1 (coordonnées) : INCHANGÉE. Seules celles de la personne qui accepte la demande sont montrées
--   (elle devient le destinataire ; peut_voir_coordonnees ne change pas).
-- Règle d'or n°2 (modifier) : l'auteur OU un membre qui a accepté l'invitation. Supprimer : le créateur seul (inchangé).
-- Règle d'or n°3 (conversation) : lisible par ses participants = le demandeur, la personne qui a accepté,
--   et l'équipe du post-it (créateur et membres qui ont tous dit oui).

-- ---------- 1. L'équipe d'un post-it ----------
create table public.annonce_membres (
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  membre_id uuid not null references public.profils (id) on delete cascade,
  statut text not null default 'invite' check (statut in ('invite', 'accepte')),
  cree_le timestamptz not null default now(),
  primary key (annonce_id, membre_id)
);
create index annonce_membres_membre_idx on public.annonce_membres (membre_id);

-- Est-ce que « qui » fait partie de l'équipe du post-it (son créateur, ou un membre qui a accepté) ?
create function public.est_equipe(annonce uuid, qui uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select qui is not null and (
    exists (select 1 from public.annonces a where a.id = annonce and a.auteur_id = qui)
    or exists (select 1 from public.annonce_membres m where m.annonce_id = annonce and m.membre_id = qui and m.statut = 'accepte')
  );
$$;
-- Appelée par les policies : les connectés doivent pouvoir l'exécuter (elle ne dit que l'appartenance, déjà visible sur le post-it).
revoke execute on function public.est_equipe(uuid, uuid) from public, anon;
grant execute on function public.est_equipe(uuid, uuid) to authenticated;

-- Version pour les policies : moi, membre accepté (le créateur est déjà couvert par auteur_id).
create function public.est_membre_annonce(annonce uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.annonce_membres m
    where m.annonce_id = annonce and m.membre_id = (select auth.uid()) and m.statut = 'accepte'
  );
$$;
revoke execute on function public.est_membre_annonce(uuid) from public, anon;
grant execute on function public.est_membre_annonce(uuid) to authenticated;

-- Invitation : seul le créateur invite, 3 membres au plus, jamais soi-même. L'invité est prévenu.
create function public.membre_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auteur uuid;
  v_statut text;
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  select auteur_id, statut into v_auteur, v_statut from public.annonces where id = new.annonce_id;
  if v_auteur is distinct from (select auth.uid()) then
    raise exception 'Seul le créateur du post-it invite' using errcode = '42501';
  end if;
  if v_statut = 'masquee' then
    raise exception 'Post-it indisponible' using errcode = '22023';
  end if;
  if new.membre_id = v_auteur then
    raise exception 'Tu es déjà sur ce post-it' using errcode = '22023';
  end if;
  if (select count(*) from public.annonce_membres where annonce_id = new.annonce_id) >= 3 then
    raise exception 'Un post-it de groupe, c''est 4 personnes au plus' using errcode = '22023';
  end if;
  new.statut := 'invite';
  new.cree_le := now();
  return new;
end;
$$;
revoke execute on function public.membre_avant_insertion() from public, anon, authenticated;
create trigger annonce_membres_avant_insertion before insert on public.annonce_membres
  for each row execute function public.membre_avant_insertion();

-- Accepter : seulement passer de « invite » à « accepte » (rien d'autre ne bouge).
create function public.membre_avant_modification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (old.statut = 'invite' and new.statut = 'accepte') then
    raise exception 'Invitation déjà traitée' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger annonce_membres_avant_modification before update on public.annonce_membres
  for each row execute function public.membre_avant_modification();

create function public.notifier_membre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auteur uuid;
  v_titre text;
begin
  select auteur_id, left(titre, 60) into v_auteur, v_titre from public.annonces where id = new.annonce_id;
  if tg_op = 'INSERT' then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (new.membre_id, 'groupe', '@' || public.pseudo_de(v_auteur) || ' t''invite sur son post-it « ' || v_titre || ' »', '/annonces/' || new.annonce_id);
  elsif new.statut = 'accepte' then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (v_auteur, 'groupe', '@' || public.pseudo_de(new.membre_id) || ' a rejoint ton post-it « ' || v_titre || ' »', '/annonces/' || new.annonce_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.notifier_membre() from public, anon, authenticated;
create trigger annonce_membres_notifier after insert or update of statut on public.annonce_membres
  for each row execute function public.notifier_membre();

alter table public.annonce_membres enable row level security;
-- Les membres acceptés sont publics (leurs visages sont sur le post-it) ; une invitation en attente,
-- seuls l'invité et le créateur la voient.
create policy "membres_lecture" on public.annonce_membres for select to authenticated
  using (
    membre_id = (select auth.uid())
    or public.est_equipe(annonce_id, (select auth.uid()))
    or (statut = 'accepte' and public.cible_visible('annonce', annonce_id))
  );
create policy "membres_invitation_createur" on public.annonce_membres for insert to authenticated
  with check (exists (select 1 from public.annonces a where a.id = annonce_id and a.auteur_id = (select auth.uid())));
create policy "membres_reponse_invite" on public.annonce_membres for update to authenticated
  using (membre_id = (select auth.uid())) with check (membre_id = (select auth.uid()));
-- Refuser, quitter (le membre) ou retirer quelqu'un (le créateur).
create policy "membres_depart" on public.annonce_membres for delete to authenticated
  using (
    membre_id = (select auth.uid())
    or exists (select 1 from public.annonces a where a.id = annonce_id and a.auteur_id = (select auth.uid()))
  );
revoke all on public.annonce_membres from anon;
revoke update, truncate on public.annonce_membres from authenticated;
grant select, insert, delete on public.annonce_membres to authenticated;
grant update (statut) on public.annonce_membres to authenticated;

-- ---------- 2. Annonces : les membres modifient et voient leur post-it caché ----------
-- AVANT : annonces_modification_auteur (auteur seul). On l'ajoute À CÔTÉ, sans toucher l'ancienne.
create policy "annonces_modification_membres" on public.annonces for update to authenticated
  using (public.est_membre_annonce(id))
  with check (public.est_membre_annonce(id));
-- AVANT : publiée et vérifiée, ou l'auteur. APRÈS : + les membres du groupe.
alter policy "annonces_lecture" on public.annonces
  using (((statut = 'publiee') and (moderation <> 'a_verifier')) or ((select auth.uid()) = auteur_id) or public.est_membre_annonce(id));

-- Visibilité et « propriétaires » d'un post-it : l'équipe entière (réactions, soutiens, notifications).
create or replace function public.cible_visible(cible_type text, cible uuid)
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
        and ((a.statut = 'publiee' and a.moderation <> 'a_verifier') or a.auteur_id = (select auth.uid()) or public.est_admin()
             or public.est_equipe(a.id, (select auth.uid())))
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

create or replace function public.proprietaires_cible(cible_type text, cible uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select case cible_type
    when 'annonce' then (
      select array[a.auteur_id] || coalesce(array(
        select m.membre_id from public.annonce_membres m where m.annonce_id = a.id and m.statut = 'accepte'
      ), '{}')
      from public.annonces a where a.id = cible
    )
    when 'entraide' then (select array[d.demandeur_id, d.destinataire_id] from public.demandes_contact d where d.id = cible)
  end;
$$;

-- ---------- 3. Demandes de contact ----------
-- Personne de l'équipe ne peut demander le contact de son propre post-it.
create or replace function public.demande_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auteur uuid;
  v_statut text;
  v_moderation text;
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  select auteur_id, statut, moderation into v_auteur, v_statut, v_moderation from public.annonces where id = new.annonce_id;
  if v_auteur is null or v_statut <> 'publiee' or v_moderation = 'a_verifier' then
    raise exception 'Cette annonce n''est pas disponible';
  end if;
  new.demandeur_id := (select auth.uid());
  new.destinataire_id := v_auteur;
  new.statut := 'en_attente';
  new.repondu_le := null;
  new.cree_le := now();
  if public.est_equipe(new.annonce_id, new.demandeur_id) then
    raise exception 'Tu ne peux pas demander ton propre contact';
  end if;
  return new;
end;
$$;

-- Toute l'équipe est prévenue d'une demande (le créateur l'est déjà par notifier_demande).
create function public.notifier_demande_equipe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (destinataire_id, type, texte, lien)
  select m.membre_id, 'demande_recue',
         '@' || public.pseudo_de(new.demandeur_id) || ' veut contacter ton groupe pour « ' || left(a.titre, 60) || ' »', '/demandes'
  from public.annonce_membres m join public.annonces a on a.id = m.annonce_id
  where m.annonce_id = new.annonce_id and m.statut = 'accepte';
  return new;
end;
$$;
revoke execute on function public.notifier_demande_equipe() from public, anon, authenticated;
create trigger demandes_notifier_equipe after insert on public.demandes_contact
  for each row execute function public.notifier_demande_equipe();

-- AVANT : demandeur ou destinataire. APRÈS : + l'équipe du post-it (pour pouvoir répondre).
alter policy "demandes_lecture_participants" on public.demandes_contact
  using ((select auth.uid()) in (demandeur_id, destinataire_id) or public.est_equipe(annonce_id, (select auth.uid())));

-- Répondre au nom de l'équipe : celui qui accepte devient le destinataire (et seules SES coordonnées sont montrées).
create function public.repondre_demande(p_demande uuid, p_accepter boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_annonce uuid;
  v_statut text;
begin
  select annonce_id, statut into v_annonce, v_statut from public.demandes_contact where id = p_demande;
  if v_annonce is null or not public.est_equipe(v_annonce, (select auth.uid())) then
    raise exception 'Demande introuvable' using errcode = '42501';
  end if;
  if v_statut <> 'en_attente' then
    raise exception 'Cette demande a déjà reçu une réponse';
  end if;
  if p_accepter then
    update public.demandes_contact set destinataire_id = (select auth.uid()), statut = 'acceptee' where id = p_demande;
  else
    update public.demandes_contact set statut = 'refusee' where id = p_demande;
  end if;
end;
$$;
revoke execute on function public.repondre_demande(uuid, boolean) from public, anon;
grant execute on function public.repondre_demande(uuid, boolean) to authenticated;

-- ---------- 4. La discussion de groupe (règle d'or n°3 : ses participants) ----------
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
  new.auteur_id := (select auth.uid());
  new.cree_le := now();
  return new;
end;
$$;

-- AVANT : demandeur ou destinataire. APRÈS : + l'équipe du post-it.
alter policy "messages_lecture_participants" on public.messages
  using (
    exists (
      select 1 from public.demandes_contact d
      where d.id = demande_id
        and ((select auth.uid()) in (d.demandeur_id, d.destinataire_id) or public.est_equipe(d.annonce_id, (select auth.uid())))
    )
  );

-- Un message prévient tous les autres participants (un rappel non lu à la fois par conversation, comme avant).
create or replace function public.notifier_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dest uuid;
  v_lien text := '/demandes/' || new.demande_id;
begin
  for v_dest in
    select distinct p from (
      select d.demandeur_id as p from public.demandes_contact d where d.id = new.demande_id
      union all select d.destinataire_id from public.demandes_contact d where d.id = new.demande_id
      union all select a.auteur_id from public.demandes_contact d join public.annonces a on a.id = d.annonce_id where d.id = new.demande_id
      union all select m.membre_id from public.demandes_contact d join public.annonce_membres m on m.annonce_id = d.annonce_id
        where d.id = new.demande_id and m.statut = 'accepte'
    ) t
    where p <> new.auteur_id
  loop
    if not exists (select 1 from public.notifications where destinataire_id = v_dest and lien = v_lien and type = 'message' and not lu) then
      insert into public.notifications (destinataire_id, type, texte, lien)
      values (v_dest, 'message', '@' || public.pseudo_de(new.auteur_id) || ' t''a écrit', v_lien);
    end if;
  end loop;
  return new;
end;
$$;

-- ---------- 5. Une entraide de groupe compte pour toute l'équipe ----------
create or replace function public.stats_profil(cible uuid, depuis timestamptz default '-infinity')
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with relations as (
    -- « côté post-it » : destinataire, créateur ou membre accepté ; sinon je suis le demandeur.
    select a.categorie,
           case when d.demandeur_id = cible then d.destinataire_id else d.demandeur_id end as partenaire,
           case when d.demandeur_id = cible then a.type = 'cherche' else a.type = 'propose' end as j_aide
    from public.demandes_contact d
    join public.annonces a on a.id = d.annonce_id
    where d.statut = 'acceptee'
      and (cible in (d.demandeur_id, d.destinataire_id) or public.est_equipe(d.annonce_id, cible))
      and coalesce(d.repondu_le, d.cree_le) >= depuis
  )
  select json_build_object(
    'annonces', (select count(*) from public.annonces where auteur_id = cible and statut <> 'masquee' and cree_le >= depuis),
    'categories', (select count(distinct categorie) from public.annonces where auteur_id = cible and statut <> 'masquee' and cree_le >= depuis),
    'aides_donnees', (select count(distinct partenaire) from relations where j_aide),
    'aides_recues', (select count(distinct partenaire) from relations where not j_aide),
    'croisements', (
      select count(distinct r.partenaire) from relations r
      join public.profils moi on moi.id = cible
      join public.profils autre on autre.id = r.partenaire
      where moi.classe_id <> autre.classe_id
    ),
    'nb_avis', (select count(*) from public.avis where cible_id = cible and cree_le >= depuis),
    'note_moyenne', (select round(avg(note)::numeric, 1) from public.avis where cible_id = cible and cree_le >= depuis),
    'aides_par_categorie', (
      select coalesce(json_object_agg(categorie, n), '{}'::json)
      from (select categorie, count(distinct partenaire) as n from relations where j_aide group by categorie) t
    ),
    'defis_reussis', public.defis_reussis(cible, depuis),
    'commentaires', (select count(*) from public.commentaires where auteur_id = cible and cree_le >= depuis),
    'reactions_recues', (
      (select count(*) from public.reactions r join public.annonces a on a.id = r.cible_id
        where r.cible_type = 'annonce' and a.auteur_id = cible and r.auteur_id <> cible and r.cree_le >= depuis)
      + (select count(*) from public.reactions r join public.demandes_contact d on d.id = r.cible_id
        where r.cible_type = 'entraide' and cible in (d.demandeur_id, d.destinataire_id) and r.auteur_id <> cible and r.cree_le >= depuis)
    ),
    'serie', public.serie_semaines(cible)
  );
$$;
