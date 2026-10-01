-- Tests de sécurité de la table annonces (règle d'or n°2). Transactions annulées : rien n'est conservé.
-- Résultats obtenus le 01/10/2026 : tous conformes.

-- Test 1 : B ne modifie ni ne supprime l'annonce de A, et ne voit pas l'archive de A.
-- Attendu : 0 | 0 | 1
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sam.test@mail-esp.com','{"prenom":"Sam","ecole":"ESP","pseudo":"sam.test"}'),
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lea.test@mail-esd.com','{"prenom":"Léa","ecole":"ESD","pseudo":"lea.test"}');
insert into public.annonces (id, auteur_id, type, categorie, titre, description, contrepartie, statut) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','propose','photo','Photos pour vos événements','Soirées, galas, tournois, retouche comprise.','gratuit','publiee'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000a','propose','video','Montage vidéo archivé','Une ancienne annonce que Sam a archivée.','troc','archivee');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
with m as (update public.annonces set titre = 'Piratée par Léa' where id = '10000000-0000-0000-0000-000000000001' returning 1),
     s as (delete from public.annonces where id = '10000000-0000-0000-0000-000000000001' returning 1)
select (select count(*) from m) as b_modifie_a, (select count(*) from s) as b_supprime_a, (select count(*) from public.annonces) as visibles_par_b;
rollback;

-- Test 2 : A voit ses annonces archivées et peut les modifier. Attendu : 2 | 1
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sam.test@mail-esp.com','{"prenom":"Sam","ecole":"ESP","pseudo":"sam.test"}');
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, statut) values
 ('00000000-0000-0000-0000-00000000000a','propose','photo','Photos pour vos événements','Soirées, galas, tournois, retouche comprise.','gratuit','archivee'),
 ('00000000-0000-0000-0000-00000000000a','cherche','coloc','Chambre près de Victor Hugo','Tram A ou B, budget 550 euros, dès novembre.','a_discuter','publiee');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
with m as (update public.annonces set titre = 'Photos pour vos soirées' where statut = 'archivee' returning 1)
select (select count(*) from public.annonces) as a_voit, (select count(*) from m) as a_modifie;
rollback;

-- Test 3 : B ne peut pas publier au nom de A. Attendu : ERROR 42501 new row violates row-level security policy
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sam.test@mail-esp.com','{"prenom":"Sam","ecole":"ESP","pseudo":"sam.test"}'),
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lea.test@mail-esd.com','{"prenom":"Léa","ecole":"ESD","pseudo":"lea.test"}');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
values ('00000000-0000-0000-0000-00000000000a','propose','photo','Fausse annonce au nom de Sam','Léa essaie de publier au nom de Sam.','gratuit');
rollback;

-- Test 4 : sans connexion, aucune annonce visible. Attendu : 0
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sam.test@mail-esp.com','{"prenom":"Sam","ecole":"ESP","pseudo":"sam.test"}');
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie) values
 ('00000000-0000-0000-0000-00000000000a','propose','photo','Photos pour vos événements','Soirées, galas, tournois, retouche comprise.','gratuit');
set local role anon;
select count(*) as visibles_anonyme from public.annonces;
rollback;
