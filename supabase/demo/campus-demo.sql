-- ============================================================================
-- CAMPUS DE DÉMO, EN UN SEUL SCRIPT (à coller dans Supabase › SQL Editor, puis « Run »).
-- 40 étudiants fictifs (20 ESD, 20 ESP), sans mot de passe : personne ne peut s'y connecter.
-- Leurs emails commencent tous par « demo-postit- ». Tout s'efface avec nettoyage-demo.sql.
-- Classes, Colette personnalisées, ~85 annonces, entraides, discussions, avis, fil du campus,
-- une annonce à corriger (IA n°2), une arnaque masquée, un signalement.
-- Et le compte de Hadriel (@hadri) : profil complet, 3 annonces, demandes reçues et envoyées, avis, favoris.
-- Les dates sont étalées sur 30 jours (classement de la semaine et tableau d'impact réalistes).
-- Tout tient dans un seul bloc : si une erreur survient, rien n'est écrit. On peut le relancer.
-- ============================================================================
do $demo$
declare
  ann record; aide record; v_dem uuid; v_hadri uuid; nb int := 0; h int; v_cible uuid;
  msgs text[] := array['Salut ! Toujours dispo ?', 'Oui carrément, tu es libre quand ?', 'Jeudi après les cours ça te va ?', 'Parfait, à jeudi devant la cafét.', 'Merci encore, trop bien !'];
begin

-- 1. Les 40 comptes (le trigger d'inscription crée leurs profils et leurs coordonnées).
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

-- 2. La vie du campus.

-- 0. Qui est qui : classe, ce que chacun propose, ce que chacun cherche.
create temp table demo_eleves (pseudo text primary key, classe text, offre text, demande text) on commit drop;
insert into demo_eleves values
  ('lea.gala','M1 Data Marketing & IA','data_ia','photo'), ('tom.dev','B2 Chef de projet digital','dev','design'),
  ('ines.ux','M1 User Experience & Interface','ux_ui','shooting'), ('hugo.data','M1 Data Marketing & IA','data_ia','binome'),
  ('adam.web','B2 Chef de projet digital','coup_de_main','dev'), ('enzo.covoit','B2 Chef de projet digital','covoiturage','video'),
  ('yanis.growth','B3 Marketing digital & IA','redaction','covoiturage'), ('emma.chef','B3 Chef de projet digital','coup_de_main','ux_ui'),
  ('nathan.code','B3 Chef de projet digital','dev','coloc'), ('chloe.uxui','B3 Création digitale & Design d''interface','ux_ui','photo'),
  ('lucas.nocode','B1 Chef de projet digital','dev','materiel'), ('manon.data','M2 Data Marketing & IA','data_ia','redaction'),
  ('theo.react','B2 Création digitale & Design d''interface','dev','video'), ('sarah.product','M1 Business Developer & E-commerce','binome','design'),
  ('raphael.ia','M2 Data Marketing & IA','data_ia','coup_de_main'), ('camille.web','B1 Création digitale & Design d''interface','design','dev'),
  ('maxime.ecom','M2 Business Developer & E-commerce','redaction','data_ia'), ('julie.motion','M1 Vidéo & Digital Contents','video','shooting'),
  ('karim.python','B3 Marketing digital & IA','data_ia','coloc'), ('alice.figma','M2 User Experience & Interface','ux_ui','redaction'),
  ('sam.photo','B3 Création de contenu & publicité','photo','ux_ui'), ('noe.motion','M1 Vidéo, Motion & Creative Content','video','dev'),
  ('maya.da','M1 Direction artistique, publicité & média','design','dev'), ('jade.event','B3 Production événementielle','binome','coloc'),
  ('lina.modele','M1 Direction artistique, publicité & média','shooting','photo'), ('clara.asso','B3 Production événementielle','coup_de_main','video'),
  ('zoe.contenu','B3 Création de contenu & publicité','redaction','data_ia'), ('louis.video','M1 Vidéo, Motion & Creative Content','materiel','binome'),
  ('oceane.brand','M1 Brand Design & Creative Strategy','design','data_ia'), ('arthur.pub','B3 Stratégie de marque & communication','redaction','dev'),
  ('lou.influence','M1 Marketing d''influence & événementiel','redaction','video'), ('nina.style','B2 Communication & Marketing','shooting','design'),
  ('paul.copy','M2 Planning stratégique, marques & tendances','redaction','ux_ui'), ('eva.illu','M2 Direction artistique, publicité & média','design','covoiturage'),
  ('leo.photo','B1 Communication & Marketing','photo','materiel'), ('mila.social','B3 Marketing digital, Growth & IA','redaction','data_ia'),
  ('gabriel.media','M1 Media, Data & Growth Strategy','video','data_ia'), ('rose.event','B3 Production événementielle','coup_de_main','design'),
  ('axel.dop','B3 Vidéo & Techniques de production','video','coloc'), ('lena.rse','M1 Communication corporate, RSE & stratégies d''impact','binome','ux_ui');

create temp table demo_ids on commit drop as
  select p.pseudo, p.id, p.ecole, e.classe, e.offre, e.demande
  from public.profils p join auth.users u on u.id = p.id join demo_eleves e on e.pseudo = p.pseudo
  where u.email like 'demo-postit-%';
insert into demo_ids select p.pseudo, p.id, p.ecole, 'M1 Data Marketing & IA', 'dev', 'video' from public.profils p where p.pseudo = 'hadri';
grant select on demo_ids to authenticated;

  if (select count(*) from demo_ids where pseudo <> 'hadri') <> 40 then
    raise exception 'Les 40 comptes de démo n''ont pas été créés';
  end if;
  if not exists (select 1 from demo_ids where pseudo = 'hadri') then
    raise exception 'Profil @hadri introuvable : corrige le pseudo dans ce script';
  end if;

-- 1. Modèles d'annonces crédibles (2 variantes par catégorie quand plusieurs étudiants s'y retrouvent).
create temp table modeles (categorie text, type text, n int, titre text, description text) on commit drop;
insert into modeles values
  ('photo','propose',1,'Photos pour vos événements d''asso','Soirées, galas, tournois : je couvre l''événement et je livre les photos retouchées sous 5 jours.'),
  ('photo','propose',2,'Portraits pour ton profil LinkedIn','Une séance de 20 minutes au campus, lumière naturelle, trois photos retouchées.'),
  ('video','propose',1,'Aftermovie de ta soirée en 60 secondes','Je filme et je monte un aftermovie vertical pour Instagram et TikTok, musique libre de droits.'),
  ('video','propose',2,'Montage de tes vidéos YouTube','Je monte tes rushes avec sous-titres et habillage, rendu sous une semaine.'),
  ('design','propose',1,'Affiche et visuels pour ton événement','Une affiche A3 et ses déclinaisons réseaux, dans l''identité de ton asso.'),
  ('design','propose',2,'Identité visuelle pour ton projet','Logo, couleurs et typographies : une petite charte simple pour démarrer.'),
  ('ux_ui','propose',1,'Je relis ton portfolio et ta maquette Figma','30 minutes au campus : une liste concrète de corrections sur ton parcours et ta hiérarchie.'),
  ('ux_ui','propose',2,'Atelier Figma pour débutants','Une heure pour apprendre les composants, l''auto-layout et le prototypage.'),
  ('dev','propose',1,'Je t''aide à mettre ton site en ligne','Next.js, Webflow ou WordPress : on met ton portfolio en ligne ensemble, avec un vrai nom de domaine.'),
  ('dev','propose',2,'Débogage express de ton projet web','Tu bloques sur une erreur JavaScript ou une API : on regarde ça ensemble en visio.'),
  ('data_ia','propose',1,'Coup de main sur Excel, Power BI ou Python','Dashboards, tableaux croisés et premiers scripts pour ton mémoire ou ton alternance.'),
  ('data_ia','propose',2,'Je t''explique les outils d''IA pour tes cours','Prompts, automatisations, limites : une heure pour t''y retrouver sans tricher.'),
  ('redaction','propose',1,'Je relis tes candidatures d''alternance','CV, lettre, message LinkedIn : je corrige l''orthographe et je rends le tout plus percutant.'),
  ('redaction','propose',2,'Rédaction de posts pour les réseaux de ton asso','Un calendrier et dix posts prêts à publier pour ton prochain événement.'),
  ('coloc','propose',1,'Chambre libre dans notre coloc','Une chambre se libère dans un T4 à dix minutes du campus, ambiance calme.'),
  ('covoiturage','propose',1,'Covoit vers le campus le matin','Deux places le matin, départ 8 h, on partage l''essence.'),
  ('materiel','propose',1,'Prêt de matériel photo et vidéo','Trépied, micro-cravate, réflecteur : à récupérer au campus et à rendre dans la semaine.'),
  ('binome','propose',1,'Partant pour un projet en binôme ESD × ESP','Je cherche à monter un projet entre les deux écoles, j''apporte ma partie technique ou créa.'),
  ('shooting','propose',1,'Modèle dispo pour ton projet photo','Je pose pour tes projets d''école (portrait, mode, street) contre quelques photos.'),
  ('coup_de_main','propose',1,'Coup de main pour ton déménagement','J''ai les bras et un diable, un samedi matin dans Bordeaux.'),
  ('coup_de_main','propose',2,'Je garde ton chat pendant les vacances','Je passe deux fois par jour, je t''envoie des photos, c''est gratuit.'),
  ('photo','cherche',1,'Photographe pour notre soirée d''asso','Soirée de 100 personnes, il nous faut quelqu''un pour 2 heures, entrée offerte.'),
  ('photo','cherche',2,'Photos de mon défilé de fin d''année','Défilé de mode d''école en juin, je cherche un photographe motivé.'),
  ('video','cherche',1,'Monteur pour une vidéo de présentation','2 minutes, rushes déjà tournés, pour le forum des associations.'),
  ('video','cherche',2,'Vidéaste pour un clip court','Un clip de 1 minute pour un projet musical, tournage sur une journée.'),
  ('design','cherche',1,'Logo pour mon projet','Je lance une petite marque, je cherche quelqu''un qui aime la typo et les identités.'),
  ('design','cherche',2,'Visuels pour une campagne de sensibilisation','Trois affiches pour une campagne de l''asso étudiante sur la santé mentale.'),
  ('ux_ui','cherche',1,'Avis UX sur mon application','15 minutes pour tester mon prototype et me dire ce qui bloque.'),
  ('ux_ui','cherche',2,'Maquette d''une landing page','Une page simple pour présenter mon projet, je fournis les textes.'),
  ('dev','cherche',1,'Débloquer mon formulaire Webflow','Mon formulaire de contact ne s''envoie plus, une heure de ton temps me sauverait.'),
  ('dev','cherche',2,'Un site vitrine pour mon portfolio','Je suis en créa, je cherche quelqu''un pour coder mon portfolio à partir de ma maquette.'),
  ('data_ia','cherche',1,'Aide Python pour mon mémoire','Je dois nettoyer un jeu de données et faire quelques graphiques propres.'),
  ('data_ia','cherche',2,'Comprendre Google Analytics','Je dois analyser le trafic du site de mon alternance et je suis perdu.'),
  ('redaction','cherche',1,'Relecture de mon mémoire','40 pages, surtout l''orthographe et la clarté.'),
  ('redaction','cherche',2,'Traduction anglaise de mon portfolio','Une dizaine de pages à passer en anglais pour candidater à l''étranger.'),
  ('coloc','cherche',1,'Je cherche une coloc pour janvier','Budget 450 euros, proche du tram, je suis calme et je cuisine bien.'),
  ('coloc','cherche',2,'Studio ou chambre pour un stage de 6 mois','De janvier à juin, près du campus ou d''une ligne de tram.'),
  ('covoiturage','cherche',1,'Covoit le jeudi soir','Je finis à 19 h le jeudi, je cherche quelqu''un qui rentre vers Talence ou Pessac.'),
  ('materiel','cherche',1,'Besoin d''un appareil photo pour un week-end','Pour un tournage d''école, je le rends en parfait état.'),
  ('binome','cherche',1,'Binôme pour un projet data et com','Je cherche quelqu''un de l''autre école pour compléter notre équipe.'),
  ('shooting','cherche',1,'Modèle pour un shooting mode','Projet d''école en studio, photos offertes en échange.'),
  ('coup_de_main','cherche',1,'Testeurs pour mon appli','15 minutes sur ton téléphone, tu me dis ce qui ne marche pas, café offert.');

-- 2. Profils : classe, Colette, bio, compétences, fil du campus, inscription étalée sur 45 jours.
update public.profils p set
  classe_id = c.id,
  colette_couleur = (array['jaune','lilas','ciel','ocre'])[1 + abs(hashtext(p.pseudo)) % 4],
  colette_humeur = (array['contente','fiere','surprise','concentree'])[1 + abs(hashtext(p.pseudo || 'h')) % 4],
  colette_accessoire = (array['aucun','casque','photo','design','dev','data','coloc','covoit','noel'])[1 + abs(hashtext(p.pseudo || 'a')) % 9],
  bio = case d.offre
    when 'photo' then 'Photographe d''événements, toujours avec mon boîtier.' when 'video' then 'Je filme et je monte, surtout du format court.'
    when 'design' then 'Direction artistique et typo, je dessine tout le temps.' when 'ux_ui' then 'UX et UI, Figma ouvert du matin au soir.'
    when 'dev' then 'Je code des sites et des petites applis.' when 'data_ia' then 'Data, dashboards et un peu d''IA.'
    when 'redaction' then 'Les mots, les réseaux et les campagnes.' else 'Toujours partant pour donner un coup de main.' end,
  competences = case d.offre
    when 'photo' then array['Photographie','Lightroom','Retouche portrait'] when 'video' then array['Premiere Pro','After Effects','Tournage']
    when 'design' then array['Illustrator','Identité visuelle','Typographie'] when 'ux_ui' then array['Figma','Prototypage','Tests utilisateurs']
    when 'dev' then array['React','Next.js','Webflow'] when 'data_ia' then array['Python','Power BI','Excel']
    when 'redaction' then array['Copywriting','Community management','Rédaction web'] else array['Organisation','Événementiel'] end,
  fil_public = abs(hashtext(p.pseudo || 'f')) % 5 <> 0,
  cree_le = now() - ((5 + abs(hashtext(p.pseudo || 'c')) % 40) || ' days')::interval
from demo_ids d, public.classes c
where p.id = d.id and p.pseudo <> 'hadri' and c.nom = d.classe and c.ecole = p.ecole and c.validee;

-- Le compte de Hadriel : profil complet (sa vraie classe est à corriger dans Mon profil si besoin).
update public.profils p set
  classe_id = (select c.id from public.classes c where c.nom = 'M1 Data Marketing & IA' and c.ecole = p.ecole and c.validee),
  bio = 'Je construis Post-it campus. Data, Next.js et Supabase : demande-moi un coup de main.',
  competences = array['Next.js','Supabase','Power BI','Python','UX'],
  fil_public = true
where p.pseudo = 'hadri';

update public.coordonnees co set telephone = '06' || lpad((abs(hashtext(d.pseudo)) % 100000000)::text, 8, '0')
from demo_ids d where co.id = d.id and d.pseudo <> 'hadri' and abs(hashtext(d.pseudo || 't')) % 3 <> 0;

-- 3. Les annonces : chaque étudiant propose ce qu'il sait faire et cherche ce qui lui manque.
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier, tram, cree_le)
select d.id, x.type, x.categorie, m.titre, m.description,
  (array['gratuit','troc','partage_frais','remunere','a_discuter'])[1 + abs(hashtext(d.pseudo || x.type)) % 5],
  (array['victor_hugo','centre','chartrons','saint_michel','saint_jean','bastide','bacalan','cauderan','talence_pessac','merignac','begles'])[1 + abs(hashtext(d.pseudo || x.type || 'q')) % 11],
  (array['A','B','C','D'])[1 + abs(hashtext(d.pseudo || x.type || 't')) % 4],
  now() - ((abs(hashtext(d.pseudo || x.type || 'j')) % 26) || ' days')::interval - ((abs(hashtext(d.pseudo || 'h')) % 20) || ' hours')::interval
from demo_ids d
cross join lateral (values ('propose', d.offre), ('cherche', d.demande)) as x(type, categorie)
join lateral (
  select * from modeles m where m.categorie = x.categorie and m.type = x.type
  order by (m.n + abs(hashtext(d.pseudo))) % 2, m.n limit 1
) m on true
where d.pseudo <> 'hadri';

-- Les annonces de Hadriel (3 catégories : de quoi débloquer le motif quadrillé).
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier, tram, cree_le)
select p.id, t.type, t.categorie, t.titre, t.description, t.contrepartie, 'victor_hugo', 'B', now() - (t.jours || ' days')::interval
from public.profils p, (values
  ('propose','dev','Je t''aide sur ton projet Next.js et Supabase','Connexion, base de données, mise en ligne sur Vercel : je t''explique en une heure ce que j''ai appris en construisant Post-it campus.','troc', 12),
  ('propose','data_ia','Dashboards Power BI pour ton asso','Je transforme vos fichiers Excel en un tableau de bord clair pour suivre vos adhérents et vos événements.','gratuit', 8),
  ('cherche','video','Monteur pour la vidéo de démo de mon appli','Une vidéo de 60 secondes pour présenter Post-it campus, les captures sont déjà prêtes.','troc', 2)
) as t(type, categorie, titre, description, contrepartie, jours)
where p.pseudo = 'hadri';

-- Une annonce à corriger (IA n°2) et une arnaque masquée, pour la file de modération de l'admin.
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier, tram)
select d.id, 'propose', 'coup_de_main', 'COURS DE MATHS', 'Cours niveau lycée et L1, appelle-moi au 06 12 34 56 78 ou écris à demo.cours@gmail.com.', 'remunere', 'centre', 'A'
from demo_ids d where d.pseudo = 'yanis.growth';
insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
select d.id, 'propose', 'coup_de_main', 'Gagne 500 euros par semaine', 'Envoie ton IBAN et une photo de ta carte vitale, je te verse 500 euros par semaine sans rien faire.', 'remunere'
from demo_ids d where d.pseudo = 'arthur.pub';

-- 4. Verdicts de la modération, écrits comme le serveur (rôle service_role).
perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
update public.annonces a set moderation = 'ok', modere_le = a.cree_le + interval '3 seconds'
from demo_ids d where a.auteur_id = d.id and a.titre not in ('COURS DE MATHS', 'Gagne 500 euros par semaine');
update public.annonces a set moderation = 'a_verifier', modere_le = now(),
  moderation_raisons = array['Coordonnées écrites dans l''annonce (elles doivent s''échanger après accord).', 'Titre en majuscules'],
  moderation_suggestion = '{"titre":"Je propose des cours de maths (Lycée/L1)","description":"Je donne des cours de mathématiques pour le lycée et la première année de licence. Contactez-moi via l''application si vous avez besoin d''aide."}'
from demo_ids d where a.auteur_id = d.id and a.titre = 'COURS DE MATHS';
update public.annonces a set moderation = 'refus_probable', statut = 'masquee', modere_le = now(),
  moderation_raisons = array['Demande de données bancaires (IBAN)', 'Demande de données personnelles sensibles (carte vitale)', 'Annonce s''apparentant à une arnaque']
from demo_ids d where a.auteur_id = d.id and a.titre = 'Gagne 500 euros par semaine';

-- 5. La vie du campus : chacun agit sous son identité (les règles de la base s'appliquent à chaque action).
set local role authenticated;
  select id into v_hadri from demo_ids where pseudo = 'hadri';

  -- 5a. Sur chaque annonce « je cherche », 1 à 2 étudiants qui proposent la même chose se manifestent ;
  --     sur chaque « je propose », un étudiant qui en a besoin demande le contact.
  for ann in
    select a.id, a.auteur_id, a.type, a.categorie, a.titre from public.annonces a join demo_ids d on d.id = a.auteur_id
    where d.pseudo <> 'hadri' and a.statut = 'publiee' and a.titre <> 'COURS DE MATHS'
  loop
    for aide in
      select d.id, d.pseudo from demo_ids d
      where d.id <> ann.auteur_id and d.pseudo <> 'hadri'
        and ((ann.type = 'cherche' and d.offre = ann.categorie) or (ann.type = 'propose' and d.demande = ann.categorie))
      order by abs(hashtext(d.pseudo || ann.id::text)) limit case when ann.type = 'cherche' then 2 else 1 end
    loop
      nb := nb + 1;
      h := abs(hashtext(aide.pseudo || ann.titre)) % 100;
      perform set_config('request.jwt.claims', json_build_object('sub', aide.id, 'role', 'authenticated')::text, true);
      insert into public.demandes_contact (annonce_id, destinataire_id, message)
        values (ann.id, ann.auteur_id, case when h % 3 = 0 then null else 'Salut, ton annonce m''intéresse, on en parle ?' end)
        returning id into v_dem;
      if h < 85 then
        perform set_config('request.jwt.claims', json_build_object('sub', ann.auteur_id, 'role', 'authenticated')::text, true);
        update public.demandes_contact set statut = case when h < 72 then 'acceptee' else 'refusee' end where id = v_dem;
      end if;
      if h < 72 then
        for i in 1 .. 2 + h % 3 loop
          v_cible := case when i % 2 = 1 then aide.id else ann.auteur_id end;
          perform set_config('request.jwt.claims', json_build_object('sub', v_cible, 'role', 'authenticated')::text, true);
          insert into public.messages (demande_id, auteur_id, contenu) values (v_dem, v_cible, msgs[i]);
        end loop;
        if h < 55 then
          perform set_config('request.jwt.claims', json_build_object('sub', aide.id, 'role', 'authenticated')::text, true);
          insert into public.avis (demande_id, auteur_id, note, commentaire)
            values (v_dem, aide.id, 4 + h % 2, (array['Super échange, merci !', 'Très pro et sympa.', null, 'Je recommande.'])[1 + h % 4]);
        end if;
        if h < 35 then
          perform set_config('request.jwt.claims', json_build_object('sub', ann.auteur_id, 'role', 'authenticated')::text, true);
          insert into public.avis (demande_id, auteur_id, note, commentaire)
            values (v_dem, ann.auteur_id, 5, (array['Au top, merci pour le coup de main !', 'Rapide et efficace.', null])[1 + h % 3]);
        end if;
      end if;
    end loop;
  end loop;

  -- 5b. Le compte de Hadriel : on lui demande de l'aide (ESP surtout : croisements), il en demande aussi.
  for aide in select d.id, d.pseudo, x.reponse, x.note, x.commentaire from demo_ids d join (values
      ('sam.photo', 'acceptee', 5, 'Il m''a mis mon portfolio en ligne en une soirée.'),
      ('maya.da', 'acceptee', 5, 'Patient et super clair, merci !'),
      ('mila.social', 'acceptee', 5, 'Mon dashboard est enfin lisible.'),
      ('gabriel.media', 'en_attente', null, null)
    ) as x(pseudo, reponse, note, commentaire) on x.pseudo = d.pseudo
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', aide.id, 'role', 'authenticated')::text, true);
    insert into public.demandes_contact (annonce_id, destinataire_id, message)
      select a.id, v_hadri, 'Salut Hadriel, ton annonce tombe à pic !' from public.annonces a
      where a.auteur_id = v_hadri and (a.type = 'cherche') = (aide.pseudo = 'gabriel.media')
      order by abs(hashtext(aide.pseudo || a.titre)) limit 1
      returning id into v_dem;
    if aide.reponse = 'acceptee' then
      perform set_config('request.jwt.claims', json_build_object('sub', v_hadri, 'role', 'authenticated')::text, true);
      update public.demandes_contact set statut = 'acceptee' where id = v_dem;
      insert into public.messages (demande_id, auteur_id, contenu) values (v_dem, v_hadri, 'Avec plaisir ! On se cale ça jeudi ?');
      perform set_config('request.jwt.claims', json_build_object('sub', aide.id, 'role', 'authenticated')::text, true);
      insert into public.messages (demande_id, auteur_id, contenu) values (v_dem, aide.id, 'Parfait, merci beaucoup !');
      insert into public.avis (demande_id, auteur_id, note, commentaire) values (v_dem, aide.id, aide.note, aide.commentaire);
    end if;
  end loop;

  -- Hadriel demande à son tour : un monteur ESP accepte, une autre demande attend.
  perform set_config('request.jwt.claims', json_build_object('sub', v_hadri, 'role', 'authenticated')::text, true);
  for ann in select a.id, a.auteur_id, d.pseudo from public.annonces a join demo_ids d on d.id = a.auteur_id
             where d.pseudo in ('noe.motion', 'oceane.brand') and a.type = 'propose' loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_hadri, 'role', 'authenticated')::text, true);
    insert into public.demandes_contact (annonce_id, destinataire_id, message) values (ann.id, ann.auteur_id, 'Hello ! Je prépare la démo de Post-it campus, tu pourrais m''aider ?')
      returning id into v_dem;
    if ann.pseudo = 'noe.motion' then
      perform set_config('request.jwt.claims', json_build_object('sub', ann.auteur_id, 'role', 'authenticated')::text, true);
      update public.demandes_contact set statut = 'acceptee' where id = v_dem;
      insert into public.messages (demande_id, auteur_id, contenu) values (v_dem, ann.auteur_id, 'Carrément, envoie-moi tes captures.');
      perform set_config('request.jwt.claims', json_build_object('sub', v_hadri, 'role', 'authenticated')::text, true);
      insert into public.avis (demande_id, auteur_id, note, commentaire) values (v_dem, v_hadri, 5, 'Montage livré en deux jours, top.');
    end if;
  end loop;

  -- Favoris de Hadriel.
  perform set_config('request.jwt.claims', json_build_object('sub', v_hadri, 'role', 'authenticated')::text, true);
  insert into public.favoris (profil_id, annonce_id)
    select v_hadri, a.id from public.annonces a join demo_ids d on d.id = a.auteur_id
    where d.pseudo in ('sam.photo', 'lina.modele', 'julie.motion') and a.type = 'propose';

  -- Un signalement sur l'arnaque, par une étudiante.
  perform set_config('request.jwt.claims', json_build_object('sub', (select id from demo_ids where pseudo = 'lena.rse'), 'role', 'authenticated')::text, true);
  insert into public.signalements (annonce_id, auteur_id, motif, details)
    select a.id, (select id from demo_ids where pseudo = 'lena.rse'), 'arnaque', 'Demande d''IBAN et de carte vitale.'
    from public.annonces a where a.titre = 'Gagne 500 euros par semaine';
reset role;

-- 6. Les dates : l'activité s'étale sur 30 jours (un tiers des entraides cette semaine).
alter table public.demandes_contact disable trigger demandes_avant_reponse;
update public.demandes_contact dc set
  cree_le = greatest(a.cree_le, now() - interval '28 days') + ((abs(hashtext(dc.id::text)) % 60) || ' hours')::interval
from public.annonces a, demo_ids d
where a.id = dc.annonce_id and d.id = dc.demandeur_id and d.pseudo <> 'hadri' and dc.destinataire_id <> (select id from demo_ids where pseudo = 'hadri');
update public.demandes_contact set cree_le = least(cree_le, now() - interval '2 hours') where demandeur_id in (select id from demo_ids);
update public.demandes_contact dc set cree_le = now() - ((1 + abs(hashtext(dc.id::text)) % 9) || ' days')::interval
where (select id from demo_ids where pseudo = 'hadri') in (dc.demandeur_id, dc.destinataire_id) and dc.demandeur_id in (select id from demo_ids);
update public.demandes_contact dc set repondu_le = least(dc.cree_le + ((2 + abs(hashtext(dc.id::text || 'r')) % 30) || ' hours')::interval, now() - interval '1 hour')
where dc.statut <> 'en_attente' and dc.demandeur_id in (select id from demo_ids);
alter table public.demandes_contact enable trigger demandes_avant_reponse;
-- Les messages gardent leur ordre d'écriture (ordre physique d'insertion), espacés de 20 minutes.
update public.messages m set cree_le = least(coalesce(dc.repondu_le, dc.cree_le), now() - interval '3 hours') + (o.rang * interval '20 minutes')
from public.demandes_contact dc,
     (select id, row_number() over (partition by demande_id order by ctid) as rang from public.messages) o
where dc.id = m.demande_id and o.id = m.id and dc.demandeur_id in (select id from demo_ids);
update public.avis av set cree_le = least(coalesce(dc.repondu_le, dc.cree_le) + interval '1 day', now() - interval '10 minutes')
from public.demandes_contact dc where dc.id = av.demande_id and dc.demandeur_id in (select id from demo_ids);
-- Les notifications des étudiants fictifs sont lues ; celles de Hadriel restent à lire.
update public.notifications n set lu = true from demo_ids d where n.destinataire_id = d.id and d.pseudo <> 'hadri';

-- 7. Colette : les tenues rares quand elles sont gagnées (la base vérifie), dont la couronne de Hadriel.
update public.profils p set colette_accessoire = 'cape'
from demo_ids d where p.id = d.id and d.pseudo <> 'hadri' and public.objet_colette_debloque(public.stats_profil(p.id), 'cape');
update public.profils p set colette_motif = 'pois'
from demo_ids d where p.id = d.id and d.pseudo <> 'hadri' and public.objet_colette_debloque(public.stats_profil(p.id), 'pois') and abs(hashtext(p.pseudo)) % 2 = 0;
update public.profils p set colette_couleur = 'ciel', colette_humeur = 'fiere',
  colette_accessoire = case when public.objet_colette_debloque(public.stats_profil(p.id), 'couronne') then 'couronne' else 'dev' end,
  colette_motif = case when public.objet_colette_debloque(public.stats_profil(p.id), 'quadrille') then 'quadrille' else 'uni' end
where p.pseudo = 'hadri';

end $demo$;

-- Ce qui vient d'être créé.
select
  (select count(*) from public.profils p join auth.users u on u.id = p.id where u.email like 'demo-postit-%') as etudiants_demo,
  (select count(*) from public.annonces a join auth.users u on u.id = a.auteur_id where u.email like 'demo-postit-%') as annonces_demo,
  (select count(*) from public.demandes_contact where statut = 'acceptee') as entraides,
  (select count(*) from public.avis) as avis,
  (select count(*) from public.profils where fil_public) as dans_le_fil,
  (select public.stats_profil(id) from public.profils where pseudo = 'hadri') as stats_hadri;
