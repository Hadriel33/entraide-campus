-- Faille trouvée le 02/10 grâce au campus de démo : une annonce classée « à vérifier » par l'IA (ex. un numéro
-- de téléphone écrit dans le texte) restait visible de tous sur le mur. Ça contournait la règle d'or n°1.
-- Désormais, tant qu'elle est « à vérifier », seuls son auteur (qui voit la correction proposée) et l'admin la voient.
-- Elle réapparaît dès que l'auteur corrige son texte (la modération repart) ou qu'un admin la valide.

-- AVANT : using (statut = 'publiee' or (select auth.uid()) = auteur_id)
drop policy "annonces_lecture" on public.annonces;
create policy "annonces_lecture"
  on public.annonces for select
  to authenticated
  using ((statut = 'publiee' and moderation <> 'a_verifier') or (select auth.uid()) = auteur_id);
-- (la policy « annonces_lecture_admin » de 0005 laisse l'admin tout voir, inchangée)

-- Même règle pour la demande de contact : impossible de viser une annonce cachée en connaissant son id.
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
  if new.demandeur_id = new.destinataire_id then
    raise exception 'Tu ne peux pas demander ton propre contact';
  end if;
  return new;
end;
$$;
revoke execute on function public.demande_avant_insertion() from public, anon, authenticated;

-- Les chiffres publics (mur, accueil) ne comptent plus les annonces cachées.
create or replace function public.stats_publiques()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'etudiants', (select count(*) from public.profils),
    'annonces_actives', (select count(*) from public.annonces where statut = 'publiee' and moderation <> 'a_verifier' and expire_le > now()),
    'entraides', (select count(*) from public.demandes_contact where statut = 'acceptee'),
    'croisements', (
      select count(*) from public.demandes_contact d
      join public.profils a on a.id = d.demandeur_id
      join public.profils b on b.id = d.destinataire_id
      where d.statut = 'acceptee' and a.ecole <> b.ecole
    )
  );
$$;
