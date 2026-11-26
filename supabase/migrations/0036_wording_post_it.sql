-- 0036 (26/11/2026) : les notifications écrites par la base disent « post-it » (repasse wording, retour de test du 19/11).
-- Seuls deux TEXTES changent ; même signature, même logique, mêmes droits. Aucune règle RLS n'est touchée.
--   AVANT : 'Ton annonce « … » est en attente de vérification'   /  'Ton annonce « … » expire bientôt : toujours d''actualité ?'
--   APRÈS : 'Ton post-it « … » est en attente de vérification'   /  'Ton post-it « … » expire bientôt : toujours d''actualité ?'
-- Les noms techniques (types 'annonce_masquee', 'annonce_expire', table annonces) ne changent pas.

create or replace function public.notifier_masquage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.statut = 'masquee' and old.statut is distinct from 'masquee' then
    insert into public.notifications (destinataire_id, type, texte, lien)
    values (new.auteur_id, 'annonce_masquee', 'Ton post-it « ' || left(new.titre, 60) || ' » est en attente de vérification', '/annonces/' || new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.notifier_masquage() from public, anon, authenticated;

create or replace function public.relancer_annonces_bientot_expirees()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  with a_relancer as (
    update public.annonces
       set relance_envoyee = true
     where statut = 'publiee' and not relance_envoyee and expire_le between now() and now() + interval '3 days'
    returning id, auteur_id, titre
  )
  insert into public.notifications (destinataire_id, type, texte, lien)
  select auteur_id, 'annonce_expire', 'Ton post-it « ' || left(titre, 60) || ' » expire bientôt : toujours d''actualité ?', '/annonces/' || id
  from a_relancer;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.relancer_annonces_bientot_expirees() from public, anon, authenticated;
