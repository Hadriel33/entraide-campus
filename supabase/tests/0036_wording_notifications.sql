-- Vocabulaire « post-it » dans les notifications écrites par la base (26/11/2026). À exécuter APRÈS la migration 0036.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 2 tests vocabulaire réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000036a1';
  v_id uuid;
  v_txt text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.w1@mail-esp.com', '{"prenom":"Wil","pseudo":"test.w1","campus":"Bordeaux"}');
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'video', 'Test 0036 vocabulaire', 'Je monte ta vidéo de démo en une semaine.', 'gratuit') returning id into v_id;
  update public.annonces set statut = 'publiee', moderation = 'ok' where id = v_id;

  -- 1. Post-it masqué : la notification dit « Ton post-it ».
  update public.annonces set statut = 'masquee' where id = v_id;
  select texte into v_txt from public.notifications where destinataire_id = v_a and type = 'annonce_masquee' order by cree_le desc limit 1;
  if v_txt is null or v_txt not like 'Ton post-it « Test 0036 vocabulaire »%' then
    raise exception 'ÉCHEC 1 : notification de masquage = %', v_txt;
  end if;

  -- 2. Post-it bientôt expiré : la relance dit « Ton post-it ».
  update public.annonces set statut = 'publiee', relance_envoyee = false, expire_le = now() + interval '1 day' where id = v_id;
  perform public.relancer_annonces_bientot_expirees();
  select texte into v_txt from public.notifications where destinataire_id = v_a and type = 'annonce_expire' order by cree_le desc limit 1;
  if v_txt is null or v_txt not like 'Ton post-it « Test 0036 vocabulaire » expire bientôt%' then
    raise exception 'ÉCHEC 2 : notification de relance = %', v_txt;
  end if;

  raise exception 'OK : 2 tests vocabulaire réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
