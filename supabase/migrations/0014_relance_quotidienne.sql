-- Relance « Toujours d'actualité ? » : chaque jour à 8 h (UTC), les annonces qui expirent dans moins de 3 jours
-- génèrent une notification à leur auteur (une seule fois par période).
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
select cron.schedule('relance-annonces-bientot-expirees', '0 8 * * *', $$select public.relancer_annonces_bientot_expirees()$$);
