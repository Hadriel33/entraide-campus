# Étape 3 : les comptes

## La demande en une phrase vérifiable
« Je crée un compte avec mon email et un mot de passe, je me déconnecte, je me reconnecte : mon compte existe toujours, et la page Mon compte m'est refusée si je ne suis pas connecté. »

## Questions posées avant de coder, et réponses retenues
| Question | Réponse retenue | Pourquoi |
|---|---|---|
| Quelles infos à l'inscription ? | Email, mot de passe, prénom, école (ESD ou ESP) | Le minimum pour afficher l'auteur d'une annonce. Les coordonnées (téléphone…) arrivent à l'étape 5, dans une table protégée à part. |
| Connexion Google ? | Non | Hors palier 1 (fiche d'identité). |
| Confirmation de l'email ? | Oui (réglage par défaut de Supabase) | Une vraie appli de campus ne doit pas accepter de faux emails. |
| Réserver aux emails de l'école ? | Pas pour l'instant, à décider avec Hadriel | Il faut d'abord connaître les domaines exacts des emails ESD et ESP. |
| Où vit le profil ? | Table `profils`, créée automatiquement par un trigger à l'inscription | L'utilisateur ne peut jamais créer le profil de quelqu'un d'autre. |

## Plan (chaque sous-étape a sa vérification)
1. **Test d'abord** : règles de validation du formulaire (email avec @, mot de passe de 8 caractères minimum, prénom non vide, école ESD ou ESP). → `npm test` échoue, puis passe.
2. **Base** : migration `profils` + RLS + trigger. → `get_advisors` sans alerte. Test SQL : un utilisateur ne peut pas modifier le profil d'un autre (0 ligne modifiée).
3. **Code** : clients Supabase (navigateur et serveur), `proxy.ts` (Next.js 16 : ex-middleware) qui rafraîchit la session, pages Inscription / Connexion / Mon compte, déconnexion. → `npm run build` OK.
4. **En ligne** : push, déploiement Vercel, URL de Vercel dans Supabase › Auth › URL Configuration. → parcours complet sur téléphone avec un vrai email.

## Choix techniques
- Next.js 16 a renommé `middleware` en **`proxy`**. Lu dans la doc embarquée (`node_modules/next/dist/docs`) avant de coder, comme demandé par `AGENTS.md`.
- La vérification d'identité côté serveur passe toujours par `supabase.auth.getUser()` (skill `supabase-rls-securite`). Le proxy ne fait qu'une première vérification optimiste.
