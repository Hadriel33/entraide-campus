-- Préparation du lancement public : limites anti-spam et droit à l'effacement (RGPD).

-- 1. Anti-spam : limites par utilisateur, vérifiées en base (impossible à contourner depuis le client).
--    5 annonces / 24 h, 20 demandes de contact / 24 h, 30 messages / 10 min, 10 signalements / 24 h.
create function public.limiter_debit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_nb int;
  v_max int;
  v_fenetre interval;
  v_message text;
begin
  if v_uid is null or (select auth.role()) = 'service_role' or public.est_admin() then
    return new;
  end if;
  if tg_table_name = 'annonces' then
    select count(*) into v_nb from public.annonces where auteur_id = v_uid and cree_le > now() - interval '24 hours';
    v_max := 5; v_message := 'Limite atteinte : 5 annonces par jour. Réessaie demain.';
  elsif tg_table_name = 'demandes_contact' then
    select count(*) into v_nb from public.demandes_contact where demandeur_id = v_uid and cree_le > now() - interval '24 hours';
    v_max := 20; v_message := 'Limite atteinte : 20 demandes de contact par jour.';
  elsif tg_table_name = 'messages' then
    select count(*) into v_nb from public.messages where auteur_id = v_uid and cree_le > now() - interval '10 minutes';
    v_max := 30; v_message := 'Tu envoies beaucoup de messages : patiente quelques minutes.';
  elsif tg_table_name = 'signalements' then
    select count(*) into v_nb from public.signalements where auteur_id = v_uid and cree_le > now() - interval '24 hours';
    v_max := 10; v_message := 'Limite atteinte : 10 signalements par jour.';
  else
    return new;
  end if;
  if v_nb >= v_max then
    raise exception '%', v_message using errcode = 'P0429';
  end if;
  return new;
end;
$$;

revoke execute on function public.limiter_debit() from public, anon, authenticated;

create trigger annonces_limite before insert on public.annonces for each row execute function public.limiter_debit();
create trigger demandes_limite before insert on public.demandes_contact for each row execute function public.limiter_debit();
create trigger messages_limite before insert on public.messages for each row execute function public.limiter_debit();
create trigger signalements_limite before insert on public.signalements for each row execute function public.limiter_debit();

-- 2. Droit à l'effacement : un étudiant supprime son compte et TOUTES ses données (cascade :
--    profil, coordonnées, annonces, demandes, messages, avis, signalements). Seulement son propre compte.
create function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
