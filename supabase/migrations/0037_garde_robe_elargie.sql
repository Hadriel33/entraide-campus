-- 0037 (26/11/2026) : une Colette plus personnalisable (retour de Hadriel : « on incite à la photo alors que c'est
-- marrant aussi d'avoir sa Colette, il faut plus d'éléments »). Tous ces choix sont LIBRES : rien à gagner,
-- objet_colette_debloque renvoie déjà vrai pour un objet sans condition.
-- Aucune policy RLS n'est modifiée : seules les listes de valeurs acceptées (contraintes CHECK) s'allongent.
--   couleur    AVANT : '', jaune, lilas, ciel, ocre             APRÈS : + menthe, rose
--   humeur     AVANT : contente, surprise, fiere, concentree    APRÈS : + rit, dort, fachee
--   accessoire AVANT : ... bob, bandana, ballon                 APRÈS : + lunettes_rondes, moustache, casquette, antennes
-- À lancer AVANT la mise en ligne du code (sinon la base refuse ces nouveaux choix).

alter table public.profils drop constraint profils_colette_couleur_check;
alter table public.profils add constraint profils_colette_couleur_check check (colette_couleur in (
  '', 'jaune', 'lilas', 'ciel', 'ocre', 'menthe', 'rose'
));

alter table public.profils drop constraint profils_colette_humeur_check;
alter table public.profils add constraint profils_colette_humeur_check check (colette_humeur in (
  'contente', 'surprise', 'fiere', 'concentree', 'rit', 'dort', 'fachee'
));

alter table public.profils drop constraint profils_colette_accessoire_check;
alter table public.profils add constraint profils_colette_accessoire_check check (colette_accessoire in (
  'aucun', 'photo', 'design', 'dev', 'data', 'coloc', 'covoit', 'casque', 'noel',
  'noeud', 'echarpe', 'cape', 'bde', 'etoile', 'couronne', 'diplome',
  'fleur', 'micro', 'lunettes_coeur', 'flamme',
  'bob', 'bandana', 'ballon',
  'lunettes_rondes', 'moustache', 'casquette', 'antennes'
));
