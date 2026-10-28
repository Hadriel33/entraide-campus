-- « Je soutiens » (28/10/2026). À exécuter APRÈS la migration 0028.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 8 tests soutiens réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000028a1'; -- auteur
  v_b uuid := '00000000-0000-0000-0000-0000000028a2';
  v_c uuid := '00000000-0000-0000-0000-0000000028a3';
  v_d uuid := '00000000-0000-0000-0000-0000000028a4';
  v_annonce uuid;
  v_autre uuid;
  v_cachee uuid;
  v_n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.u1@mail-esp.com', '{"prenom":"Ana","pseudo":"test.u1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.u2@mail-esp.com', '{"prenom":"Ben","pseudo":"test.u2","campus":"Bordeaux"}'),
    (v_c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.u3@mail-esp.com', '{"prenom":"Cléo","pseudo":"test.u3","campus":"Lyon"}'),
    (v_d, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.u4@mail-esp.com', '{"prenom":"Dan","pseudo":"test.u4","campus":"Lille"}');
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'cherche', 'photo', 'Test 0028 soutenue', 'Un photographe pour le gala de fin d''année.', 'gratuit') returning id into v_annonce;
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'dev', 'Test 0028 autre', 'Une autre annonce, moins soutenue.', 'gratuit') returning id into v_autre;
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'photo', 'Test 0028 cachée', 'Une annonce que la modération doit encore vérifier.', 'gratuit') returning id into v_cachee;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id in (v_annonce, v_autre);
  update public.annonces set moderation = 'a_verifier' where id = v_cachee;

  set local role authenticated;

  -- 1. B soutient : l'auteur est prévenu (premier palier).
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.soutiens (annonce_id) values (v_annonce);
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_a and type = 'soutien';
  if v_n <> 1 then raise exception 'ÉCHEC 1 : % notification(s) au premier soutien (attendu 1)', v_n; end if;

  -- 2. Pas deux fois.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  begin
    insert into public.soutiens (annonce_id) values (v_annonce);
    raise exception 'ÉCHEC 2 : double soutien accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 3. Pas sur un post-it caché (en attente de modération).
  begin
    insert into public.soutiens (annonce_id) values (v_cachee);
    raise exception 'ÉCHEC 3 : soutien sur un post-it caché';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 4. Pas sur son propre post-it.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  begin
    insert into public.soutiens (annonce_id) values (v_annonce);
    raise exception 'ÉCHEC 4 : soutien sur son propre post-it';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 5. Retirer puis remettre son soutien ne refait pas la notification du palier.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  delete from public.soutiens where annonce_id = v_annonce;
  insert into public.soutiens (annonce_id) values (v_annonce);
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_a and type = 'soutien';
  if v_n <> 1 then raise exception 'ÉCHEC 5 : notification refaite (% au total)', v_n; end if;

  -- 6. 2 soutiens : rien ; 3 soutiens : « 3 personnes soutiennent ».
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  insert into public.soutiens (annonce_id) values (v_annonce);
  insert into public.soutiens (annonce_id) values (v_autre);
  perform set_config('request.jwt.claims', json_build_object('sub', v_d, 'role', 'authenticated')::text, true);
  insert into public.soutiens (annonce_id) values (v_annonce);
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_a and type = 'soutien' and texte like '3 personnes soutiennent%';
  if v_n <> 1 then raise exception 'ÉCHEC 6 : palier de 3 non fêté'; end if;

  -- 7. « Ça monte » : la plus soutenue d'abord.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_d, 'role', 'authenticated')::text, true);
  select n into v_n from public.annonces_ca_monte(100) where annonce_id = v_annonce;
  if v_n <> 3 then raise exception 'ÉCHEC 7 : Ça monte compte % (attendu 3)', v_n; end if;
  if (select annonce_id from public.annonces_ca_monte(100) where annonce_id in (v_annonce, v_autre) limit 1) <> v_annonce then
    raise exception 'ÉCHEC 7 : ordre de Ça monte';
  end if;

  -- 8. Un visiteur non connecté ne lit rien.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v_n from public.soutiens;
    if v_n <> 0 then raise exception 'ÉCHEC 8 : un visiteur lit les soutiens'; end if;
  exception when insufficient_privilege then null;
  end;

  raise exception 'OK : 8 tests soutiens réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
