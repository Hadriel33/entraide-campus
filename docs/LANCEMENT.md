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

## À faire par Hadriel (je ne manipule ni mots de passe ni clés secrètes)
- [ ] Créer son compte, puis me donner son pseudo : je le nomme **admin**
- [ ] Ajouter `SUPABASE_SECRET_KEY` sur Vercel : active l'écriture de la modération IA
- [ ] **Brevo en SMTP** (Supabase › Authentication › Emails › SMTP Settings, avec la clé SMTP Brevo) : sans ça, Supabase n'envoie d'emails qu'aux membres de l'équipe, donc le « mot de passe oublié » ne marche pas pour les autres étudiants. Une fois branché : réactiver « Confirm email ».
- [ ] Test complet avec 2 comptes : annonce, demande, acceptation, discussion, avis, points

## Décisions à prendre
- [ ] **Réserver l'appli aux emails de l'école ?** C'est ce qui nous distingue des groupes Facebook. Il faut d'abord connaître les domaines exacts des emails étudiants ESD et ESP. Je peux ensuite bloquer les autres adresses en base.
- [ ] Nom de domaine propre (ex. `entraide-campus.fr`), à brancher sur Vercel en 5 minutes.
- [ ] Premières annonces crédibles pour l'ouverture : 2 ou 3 par catégorie, publiées par de vrais étudiants volontaires.
