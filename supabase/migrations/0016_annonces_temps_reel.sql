-- Mur du campus en direct (/mur) : les nouvelles annonces apparaissent sans recharger.
-- Le temps réel de Supabase applique la RLS de chaque abonné : un étudiant ne reçoit
-- que les annonces qu'il a déjà le droit de lire (publiées, ou les siennes).
-- Aucune colonne d'annonce n'est restreinte en lecture : rien de plus n'est exposé.
-- Côté appli, l'événement ne sert qu'à relancer la lecture serveur (le contenu reçu n'est pas utilisé).
alter publication supabase_realtime add table public.annonces;
