-- Tests de sécurité de la table profils (à rejouer après toute migration).
-- Chaque bloc s'exécute dans une transaction annulée : rien n'est conservé.
-- Résultats obtenus le 01/10/2026 : tous conformes.

-- Test 1 : B ne peut pas modifier le profil de A, mais peut modifier le sien.
-- Attendu : 0 | 1 | 2 | 'Léa' (espaces retirés par le trigger)
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sam.test@exemple.fr','{"prenom":"Sam","ecole":"ESD"}'),
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lea.test@exemple.fr','{"prenom":" Léa ","ecole":"ESP"}');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
with a as (update public.profils set prenom = 'Pirate' where id = '00000000-0000-0000-0000-00000000000a' returning 1),
     b as (update public.profils set prenom = 'Léa B.' where id = '00000000-0000-0000-0000-00000000000b' returning 1)
select (select count(*) from a) as b_modifie_a,
       (select count(*) from b) as b_modifie_soi,
       (select count(*) from public.profils) as profils_visibles,
       (select prenom from public.profils where id = '00000000-0000-0000-0000-00000000000b') as prenom_nettoye;
rollback;

-- Test 2 : on ne peut pas changer son école. Attendu : ERROR 42501 permission denied.
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lea.test@exemple.fr','{"prenom":"Léa","ecole":"ESP"}');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
update public.profils set ecole = 'ESD' where id = '00000000-0000-0000-0000-00000000000b';
rollback;

-- Test 3 : sans connexion, aucun profil n'est visible. Attendu : 0
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lea.test@exemple.fr','{"prenom":"Léa","ecole":"ESP"}');
set local role anon;
select count(*) as profils_visibles_anonyme from public.profils;
rollback;
