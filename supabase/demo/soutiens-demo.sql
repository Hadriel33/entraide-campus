-- Soutiens de démo (28/10/2026) : chaque étudiant de démo soutient quelques post-its récents des autres,
-- pour que l'onglet « Ça monte » ait de la vie. Seulement entre comptes de démo : aucune notification n'arrive aux vrais comptes. Passe par les vraies règles (trigger, RLS) : on se met
-- dans la peau de chaque compte de démo. Effacé avec les comptes par nettoyage-demo.sql (on delete cascade).
do $$
declare
  v_eleve record;
  v_annonce record;
begin
  for v_eleve in select id from auth.users where email like 'demo-postit-%' loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_eleve.id, 'role', 'authenticated')::text, true);
    for v_annonce in
      select a.id from public.annonces a
      where a.statut = 'publiee' and a.moderation <> 'a_verifier' and a.expire_le > now()
        and a.auteur_id <> v_eleve.id
        and a.auteur_id in (select id from auth.users where email like 'demo-postit-%')
        and not exists (select 1 from public.soutiens s where s.annonce_id = a.id and s.auteur_id = v_eleve.id)
      order by md5(a.id::text || v_eleve.id::text)
      limit 1 + abs(hashtext(v_eleve.id::text)) % 6
    loop
      insert into public.soutiens (annonce_id) values (v_annonce.id);
    end loop;
  end loop;
end $$;
select count(*) as soutiens, count(distinct annonce_id) as post_its from public.soutiens;
