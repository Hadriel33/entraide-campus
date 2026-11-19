-- Suivi d'une entraide avec Colette livreuse (19/11/2026). À exécuter APRÈS la migration 0034.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 9 tests suivi réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000034a1'; -- auteur des post-its
  v_b uuid := '00000000-0000-0000-0000-0000000034a2'; -- demande le contact
  v_x uuid := '00000000-0000-0000-0000-0000000034a3'; -- étranger
  v_propose uuid;
  v_cherche uuid;
  v_d1 uuid;
  v_d2 uuid;
  v_n int;
  v_txt text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.s1@mail-esp.com', '{"prenom":"Ana","pseudo":"test.s1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.s2@mail-esp.com', '{"prenom":"Ben","pseudo":"test.s2","campus":"Bordeaux"}'),
    (v_x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.s3@mail-esp.com', '{"prenom":"Xav","pseudo":"test.s3","campus":"Lyon"}');
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'video', 'Test 0034 je monte', 'Je monte ta vidéo de démo en une semaine.', 'gratuit') returning id into v_propose;
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'cherche', 'photo', 'Test 0034 je cherche', 'Je cherche un portrait pour mon profil LinkedIn.', 'gratuit') returning id into v_cherche;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id in (v_propose, v_cherche);

  set local role authenticated;
  -- B demande le contact sur les deux post-its, A accepte.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.demandes_contact (annonce_id) values (v_propose) returning id into v_d1;
  insert into public.demandes_contact (annonce_id) values (v_cherche) returning id into v_d2;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  perform public.repondre_demande(v_d1, true);
  perform public.repondre_demande(v_d2, true);

  -- 1. « Je propose » : A (l'auteur) aide et avance, avec un petit mot ; B est prévenu.
  perform public.avancer_entraide(v_d1, 'en_cours', 'je monte la vidéo');
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_b and type = 'suivi' and texte like '%je monte la vidéo%';
  if v_n <> 1 then raise exception 'ÉCHEC 1 : B n''est pas prévenu de l''avancement'; end if;
  set local role authenticated;

  -- 2. B (qui reçoit l'aide) ne peut pas avancer à la place de A.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  begin
    perform public.avancer_entraide(v_d1, 'livre', null);
    raise exception 'ÉCHEC 2 : celui qui reçoit avance le suivi';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 3. Un étranger ne lit pas le suivi et ne peut pas l'avancer (règle d'or n°3 : l'échange reste entre eux).
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.suivis_entraide where demande_id = v_d1;
  if v_n <> 0 then raise exception 'ÉCHEC 3 : un étranger lit le suivi'; end if;
  begin
    perform public.avancer_entraide(v_d1, 'presque', null);
    raise exception 'ÉCHEC 3 : un étranger avance le suivi';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 4. Pas de retour en arrière, pas de numéro dans le petit mot.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  begin
    perform public.avancer_entraide(v_d1, 'parti', null);
    raise exception 'ÉCHEC 4 : retour en arrière accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  begin
    perform public.avancer_entraide(v_d1, 'presque', 'appelle-moi au 06 12 34 56 78');
    raise exception 'ÉCHEC 4 : numéro accepté dans le petit mot';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 5. « Bien reçu » impossible avant la livraison.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  begin
    perform public.confirmer_entraide(v_d1);
    raise exception 'ÉCHEC 5 : « Bien reçu » avant la livraison';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 6. A livre ; A ne peut pas confirmer lui-même ; B confirme et A est prévenu.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  perform public.avancer_entraide(v_d1, 'livre', null);
  begin
    perform public.confirmer_entraide(v_d1);
    raise exception 'ÉCHEC 6 : celui qui aide confirme lui-même';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  perform public.confirmer_entraide(v_d1);
  select etape into v_txt from public.suivis_entraide where demande_id = v_d1;
  if v_txt <> 'recu' then raise exception 'ÉCHEC 6 : le suivi n''est pas passé à « Bien reçu » (%)', v_txt; end if;
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_a and type = 'suivi';
  if v_n <> 1 then raise exception 'ÉCHEC 6 : A n''est pas prévenu du « Bien reçu »'; end if;
  set local role authenticated;

  -- 7. « Je cherche » : c'est B (qui a demandé le contact) qui vient aider ; A ne peut pas avancer.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  perform public.avancer_entraide(v_d2, 'parti', null);
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  begin
    perform public.avancer_entraide(v_d2, 'livre', null);
    raise exception 'ÉCHEC 7 : l''auteur d''un « Je cherche » avance le suivi';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 8. Aucune écriture directe dans la table : tout passe par les fonctions.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  begin
    update public.suivis_entraide set etape = 'livre' where demande_id = v_d2;
    raise exception 'ÉCHEC 8 : modification directe du suivi acceptée';
  exception when insufficient_privilege then null;
  end;

  -- 9. Un visiteur non connecté ne lit rien.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v_n from public.suivis_entraide;
    if v_n <> 0 then raise exception 'ÉCHEC 9 : un visiteur lit les suivis'; end if;
  exception when insufficient_privilege then null;
  end;

  raise exception 'OK : 9 tests suivi réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
