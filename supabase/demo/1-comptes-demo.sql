-- ============================================================================
-- CAMPUS DE DÉMO, PARTIE 1 : LES COMPTES (à lancer par Hadriel dans Supabase › SQL Editor).
-- 40 étudiants fictifs (20 ESD, 20 ESP). Aucun mot de passe : personne ne peut s'y connecter.
-- Repère : leurs emails commencent tous par « demo-postit- ». Effaçables avec 3-nettoyage-demo.sql.
-- La partie 2 (2-vie-du-campus.sql) remplit ensuite annonces, demandes, avis, classes, Colette...
-- ============================================================================
delete from auth.users where email like 'demo-postit-%';

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at)
select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'demo-postit-' || pseudo || '@' || case ecole when 'ESD' then 'mail-esd.com' else 'mail-esp.com' end,
       json_build_object('prenom', prenom, 'pseudo', pseudo)::jsonb, now()
from (values
  ('lea.gala','Léa','ESD'), ('tom.dev','Tom','ESD'), ('ines.ux','Inès','ESD'), ('hugo.data','Hugo','ESD'),
  ('adam.web','Adam','ESD'), ('enzo.covoit','Enzo','ESD'), ('yanis.growth','Yanis','ESD'), ('emma.chef','Emma','ESD'),
  ('nathan.code','Nathan','ESD'), ('chloe.uxui','Chloé','ESD'), ('lucas.nocode','Lucas','ESD'), ('manon.data','Manon','ESD'),
  ('theo.react','Théo','ESD'), ('sarah.product','Sarah','ESD'), ('raphael.ia','Raphaël','ESD'), ('camille.web','Camille','ESD'),
  ('maxime.ecom','Maxime','ESD'), ('julie.motion','Julie','ESD'), ('karim.python','Karim','ESD'), ('alice.figma','Alice','ESD'),
  ('sam.photo','Sam','ESP'), ('noe.motion','Noé','ESP'), ('maya.da','Maya','ESP'), ('jade.event','Jade','ESP'),
  ('lina.modele','Lina','ESP'), ('clara.asso','Clara','ESP'), ('zoe.contenu','Zoé','ESP'), ('louis.video','Louis','ESP'),
  ('oceane.brand','Océane','ESP'), ('arthur.pub','Arthur','ESP'), ('lou.influence','Lou','ESP'), ('nina.style','Nina','ESP'),
  ('paul.copy','Paul','ESP'), ('eva.illu','Eva','ESP'), ('leo.photo','Léo','ESP'), ('mila.social','Mila','ESP'),
  ('gabriel.media','Gabriel','ESP'), ('rose.event','Rose','ESP'), ('axel.dop','Axel','ESP'), ('lena.rse','Léna','ESP')
) as t(pseudo, prenom, ecole);

select count(*) as comptes_demo_crees from auth.users where email like 'demo-postit-%';
