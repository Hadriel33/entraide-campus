# Étapes 6 et 7 : les deux fonctionnalités IA

## Contrainte de Hadriel : aucune clé d'API à gérer, aucun coût
- La passerelle **Vercel AI Gateway** s'authentifie toute seule avec le jeton OIDC du projet Vercel : aucune clé dans le code ni dans les variables. Le compte a **5 $ de crédits gratuits** par mois.
- Test réel du 01/10 : sur l'offre gratuite, **les modèles Claude sont bloqués** (403 « Free tier users do not have access to this model »). Les modèles autorisés sont Gemini 2.5 Flash, Gemini 2.5 Flash Lite, gpt-oss-120b, Mistral Small et Llama 4 Scout.
- **Choix de Hadriel : Gemini 2.5 Flash** (lit les PDF, gratuit). Option écartée : Claude Haiku 4.5, qui demandait de recharger des crédits payants.

## IA n°1 (imposée) : profil depuis le CV
« Je dépose mon CV en PDF, l'IA propose mes compétences, je relis, je corrige, je valide. »
- Le CV n'est **jamais stocké** : il est lu en mémoire, envoyé au modèle, puis oublié.
- Prompt dans `src/lib/ia/prompts/competences.ts`. Le CV y est décrit comme une **donnée à analyser, pas des instructions** (anti-injection).
- Réponse imposée en JSON (schéma zod), puis nettoyage testé (`nettoyerCompetences` : doublons, longueurs, 15 maximum).
- **Humain qui valide** : écran de relecture (cocher, décocher, ajouter à la main), puis enregistrement seulement au clic.
- **Plan si ça rate** : délai maximum de 25 s, message clair, et la saisie manuelle reste possible.

## IA n°2 (inventée) : modération des annonces
« Chaque annonce publiée ou modifiée est relue par l'IA ; les cas douteux arrivent dans la file de l'admin, qui décide. »
- 4 états : `en_attente` (pas encore relue, ou IA indisponible), `ok`, `a_verifier`, `refus_probable`.
- **Humain qui valide** : `refus_probable` masque l'annonce **en attendant la décision de l'admin** ; `a_verifier` et `en_attente` restent visibles mais remontent dans l'admin. L'IA ne supprime jamais rien.
- **Double filet** : une règle sans IA (`detecterCoordonnees`) repère téléphones et emails collés dans le texte (contournement de la règle d'or n°1) et force au minimum `a_verifier`.
- **Sécurité** : le résultat de la modération ne peut être écrit que par le serveur avec la clé secrète Supabase (rôle `service_role`). Un trigger remet `en_attente` toute annonce créée ou modifiée par un utilisateur, et l'utilisateur n'a aucun droit sur ces colonnes. Sans la clé secrète (pas encore ajoutée sur Vercel), tout reste `en_attente`, donc relu par un humain : on échoue du côté sûr.

## Tests prévus
- Vitest : `nettoyerCompetences`, `detecterCoordonnees`, `deciderModeration` (y compris IA en panne et IA trop permissive).
- SQL : un utilisateur ne peut pas s'auto-valider (insérer ou modifier avec `moderation = 'ok'`).
- Cas piégés : CV normal, CV presque vide, CV avec texte caché (« ignore tes instructions »), annonce avec numéro, annonce insultante, annonce avec injection.
