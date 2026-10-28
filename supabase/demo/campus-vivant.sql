-- ============================================================================
-- CAMPUS VIVANT (28/10/2026) : de quoi voir et tester les retours du prof, en un seul bloc.
-- À lancer APRÈS campus-demo.sql. Ajoute, sans rien effacer :
--   15 étudiants fictifs dans les 5 autres campus (emails « demo-postit- », sans mot de passe),
--   des annonces récentes de TOUTES les catégories (donc toutes les formes de post-it), sur les 6 campus,
--   des entraides acceptées dans chaque campus (championnat), des commentaires, des réactions,
--   des messages dans les salons (général, campus).
-- Chaque action est jouée sous l'identité de son auteur : les règles de la base s'appliquent.
-- Tout s'efface avec nettoyage-demo.sql (comptes « demo-postit- » en cascade). Relançable.
-- ============================================================================
do $vivant$
declare
  a record; v_id uuid; v_dem uuid; v_auteur uuid; v_cible uuid; i int := 0;
begin

-- 1. Étudiants des autres campus (le trigger d'inscription crée profil et coordonnées, avec le campus).
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at)
select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'demo-postit-' || t.pseudo || '@mail-esp.com',
       json_build_object('prenom', t.prenom, 'pseudo', t.pseudo, 'campus', t.campus)::jsonb, now() - interval '20 days'
from (values
  ('jules.paris','Jules','Paris'), ('ambre.paris','Ambre','Paris'), ('ilyes.paris','Ilyès','Paris'),
  ('margot.lyon','Margot','Lyon'), ('nolan.lyon','Nolan','Lyon'), ('sacha.lyon','Sacha','Lyon'),
  ('lucie.tlse','Lucie','Toulouse'), ('mehdi.tlse','Mehdi','Toulouse'), ('romane.tlse','Romane','Toulouse'),
  ('victor.nantes','Victor','Nantes'), ('anais.nantes','Anaïs','Nantes'), ('tim.nantes','Tim','Nantes'),
  ('elsa.lille','Elsa','Lille'), ('bastien.lille','Bastien','Lille'), ('yasmine.lille','Yasmine','Lille')
) as t(pseudo, prenom, campus)
where not exists (select 1 from public.profils p where p.pseudo = t.pseudo);

-- Leur Colette : une couleur et une humeur chacun, et ils apparaissent dans le fil.
update public.profils p set
  colette_couleur = (array['jaune','lilas','ciel','ocre'])[1 + (abs(hashtext(p.pseudo)) % 4)],
  colette_humeur = (array['contente','surprise','fiere','concentree'])[1 + (abs(hashtext(p.pseudo || 'h')) % 4)],
  fil_public = true
where p.pseudo in ('jules.paris','ambre.paris','ilyes.paris','margot.lyon','nolan.lyon','sacha.lyon','lucie.tlse','mehdi.tlse',
                   'romane.tlse','victor.nantes','anais.nantes','tim.nantes','elsa.lille','bastien.lille','yasmine.lille');

-- 2. L'ancien texte « ESD × ESP » des annonces de démo devient « dev × créa ».
update public.annonces set titre = replace(titre, 'ESD × ESP', 'dev × créa'),
                           description = replace(replace(description, 'les deux écoles', 'deux formations'), 'ESD × ESP', 'dev × créa')
where titre like '%ESD%' or description like '%ESD%' or description like '%deux écoles%';

-- 3. Des annonces récentes de toutes les catégories (heures étalées sur 3 jours).
for a in
  select * from (values
    ('enzo.covoit','propose','covoiturage','Covoit Mérignac → campus, lundi et jeudi 8 h','Deux places dans ma voiture, départ place Charles de Gaulle. On partage l''essence, la musique se vote.','partage_frais','merignac','A', 2),
    ('yanis.growth','cherche','covoiturage','Je cherche un covoit depuis Pessac le mardi','Cours à 9 h le mardi, je participe aux frais et j''apporte les croissants.','partage_frais','talence_pessac','B', 5),
    ('nathan.code','cherche','coloc','Chambre en coloc près de Saint-Michel dès janvier','Calme, cuisine bien, horaires d''étudiant en alternance. Budget autour de 450 €.','a_discuter','saint_michel','C', 8),
    ('jade.event','propose','coloc','Une chambre se libère à la Bastide','Coloc de trois, 420 € charges comprises, à 10 minutes du campus en tram A.','a_discuter','bastide','A', 11),
    ('louis.video','propose','materiel','Je prête mon Sony A7 III et deux optiques','Pour un week-end, contre un café et un retour en bon état. Batteries chargées.','gratuit','chartrons','B', 14),
    ('lucas.nocode','cherche','materiel','Besoin d''un trépied et d''un micro-cravate vendredi','Tournage d''une interview pour mon projet de B1, je rends tout samedi matin.','troc','victor_hugo','B', 17),
    ('lina.modele','propose','shooting','Modèle dispo pour vos shootings mode ou portrait','J''ai l''habitude de poser, je viens avec deux tenues. Tu m''envoies quelques photos en échange.','troc','centre','A', 20),
    ('julie.motion','cherche','shooting','Deux modèles pour un clip de 30 secondes','Tournage d''une heure aux Bassins à flot, ambiance soirée. Rémunéré en bons d''achat.','remunere','bacalan','B', 23),
    ('hugo.data','cherche','binome','Binôme pour le hackathon data du campus','Deux jours en novembre : je code en Python, je cherche quelqu''un qui sait raconter et designer.','gratuit','victor_hugo','B', 26),
    ('sam.photo','propose','photo','Portraits pro pour ton LinkedIn','15 minutes au campus, lumière naturelle, retouche légère. Parfait avant les candidatures d''alternance.','gratuit','victor_hugo','B', 29),
    ('theo.react','propose','dev','Je débloque ton site Next.js ou WordPress','Une heure en visio : bug, déploiement, formulaire qui ne marche pas. On regarde ensemble.','troc',null,null, 32),
    ('maya.da','propose','design','Je refais le logo de ton asso','Trois pistes, deux allers-retours, fichiers prêts pour l''impression et les réseaux.','troc','centre','A', 35),
    ('jules.paris','propose','covoiturage','Covoit Paris → Lille vendredi soir','Deux places, départ porte de Versailles à 18 h, retour dimanche.','partage_frais','paris_campus',null, 3),
    ('ambre.paris','cherche','coloc','Je cherche une coloc dans le 15e','Pour février, près du campus. Je suis en B3, plutôt du matin.','a_discuter','paris_campus',null, 9),
    ('ilyes.paris','propose','photo','Shooting produit pour ta boutique en ligne','Fond blanc, lumière studio, dix photos retouchées.','remunere','paris_marais',null, 15),
    ('margot.lyon','propose','materiel','Je prête un ring light et un fond vert','Pour tes vidéos ou tes lives, à récupérer à Jean Jaurès.','gratuit','lyon_campus',null, 4),
    ('nolan.lyon','cherche','dev','Aide sur mon portfolio en React','Une heure pour comprendre pourquoi mes images ne s''affichent pas en ligne.','troc','lyon_part_dieu',null, 12),
    ('sacha.lyon','propose','coloc','Coloc à Guillotière, une chambre libre','Dès décembre, 480 €, grande cuisine et balcon.','a_discuter','lyon_guillotiere',null, 21),
    ('lucie.tlse','cherche','shooting','Modèle pour un projet photo sur les marchés','Une matinée au marché Victor Hugo de Toulouse, ambiance documentaire.','gratuit','toulouse_capitole',null, 6),
    ('mehdi.tlse','propose','covoiturage','Covoit Purpan → Cartoucherie tous les matins','Départ 8 h 15, retour 17 h 30, trois places.','partage_frais','toulouse_purpan',null, 13),
    ('romane.tlse','propose','redaction','Je relis tes dossiers et ton mémoire','Orthographe, structure, et un œil neuf sur ton introduction.','gratuit','toulouse_carmes',null, 24),
    ('victor.nantes','cherche','binome','Binôme pour un projet de marque','Projet de M1 sur une marque de vélos : je cherche quelqu''un en stratégie ou en design.','gratuit','nantes_ile_de_nantes',null, 7),
    ('anais.nantes','propose','video','Montage de tes reels en 48 h','Sous-titres, rythme, musique libre de droits.','troc','nantes_campus',null, 16),
    ('tim.nantes','cherche','materiel','Je cherche un stabilisateur pour samedi','Tournage d''un court-métrage, je rends tout dimanche.','troc','nantes_centre',null, 27),
    ('elsa.lille','propose','ux_ui','Test utilisateur de ton appli contre un café','Je teste ton parcours en 20 minutes et je te fais un retour écrit.','gratuit','lille_campus',null, 10),
    ('bastien.lille','cherche','coloc','Chambre près de Vauban pour le second semestre','Je rentre d''Erasmus en janvier, budget 450 €.','a_discuter','lille_vauban',null, 19),
    ('yasmine.lille','propose','data_ia','Ton premier tableau de bord Power BI','On part de ton Excel et on construit un tableau de bord clair, en une heure.','troc','lille_euralille',null, 30)
  ) as t(pseudo, type, categorie, titre, description, contrepartie, quartier, tram, heures)
loop
  select id into v_auteur from public.profils where pseudo = a.pseudo;
  continue when v_auteur is null or exists (select 1 from public.annonces where auteur_id = v_auteur and titre = a.titre);
  perform set_config('request.jwt.claims', json_build_object('sub', v_auteur, 'role', 'authenticated')::text, true);
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier, tram)
  values (v_auteur, a.type, a.categorie, a.titre, a.description, a.contrepartie, a.quartier, a.tram)
  returning id into v_id;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok', cree_le = now() - make_interval(hours => a.heures) where id = v_id;
end loop;

-- 4. Des entraides acceptées dans chaque autre campus (le championnat s'anime).
for a in
  select * from (values
    ('ambre.paris','Covoit Paris → Lille vendredi soir'), ('jules.paris','Shooting produit pour ta boutique en ligne'),
    ('nolan.lyon','Je prête un ring light et un fond vert'), ('margot.lyon','Coloc à Guillotière, une chambre libre'),
    ('lucie.tlse','Covoit Purpan → Cartoucherie tous les matins'), ('mehdi.tlse','Je relis tes dossiers et ton mémoire'),
    ('tim.nantes','Montage de tes reels en 48 h'), ('victor.nantes','Montage de tes reels en 48 h'),
    ('bastien.lille','Test utilisateur de ton appli contre un café'), ('elsa.lille','Ton premier tableau de bord Power BI')
  ) as t(demandeur, titre)
loop
  select id into v_dem from public.profils where pseudo = a.demandeur;
  select id, auteur_id into v_id, v_auteur from public.annonces where titre = a.titre limit 1;
  continue when v_dem is null or v_id is null or exists (select 1 from public.demandes_contact where annonce_id = v_id and demandeur_id = v_dem);
  perform set_config('request.jwt.claims', json_build_object('sub', v_dem, 'role', 'authenticated')::text, true);
  insert into public.demandes_contact (annonce_id, destinataire_id, message) values (v_id, v_auteur, 'Salut ! Ça m''intéresse beaucoup, tu es dispo cette semaine ?')
  returning id into v_cible;
  perform set_config('request.jwt.claims', json_build_object('sub', v_auteur, 'role', 'authenticated')::text, true);
  update public.demandes_contact set statut = 'acceptee' where id = v_cible;
end loop;

-- 5. Des commentaires sous les annonces récentes et les entraides du fil.
for a in
  select * from (values
    ('annonce','Portraits pro pour ton LinkedIn','lea.gala','Je prends ! Mardi midi ça te va ?'),
    ('annonce','Portraits pro pour ton LinkedIn','emma.chef','Trop utile avant les alternances, merci'),
    ('annonce','Une chambre se libère à la Bastide','karim.python','Elle est encore dispo ? Je cherche pour janvier'),
    ('annonce','Je prête mon Sony A7 III et deux optiques','noe.motion','Énorme, je te le rendrai nickel'),
    ('annonce','Binôme pour le hackathon data du campus','oceane.brand','Je fais le design et le pitch, on en parle ?'),
    ('annonce','Covoit Mérignac → campus, lundi et jeudi 8 h','adam.web','Lundi je suis partant, je paie les croissants'),
    ('annonce','Je refais le logo de ton asso','clara.asso','Le BDE a besoin de toi, je t''écris'),
    ('annonce','Deux modèles pour un clip de 30 secondes','nina.style','Partante ! J''amène une amie ?'),
    ('annonce','Coloc à Guillotière, une chambre libre','nolan.lyon','Je fais tourner à ma promo'),
    ('annonce','Covoit Paris → Lille vendredi soir','ilyes.paris','Il reste une place pour vendredi ?'),
    ('annonce','Ton premier tableau de bord Power BI','bastien.lille','Je viens avec mon Excel de l''asso')
  ) as t(cible, titre, pseudo, contenu)
loop
  select id into v_auteur from public.profils where pseudo = a.pseudo;
  select id into v_cible from public.annonces where titre = a.titre limit 1;
  continue when v_auteur is null or v_cible is null or exists (select 1 from public.commentaires where cible_id = v_cible and auteur_id = v_auteur);
  perform set_config('request.jwt.claims', json_build_object('sub', v_auteur, 'role', 'authenticated')::text, true);
  insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_cible, a.contenu);
end loop;

-- Les 8 dernières entraides du fil : un « bravo » de la promo et un mot gentil.
for a in select f.id, (select pseudo from public.profils order by md5(f.id::text || pseudo) limit 1) as pseudo
         from public.fil_social(8) f
loop
  i := i + 1;
  select id into v_auteur from public.profils where pseudo = a.pseudo;
  continue when exists (select 1 from public.commentaires where cible_id = a.id);
  perform set_config('request.jwt.claims', json_build_object('sub', v_auteur, 'role', 'authenticated')::text, true);
  begin
    insert into public.commentaires (cible_type, cible_id, contenu)
    values ('entraide', a.id, (array['Bravo à vous deux !', 'Trop bien cette entraide', 'Ça donne envie, je publie la mienne', 'Le campus qui s''entraide, on adore'])[1 + i % 4]);
  exception when others then null; -- un participant ne commente pas sa propre entraide ici
  end;
end loop;

-- 6. Des réactions : chaque étudiant de démo réagit à quelques posts récents (jamais aux siens).
for a in
  select p.id as auteur, x.cible_type, x.cible_id, (array['bravo','feu','merci','mdr'])[1 + (abs(hashtext(p.pseudo || x.cible_id::text)) % 4)] as type
  from public.profils p
  cross join lateral (
    select 'annonce' as cible_type, an.id as cible_id from public.annonces an
    where an.statut = 'publiee' and an.cree_le > now() - interval '4 days' and an.auteur_id <> p.id
    order by md5(p.id::text || an.id::text) limit 3
  ) x
  where p.pseudo in (select pseudo from public.profils where id in (select id from auth.users where email like 'demo-postit-%'))
loop
  continue when exists (select 1 from public.reactions where cible_id = a.cible_id and auteur_id = a.auteur and type = a.type);
  perform set_config('request.jwt.claims', json_build_object('sub', a.auteur, 'role', 'authenticated')::text, true);
  begin
    insert into public.reactions (cible_type, cible_id, type) values (a.cible_type, a.cible_id, a.type);
  exception when others then null;
  end;
end loop;

-- 7. Les salons : le général, et le campus de quelques villes.
for a in
  select * from (values
    ('general','raphael.ia','Qui vient à la soirée du BDE jeudi ?', 50),
    ('general','margot.lyon','Coucou de Lyon ! On est cinq à tester l''appli ici', 44),
    ('general','jules.paris','Paris est dans la course au championnat, attention', 38),
    ('general','sam.photo','Bordeaux mène encore ce mois-ci, on lâche rien', 30),
    ('general','elsa.lille','Lille arrive, on a trois entraides cette semaine', 22),
    ('campus:Bordeaux','clara.asso','Quelqu''un a une rallonge pour le stand de vendredi ?', 40),
    ('campus:Bordeaux','enzo.covoit','Covoit Mérignac lundi : il reste une place', 26),
    ('campus:Bordeaux','lea.gala','Le hackathon data, on fait une équipe à quatre ?', 15),
    ('campus:Bordeaux','hugo.data','Partant, je m''occupe des données', 12),
    ('campus:Lyon','nolan.lyon','Quelqu''un connaît un bon spot pour un shooting à la Croix-Rousse ?', 33),
    ('campus:Lyon','sacha.lyon','Les pentes, en fin de journée, c''est magique', 31),
    ('campus:Paris','ambre.paris','On se fait un afterwork Convention jeudi ?', 18),
    ('campus:Nantes','anais.nantes','Je monte un reel sur le campus, qui veut apparaître ?', 9),
    ('campus:Toulouse','mehdi.tlse','Le covoit de Purpan démarre lundi, venez !', 7),
    ('campus:Lille','bastien.lille','Je rentre d''Erasmus en janvier, des plans coloc ?', 5)
  ) as t(salon, pseudo, contenu, minutes)
loop
  select id into v_auteur from public.profils where pseudo = a.pseudo;
  continue when v_auteur is null or exists (select 1 from public.salon_messages where auteur_id = v_auteur and contenu = a.contenu);
  perform set_config('request.jwt.claims', json_build_object('sub', v_auteur, 'role', 'authenticated')::text, true);
  insert into public.salon_messages (salon, contenu) values (a.salon, a.contenu) returning id into v_id;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.salon_messages set cree_le = now() - make_interval(mins => a.minutes) where id = v_id;
end loop;

perform set_config('request.jwt.claims', '', true);
raise notice 'Campus vivant prêt : % annonces récentes, % commentaires, % réactions, % messages de salon',
  (select count(*) from public.annonces where cree_le > now() - interval '3 days'),
  (select count(*) from public.commentaires), (select count(*) from public.reactions), (select count(*) from public.salon_messages);
end $vivant$;
