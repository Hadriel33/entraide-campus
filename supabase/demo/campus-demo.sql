-- ============================================================================
-- CAMPUS DE DÉMO : 16 étudiants fictifs, 20 annonces, des entraides, des avis.
-- À coller dans Supabase › SQL Editor, puis « Run ». Rejouable (efface la démo précédente d'abord).
-- Tout est effaçable d'un coup avec supabase/demo/nettoyage-demo.sql.
--
-- Ces comptes n'ont PAS de mot de passe : personne ne peut s'y connecter. Ils servent à remplir
-- le mur, la carte, le classement, le fil du campus et le tableau d'impact.
-- Repère : leurs emails commencent tous par « demo-postit- ».
-- ============================================================================
begin;

delete from auth.users where email like 'demo-postit-%';

-- 1. Les étudiants (8 ESD, 8 ESP). L'école est déduite du domaine par le trigger d'inscription.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'demo-postit-' || pseudo || '@' || domaine, json_build_object('prenom', prenom, 'pseudo', pseudo)::jsonb
from (values
  ('sam.photo', 'Sam', 'mail-esp.com'), ('lea.gala', 'Léa', 'mail-esd.com'), ('tom.dev', 'Tom', 'mail-esd.com'),
  ('ines.ux', 'Inès', 'mail-esd.com'), ('noe.motion', 'Noé', 'mail-esp.com'), ('maya.da', 'Maya', 'mail-esp.com'),
  ('hugo.data', 'Hugo', 'mail-esd.com'), ('jade.event', 'Jade', 'mail-esp.com'), ('adam.web', 'Adam', 'mail-esd.com'),
  ('lina.modele', 'Lina', 'mail-esp.com'), ('enzo.covoit', 'Enzo', 'mail-esd.com'), ('clara.asso', 'Clara', 'mail-esp.com'),
  ('yanis.growth', 'Yanis', 'mail-esd.com'), ('zoe.contenu', 'Zoé', 'mail-esp.com'), ('louis.video', 'Louis', 'mail-esp.com'),
  ('emma.chef', 'Emma', 'mail-esd.com')
) as t(pseudo, prenom, domaine);

-- 2. Profils : classes, Colette, fil du campus, inscriptions étalées sur 25 jours.
update public.profils p set
  classe_id = c.id,
  colette_couleur = (array['jaune','lilas','ciel','ocre'])[1 + (abs(hashtext(p.pseudo)) % 4)],
  colette_accessoire = (array['aucun','casque','photo','design','dev','data','coloc','covoit'])[1 + (abs(hashtext(p.pseudo || 'x')) % 8)],
  fil_public = p.pseudo not in ('adam.web', 'enzo.covoit'),
  cree_le = now() - ((abs(hashtext(p.pseudo)) % 25) || ' days')::interval
from (values
  ('sam.photo', 'B3 Création de contenu & publicité'), ('zoe.contenu', 'B3 Création de contenu & publicité'),
  ('lea.gala', 'M1 Data Marketing & IA'), ('hugo.data', 'M1 Data Marketing & IA'),
  ('tom.dev', 'B2 Chef de projet digital'), ('adam.web', 'B2 Chef de projet digital'), ('enzo.covoit', 'B2 Chef de projet digital'),
  ('ines.ux', 'M1 User Experience & Interface'), ('emma.chef', 'B3 Chef de projet digital'), ('yanis.growth', 'B3 Marketing digital & IA'),
  ('noe.motion', 'M1 Vidéo, Motion & Creative Content'), ('louis.video', 'M1 Vidéo, Motion & Creative Content'),
  ('maya.da', 'M1 Direction artistique, publicité & média'), ('lina.modele', 'M1 Direction artistique, publicité & média'),
  ('jade.event', 'B3 Production événementielle'), ('clara.asso', 'B3 Production événementielle')
) as t(pseudo, classe), public.classes c
where p.pseudo = t.pseudo and c.nom = t.classe and c.ecole = p.ecole and c.validee;

update public.coordonnees co set telephone = '06' || lpad((abs(hashtext(p.pseudo)) % 100000000)::text, 8, '0')
from public.profils p where p.id = co.id and p.pseudo in ('sam.photo', 'tom.dev', 'noe.motion', 'hugo.data', 'enzo.covoit', 'ines.ux');

-- 3. Les 20 annonces de docs/CONTENU-DEMO.md, publiées sur les 20 derniers jours.
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier, tram, cree_le)
select p.id, t.type, t.categorie, t.titre, t.description, t.contrepartie, t.quartier, t.tram, now() - (t.jours || ' days')::interval
from (values
  ('sam.photo', 'propose', 'photo', 'Photos pour vos événements d''asso', 'Soirées, galas, tournois : je couvre l''événement et je livre les photos retouchées sous 5 jours. J''ai mon propre matériel.', 'gratuit', 'victor_hugo', 'B', 18),
  ('noe.motion', 'propose', 'video', 'Aftermovie de ta soirée en 60 secondes', 'Je filme et je monte un aftermovie vertical pour Instagram et TikTok. Musique libre de droits.', 'troc', 'saint_michel', 'C', 15),
  ('ines.ux', 'propose', 'ux_ui', 'Je relis ton portfolio et ta maquette Figma', '30 minutes au campus : une liste concrète de corrections (hiérarchie, typographie, parcours).', 'gratuit', 'victor_hugo', 'B', 14),
  ('tom.dev', 'propose', 'dev', 'Je t''aide à mettre ton site en ligne', 'Next.js, Webflow ou WordPress : on met ton portfolio en ligne ensemble, avec un vrai nom de domaine.', 'troc', 'chartrons', 'B', 13),
  ('hugo.data', 'propose', 'data_ia', 'Coup de main sur Excel, Power BI ou Python', 'Tableaux croisés, dashboards, premiers scripts Python pour ton mémoire ou ton alternance.', 'gratuit', 'centre', 'A', 12),
  ('maya.da', 'propose', 'design', 'Affiche et visuels pour ton événement', 'Une affiche A3 et ses déclinaisons pour les réseaux, dans l''identité de ton asso.', 'a_discuter', 'bastide', 'A', 11),
  ('zoe.contenu', 'propose', 'redaction', 'Je relis tes candidatures d''alternance', 'CV, lettre, message LinkedIn : je corrige l''orthographe et je rends le tout plus percutant.', 'gratuit', 'victor_hugo', 'B', 10),
  ('louis.video', 'propose', 'materiel', 'Prêt d''un trépied et d''un micro-cravate', 'Pour tes tournages ou tes interviews, à récupérer au campus et à rendre dans la semaine.', 'gratuit', 'victor_hugo', 'B', 9),
  ('enzo.covoit', 'propose', 'covoiturage', 'Covoit Mérignac vers le campus, lundi et mardi 8 h', 'Départ de Mérignac Centre, deux places, retour possible à 18 h.', 'partage_frais', 'merignac', 'A', 9),
  ('emma.chef', 'propose', 'coup_de_main', 'Aide pour ton déménagement le samedi', 'J''ai les bras et un diable, pas de camion. Dans Bordeaux, un samedi matin.', 'troc', 'begles', 'C', 8),
  ('lina.modele', 'propose', 'shooting', 'Modèle dispo pour ton projet photo', 'Je pose pour tes projets d''école (portrait, mode, street). J''aimerais quelques photos en échange.', 'troc', 'chartrons', 'B', 7),
  ('lea.gala', 'cherche', 'photo', 'Photographe pour le gala de notre asso', 'Gala le 12 décembre, 150 personnes, il nous faut quelqu''un pour 3 heures. On offre l''entrée et le repas.', 'troc', 'centre', 'A', 6),
  ('jade.event', 'cherche', 'coloc', 'Une chambre se libère en coloc à Saint-Michel', 'T3 lumineux, 420 euros charges comprises, dispo en janvier. On cherche quelqu''un de calme qui aime cuisiner.', 'a_discuter', 'saint_michel', 'C', 6),
  ('hugo.data', 'cherche', 'binome', 'Binôme ESP pour un projet data et com', 'Je suis en data à l''ESD, je cherche quelqu''un de l''ESP pour la partie créa et storytelling.', 'troc', 'victor_hugo', 'B', 5),
  ('adam.web', 'cherche', 'dev', 'Quelqu''un pour débloquer mon formulaire Webflow', 'Mon formulaire de contact ne s''envoie plus depuis hier, une heure de ton temps me sauverait.', 'remunere', 'bastide', 'A', 4),
  ('yanis.growth', 'cherche', 'covoiturage', 'Covoit Talence vers le campus le jeudi', 'Je finis à 19 h le jeudi, je cherche quelqu''un qui rentre vers Talence ou Pessac.', 'partage_frais', 'talence_pessac', 'B', 4),
  ('clara.asso', 'cherche', 'video', 'Monteur pour une vidéo de présentation d''asso', '2 minutes, rushes déjà tournés, pour notre forum des associations.', 'a_discuter', 'centre', 'A', 3),
  ('zoe.contenu', 'cherche', 'redaction', 'Relecture de mon mémoire de M1', '40 pages sur le marketing d''influence, surtout l''orthographe et la clarté.', 'troc', 'cauderan', 'D', 2),
  ('jade.event', 'cherche', 'design', 'Logo pour mon projet entrepreneurial', 'Une marque de vêtements upcyclés, je cherche quelqu''un qui aime la typo.', 'remunere', 'chartrons', 'B', 1),
  ('emma.chef', 'cherche', 'coup_de_main', 'Quelqu''un pour tester mon appli', '15 minutes, sur ton téléphone, tu me dis ce qui ne marche pas. Je t''offre un café.', 'gratuit', 'victor_hugo', 'B', 0)
) as t(pseudo, type, categorie, titre, description, contrepartie, quartier, tram, jours)
join public.profils p on p.pseudo = t.pseudo
where exists (select 1 from auth.users u where u.id = p.id and u.email like 'demo-postit-%');

-- Une annonce « à vérifier » avec sa correction proposée, pour montrer l'IA n°2 dans l'admin.
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier, tram)
select p.id, 'propose', 'coup_de_main', 'COURS DE MATHS', 'Cours niveau lycée et L1, appelle-moi au 06 12 34 56 78 ou écris à demo.cours@gmail.com.', 'remunere', 'centre', 'A'
from public.profils p join auth.users u on u.id = p.id where p.pseudo = 'yanis.growth' and u.email like 'demo-postit-%';

-- 4. Verdicts de la modération (écrits comme le serveur : rôle service_role).
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update public.annonces a set moderation = 'ok', modere_le = now()
from auth.users u where u.id = a.auteur_id and u.email like 'demo-postit-%' and a.titre <> 'COURS DE MATHS';
update public.annonces a set moderation = 'a_verifier', modere_le = now(),
  moderation_raisons = array['Coordonnées écrites dans l''annonce (elles doivent s''échanger après accord).', 'Titre en majuscules'],
  moderation_suggestion = '{"titre":"Je propose des cours de maths (Lycée/L1)","description":"Je donne des cours de mathématiques pour le lycée et la première année de licence. Contactez-moi via l''application si vous avez besoin d''aide."}'
from auth.users u where u.id = a.auteur_id and u.email like 'demo-postit-%' and a.titre = 'COURS DE MATHS';

-- 5. Les mises en relation : chaque étudiant agit sous son identité (les règles de la base s'appliquent).
create temp table demo_ids on commit drop as
  select p.pseudo, p.id from public.profils p join auth.users u on u.id = p.id where u.email like 'demo-postit-%';
grant select on demo_ids to authenticated;
set local role authenticated;
do $$
declare
  r record;
  v_id uuid;
  v_dem uuid;
  v_dest uuid;
  qui uuid;
begin
  for r in select * from (values
    -- demandeur, auteur de l'annonce, titre de l'annonce, réponse, message, avis du demandeur, commentaire
    ('lea.gala', 'sam.photo', 'Photos pour vos événements d''asso', 'acceptee', 'Hello ! Tu serais dispo pour notre gala le 12 ?', 5, 'Photos superbes, livrées en 3 jours.'),
    ('maya.da', 'tom.dev', 'Je t''aide à mettre ton site en ligne', 'acceptee', 'Je veux mettre mon portfolio en ligne.', 5, 'Site en ligne en une heure.'),
    ('sam.photo', 'ines.ux', 'Je relis ton portfolio et ta maquette Figma', 'acceptee', null, 4, null),
    ('lina.modele', 'lea.gala', 'Photographe pour le gala de notre asso', 'acceptee', 'Je peux aussi couvrir ton gala.', null, null),
    ('tom.dev', 'adam.web', 'Quelqu''un pour débloquer mon formulaire Webflow', 'acceptee', 'Je regarde ça ce soir.', null, null),
    ('noe.motion', 'clara.asso', 'Monteur pour une vidéo de présentation d''asso', 'acceptee', 'Je monte ça pour vendredi.', null, null),
    ('yanis.growth', 'enzo.covoit', 'Covoit Mérignac vers le campus, lundi et mardi 8 h', 'acceptee', null, 4, null),
    ('louis.video', 'hugo.data', 'Binôme ESP pour un projet data et com', 'acceptee', 'Je suis partant pour la partie vidéo.', 5, 'Super binôme.'),
    ('emma.chef', 'zoe.contenu', 'Relecture de mon mémoire de M1', 'acceptee', null, null, null),
    ('adam.web', 'noe.motion', 'Aftermovie de ta soirée en 60 secondes', 'refusee', null, null, null),
    ('clara.asso', 'maya.da', 'Affiche et visuels pour ton événement', 'en_attente', 'Une affiche pour notre forum ?', null, null),
    ('jade.event', 'hugo.data', 'Coup de main sur Excel, Power BI ou Python', 'en_attente', null, null, null)
  ) as t(demandeur, auteur, titre, reponse, message, note, commentaire)
  loop
    select id into qui from demo_ids where pseudo = r.demandeur;
    select a.id, a.auteur_id into v_id, v_dest from public.annonces a
      where a.auteur_id = (select id from demo_ids where pseudo = r.auteur) and a.titre = r.titre limit 1;
    perform set_config('request.jwt.claims', json_build_object('sub', qui, 'role', 'authenticated')::text, true);
    insert into public.demandes_contact (annonce_id, destinataire_id, message) values (v_id, v_dest, r.message) returning id into v_dem;
    if r.reponse <> 'en_attente' then
      perform set_config('request.jwt.claims', json_build_object('sub', v_dest, 'role', 'authenticated')::text, true);
      update public.demandes_contact set statut = r.reponse where id = v_dem;
    end if;
    if r.reponse = 'acceptee' then
      perform set_config('request.jwt.claims', json_build_object('sub', qui, 'role', 'authenticated')::text, true);
      insert into public.messages (demande_id, auteur_id, contenu) values (v_dem, qui, 'Merci d''avoir accepté !');
      perform set_config('request.jwt.claims', json_build_object('sub', v_dest, 'role', 'authenticated')::text, true);
      insert into public.messages (demande_id, auteur_id, contenu) values (v_dem, v_dest, 'Avec plaisir, on se cale ça.');
      if r.note is not null then
        perform set_config('request.jwt.claims', json_build_object('sub', qui, 'role', 'authenticated')::text, true);
        insert into public.avis (demande_id, auteur_id, note, commentaire) values (v_dem, qui, r.note, r.commentaire);
      end if;
    end if;
  end loop;
end $$;

commit;

-- Vérification : ce qui vient d'être créé.
select
  (select count(*) from auth.users where email like 'demo-postit-%') as etudiants_demo,
  (select count(*) from public.annonces a join auth.users u on u.id = a.auteur_id where u.email like 'demo-postit-%') as annonces_demo,
  (select count(*) from public.demandes_contact d join auth.users u on u.id = d.demandeur_id where u.email like 'demo-postit-%' and d.statut = 'acceptee') as entraides_demo;
