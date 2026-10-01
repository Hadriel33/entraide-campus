-- ============================================================================
-- EFFACER LE CAMPUS DE DÉMO (avant l'ouverture au vrai campus).
-- À coller dans Supabase › SQL Editor, puis « Run ».
-- Supprimer les comptes efface en cascade leurs profils, coordonnées, annonces, demandes,
-- messages, avis, favoris et notifications (même mécanisme que « Supprimer mon compte »).
-- Seuls les comptes dont l'email commence par « demo-postit- » sont touchés.
-- ============================================================================
delete from auth.users where email like 'demo-postit-%';

select
  (select count(*) from auth.users where email like 'demo-postit-%') as comptes_demo_restants,
  (select count(*) from public.profils) as profils_restants;
