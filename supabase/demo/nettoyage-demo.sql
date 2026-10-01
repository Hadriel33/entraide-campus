-- ============================================================================
-- EFFACER LE CAMPUS DE DÉMO (avant l'ouverture au vrai campus).
-- Supprimer les comptes « demo-postit- » efface en cascade leurs profils, annonces, demandes,
-- messages, avis, favoris, signalements et notifications (comme « Supprimer mon compte »).
-- Pour le compte de Hadriel : ses 3 annonces de démo et ses réglages de démo sont remis à zéro.
-- ============================================================================
begin;
delete from auth.users where email like 'demo-postit-%';

delete from public.annonces a using public.profils p
where a.auteur_id = p.id and p.pseudo = 'hadri'
  and a.titre in ('Je t''aide sur ton projet Next.js et Supabase', 'Dashboards Power BI pour ton asso', 'Monteur pour la vidéo de démo de mon appli');

update public.profils set colette_accessoire = 'aucun', colette_motif = 'uni' where pseudo = 'hadri';
commit;

select
  (select count(*) from auth.users where email like 'demo-postit-%') as comptes_demo_restants,
  (select count(*) from public.annonces) as annonces_restantes,
  (select count(*) from public.profils) as profils_restants;
