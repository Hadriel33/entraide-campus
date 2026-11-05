-- 0030 (05/11/2026) : trois tenues libres pour Colette (bob, bandana, ballon).
-- Libres : de quoi personnaliser sa Colette, sans ajouter de points ni de pièces à gagner (retour du prof).
-- Aucune policy RLS n'est modifiée. À lancer AVANT la mise en ligne du code (sinon la base refuse ces tenues).
alter table public.profils drop constraint profils_colette_accessoire_check;
alter table public.profils add constraint profils_colette_accessoire_check check (colette_accessoire in (
  'aucun', 'photo', 'design', 'dev', 'data', 'coloc', 'covoit', 'casque', 'noel',
  'noeud', 'echarpe', 'cape', 'bde', 'etoile', 'couronne', 'diplome',
  'fleur', 'micro', 'lunettes_coeur', 'flamme',
  'bob', 'bandana', 'ballon'
));
