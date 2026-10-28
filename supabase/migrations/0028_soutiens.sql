-- 0028 (28/10/2026) : « Je soutiens », pour faire monter un post-it (celui d'un pote, ou une demande qui me concerne aussi).
-- Un soutien par personne et par post-it, jamais sur son propre post-it, aucun point au classement : rien à gagner à tricher.
-- Nouvelle table : aucune policy existante n'est modifiée.

create table public.soutiens (
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (annonce_id, auteur_id)
);
create index soutiens_recents_idx on public.soutiens (cree_le desc);

create function public.soutien_avant_insertion()
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
  if not public.cible_visible('annonce', new.annonce_id) then
    raise exception 'Post-it introuvable' using errcode = '42501';
  end if;
  if new.auteur_id = any (coalesce(public.proprietaires_cible('annonce', new.annonce_id), '{}')) then
    raise exception 'Pas de soutien sur ton propre post-it' using errcode = '22023';
  end if;
  if (select count(*) from public.soutiens where auteur_id = new.auteur_id and cree_le > now() - interval '10 minutes') >= 30 then
    raise exception 'Tu soutiens beaucoup : patiente quelques minutes.' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
revoke execute on function public.soutien_avant_insertion() from public, anon, authenticated;
create trigger soutiens_avant_insertion before insert on public.soutiens
  for each row execute function public.soutien_avant_insertion();

alter table public.soutiens enable row level security;
create policy "soutiens_lecture" on public.soutiens for select to authenticated
  using (public.cible_visible('annonce', annonce_id));
create policy "soutiens_ajout_soi" on public.soutiens for insert to authenticated
  with check ((select auth.uid()) = auteur_id);
create policy "soutiens_retrait_soi" on public.soutiens for delete to authenticated
  using ((select auth.uid()) = auteur_id);
revoke all on public.soutiens from anon;
revoke update, truncate on public.soutiens from authenticated;
grant select, insert, delete on public.soutiens to authenticated;

-- Notifications : on prévient l'auteur aux paliers (1, 3, 5, 10, 20, 50), pas à chaque clic.
-- Le type « groupe » servira aux post-its de groupe (étape suivante) : ajouté ici pour ne toucher la contrainte qu'une fois.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('demande_recue', 'demande_acceptee', 'demande_refusee', 'message', 'avis', 'annonce_masquee', 'annonce_expire', 'commentaire', 'soutien', 'groupe'));

create function public.notifier_soutien()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n int;
  v_dest uuid;
  v_titre text;
  v_texte text;
begin
  select count(*) into v_n from public.soutiens where annonce_id = new.annonce_id;
  if v_n not in (1, 3, 5, 10, 20, 50) then
    return new;
  end if;
  -- Un palier ne se fête qu'une fois (si quelqu'un retire puis remet son soutien, pas de doublon).
  if exists (select 1 from public.notifications where type = 'soutien' and lien = '/annonces/' || new.annonce_id and texte like v_n || ' %') then
    return new;
  end if;
  select left(titre, 60) into v_titre from public.annonces where id = new.annonce_id;
  v_texte := case when v_n = 1
    then '1 personne soutient ton post-it « ' || v_titre || ' » (@' || public.pseudo_de(new.auteur_id) || ')'
    else v_n || ' personnes soutiennent ton post-it « ' || v_titre || ' »' end;
  foreach v_dest in array coalesce(public.proprietaires_cible('annonce', new.annonce_id), '{}') loop
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (v_dest, 'soutien', left(v_texte, 200), '/annonces/' || new.annonce_id);
  end loop;
  return new;
end;
$$;
revoke execute on function public.notifier_soutien() from public, anon, authenticated;
create trigger soutiens_notifier after insert on public.soutiens
  for each row execute function public.notifier_soutien();

-- « Ça monte » : les post-its visibles les plus soutenus ces 30 derniers jours.
-- security invoker : la RLS des soutiens et des annonces s'applique à celui qui demande.
create function public.annonces_ca_monte(limite integer default 40)
returns table (annonce_id uuid, n integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.annonce_id, count(*)::int as n
  from public.soutiens s
  join public.annonces a on a.id = s.annonce_id
  where s.cree_le > now() - interval '30 days'
    and a.statut = 'publiee' and a.expire_le > now()
  group by s.annonce_id
  order by n desc, max(s.cree_le) desc
  limit least(greatest(limite, 1), 100);
$$;
revoke execute on function public.annonces_ca_monte(integer) from public, anon;
grant execute on function public.annonces_ca_monte(integer) to authenticated;
