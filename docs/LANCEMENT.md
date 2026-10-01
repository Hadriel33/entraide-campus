# Checklist de lancement public

Objectif : si l'appli gagne, elle est publiée sur le campus. Elle doit tenir avec de vrais étudiants, pas seulement le jour de la démo.

## Fait (01/10/2026)
- [x] Paliers 1, 2 et 3 en ligne, les 2 IA, admin, gamification
- [x] 3 règles d'or en base : 37 attaques SQL testées, toutes bloquées
- [x] Chasse aux failles à blanc et correctifs, en-têtes de sécurité
- [x] CI GitHub : lint, 66 tests, build, typage, recherche de clés à chaque push
- [x] **Anti-spam en base** : 5 annonces/jour, 20 demandes/jour, 30 messages/10 min, 10 signalements/jour (admins exemptés)
- [x] **RGPD** : page Confidentialité et mentions, suppression du compte et de toutes les données en un clic (cascade testée)
- [x] Mot de passe oublié et changement de mot de passe
- [x] Mot de passe minimum 8 caractères, imposé aussi par Supabase
- [x] Écran de chargement, page 404, page d'erreur avec « Réessayer », aperçu soigné quand on partage le lien
- [x] Responsive mobile vérifié, animations coupées si l'utilisateur le demande
- [x] Notifications en direct, accueil guidé, recherche, quartier et tram, expiration et relance, favoris, défi de la semaine, titres, classement de la semaine, compteur d'impact

## À faire par Hadriel (je ne manipule ni mots de passe ni clés secrètes)
- [x] Créer son compte (@hadri) : nommé **admin** le 01/10
- [ ] Ajouter `SUPABASE_SECRET_KEY` sur Vercel : active l'écriture de la modération IA
- [ ] **Brevo en SMTP** (Supabase › Authentication › Emails › SMTP Settings, avec la clé SMTP Brevo) : sans ça, Supabase n'envoie d'emails qu'aux membres de l'équipe, donc le « mot de passe oublié » ne marche pas pour les autres étudiants. Une fois branché : réactiver « Confirm email ».
- [ ] Test complet avec 2 comptes : suivre `docs/RECETTE.md` (toutes les cases)

## Décisions à prendre
- [x] **Appli réservée aux emails de l'école** (@mail-esd.com, @mail-esp.com), école déduite automatiquement. **Ne devient sûr qu'avec la confirmation d'email**, donc avec le SMTP branché.
- [ ] Nom de domaine propre (ex. `entraide-campus.fr`), à brancher sur Vercel en 5 minutes.
- [ ] Premières annonces crédibles pour l'ouverture : la liste de 20 est prête dans `docs/CONTENU-DEMO.md`, à publier par de vrais étudiants volontaires.

## Avant le 17 décembre
- [ ] Gel du code le **10 décembre** : ensuite, seulement des corrections de bugs trouvés en recette (le cours : ne plus toucher au code la veille)
- [ ] Démo de 3 minutes répétée 3 fois, chronométrée, depuis un autre ordinateur (`docs/DEMO.md`)
- [ ] Failles trouvées le 26 novembre ajoutées et corrigées dans `docs/securite/FAILLES.md`

## Campus de démo
- [ ] Lancer `supabase/demo/campus-demo.sql` dans Supabase › SQL Editor (16 étudiants, 21 annonces, 9 entraides, sans mot de passe)
- [ ] Avant l'ouverture au vrai campus : lancer `supabase/demo/nettoyage-demo.sql`

## Risque repéré par la mesure de l'IA
- [ ] L'offre gratuite de la passerelle IA accepte 5 appels simultanés. Pour l'ouverture au campus : passer sur une offre payante, ou accepter que certaines annonces attendent l'admin aux heures de pointe.
