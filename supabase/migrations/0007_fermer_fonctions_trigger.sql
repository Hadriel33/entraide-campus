-- Audit Supabase (advisors) du 01/10 : les fonctions de trigger n'ont pas à être appelables via l'API.
-- Elles continuent de s'exécuter comme triggers ; seul l'appel direct /rest/v1/rpc/... est fermé.
revoke execute on function public.demande_avant_insertion() from public, anon, authenticated;
revoke execute on function public.avis_avant_insertion() from public, anon, authenticated;
revoke execute on function public.creer_profil() from public, anon, authenticated;

-- Restent appelables, volontairement, et chacune vérifie elle-même les droits :
-- est_admin, peut_voir_coordonnees (lecture d'un booléen sur soi), definir_role (admin seulement),
-- stats_admin (admin seulement), stats_profil et stats_classement (aucune donnée de contact),
-- pseudo_disponible (nécessaire avant l'inscription).
