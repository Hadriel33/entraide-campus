-- Post-its de groupe de démo (28/10/2026), sur des post-its de démo de Bordeaux.
-- Passe par les vraies règles : le créateur invite (trigger, RLS), puis chaque membre accepte.
-- + une invitation EN ATTENTE pour Hadriel (si son compte existe), pour essayer « Je rejoins le post-it ».
-- Effacé avec les comptes de démo par nettoyage-demo.sql (on delete cascade).
do $$
declare
  v_groupe record;
  v_createur uuid;
  v_membre uuid;
  v_pseudo text;
  v_hadriel uuid := (select id from auth.users where email like 'hadriel.die@%' limit 1);
begin
  for v_groupe in
    select * from (values
      ('Modèle dispo pour vos shootings mode ou portrait', 'lina.modele', array['sam.photo', 'julie.motion']),
      ('Chambre en coloc près de Saint-Michel dès janvier', 'nathan.code', array['theo.react']),
      ('Partant pour un projet en binôme dev × créa', 'sarah.product', array['maya.da']),
      ('Photographe pour notre soirée d''asso', 'chloe.uxui', array['lea.gala', 'clara.asso']),
      ('Aftermovie de ta soirée en 60 secondes', 'noe.motion', array['gabriel.media']),
      ('Je cherche un covoit depuis Pessac le mardi', 'yanis.growth', array['adam.web'])
    ) as t(titre, createur, membres)
  loop
    select id into v_createur from public.profils where pseudo = v_groupe.createur;
    perform set_config('request.jwt.claims', json_build_object('sub', v_createur, 'role', 'authenticated')::text, true);
    foreach v_pseudo in array v_groupe.membres loop
      select id into v_membre from public.profils where pseudo = v_pseudo;
      insert into public.annonce_membres (annonce_id, membre_id)
        select a.id, v_membre from public.annonces a
        where a.auteur_id = v_createur and a.titre = v_groupe.titre and a.statut = 'publiee'
        on conflict do nothing;
    end loop;
    -- Hadriel est invité (sans réponse) sur le post-it de l'asso.
    if v_hadriel is not null and v_groupe.createur = 'chloe.uxui' then
      insert into public.annonce_membres (annonce_id, membre_id)
        select a.id, v_hadriel from public.annonces a
        where a.auteur_id = v_createur and a.titre = v_groupe.titre and a.statut = 'publiee'
        on conflict do nothing;
    end if;
    -- Chaque membre de démo dit oui.
    foreach v_pseudo in array v_groupe.membres loop
      select id into v_membre from public.profils where pseudo = v_pseudo;
      perform set_config('request.jwt.claims', json_build_object('sub', v_membre, 'role', 'authenticated')::text, true);
      update public.annonce_membres m set statut = 'accepte'
        from public.annonces a
        where m.annonce_id = a.id and a.auteur_id = v_createur and a.titre = v_groupe.titre and m.membre_id = v_membre and m.statut = 'invite';
    end loop;
  end loop;
end $$;
select a.type, left(a.titre, 45) as titre, p.pseudo as createur,
       string_agg(mp.pseudo || case when m.statut = 'invite' then ' (invité)' else '' end, ', ') as membres
from public.annonce_membres m
join public.annonces a on a.id = m.annonce_id
join public.profils p on p.id = a.auteur_id
join public.profils mp on mp.id = m.membre_id
group by a.type, a.titre, p.pseudo order by a.type;
