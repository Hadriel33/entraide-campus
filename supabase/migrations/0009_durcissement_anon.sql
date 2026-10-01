-- Chasse aux failles à blanc du 01/10 : durcissement pour les visiteurs non connectés.

-- F1 : un visiteur n'a aucun besoin d'écrire. On retire toute écriture au rôle anon (défense en profondeur,
-- en plus des policies RLS qui bloquaient déjà) : plus de message d'erreur qui dévoile une fonction interne.
revoke insert, update, delete, truncate on all tables in schema public from anon;
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon;

-- F2 : le trigger de demande répondait « annonce indisponible » même sans compte : un oracle pour deviner
-- si une annonce existe. On exige d'abord d'être connecté, avec un message neutre.
create or replace function public.demande_avant_insertion()
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

revoke execute on function public.demande_avant_insertion() from public, anon, authenticated;
