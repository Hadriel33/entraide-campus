-- Post-its de groupe (28/10/2026). À exécuter APRÈS la migration 0029.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 12 tests groupe réussis ».
do $test$
declare
  v_c uuid := '00000000-0000-0000-0000-0000000029c1'; -- créateur
  v_m uuid := '00000000-0000-0000-0000-0000000029c2'; -- membre invité
  v_x uuid := '00000000-0000-0000-0000-0000000029c3'; -- étranger
  v_d uuid := '00000000-0000-0000-0000-0000000029c4'; -- demandeur
  v_e1 uuid := '00000000-0000-0000-0000-0000000029c5';
  v_e2 uuid := '00000000-0000-0000-0000-0000000029c6';
  v_e3 uuid := '00000000-0000-0000-0000-0000000029c7';
  v_annonce uuid;
  v_demande uuid;
  v_n int;
  v_ok boolean;
  v_s json;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g1@mail-esp.com', '{"prenom":"Cam","pseudo":"test.g1","campus":"Bordeaux"}'),
    (v_m, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g2@mail-esp.com', '{"prenom":"Mia","pseudo":"test.g2","campus":"Bordeaux"}'),
    (v_x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g3@mail-esp.com', '{"prenom":"Xav","pseudo":"test.g3","campus":"Bordeaux"}'),
    (v_d, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g4@mail-esp.com', '{"prenom":"Dina","pseudo":"test.g4","campus":"Lyon"}'),
    (v_e1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g5@mail-esp.com', '{"prenom":"Eva","pseudo":"test.g5","campus":"Bordeaux"}'),
    (v_e2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g6@mail-esp.com', '{"prenom":"Eli","pseudo":"test.g6","campus":"Bordeaux"}'),
    (v_e3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g7@mail-esp.com', '{"prenom":"Ezra","pseudo":"test.g7","campus":"Bordeaux"}');
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_c, 'propose', 'shooting', 'Test 0029 shooting à deux', 'On propose un shooting photo et vidéo à deux.', 'gratuit') returning id into v_annonce;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id = v_annonce;

  set local role authenticated;

  -- 1. Un étranger ne peut pas inviter sur le post-it d'un autre.
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  begin
    insert into public.annonce_membres (annonce_id, membre_id) values (v_annonce, v_x);
    raise exception 'ÉCHEC 1 : un étranger s''ajoute au groupe';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 2. Le créateur invite M : M est prévenu.
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  insert into public.annonce_membres (annonce_id, membre_id) values (v_annonce, v_m);
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_m and type = 'groupe';
  if v_n <> 1 then raise exception 'ÉCHEC 2 : invitation non notifiée'; end if;

  -- 3. Une invitation en attente est invisible pour un étranger ; M invité ne modifie pas encore.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.annonce_membres where annonce_id = v_annonce;
  if v_n <> 0 then raise exception 'ÉCHEC 3 : invitation en attente visible d''un étranger'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_m, 'role', 'authenticated')::text, true);
  update public.annonces set titre = 'Titre changé par un invité' where id = v_annonce;
  reset role;
  select count(*) into v_n from public.annonces where id = v_annonce and titre = 'Titre changé par un invité';
  if v_n <> 0 then raise exception 'ÉCHEC 3 : un invité (pas encore d''accord) modifie le post-it'; end if;

  -- 4. M accepte : le créateur est prévenu, et M apparaît pour tous.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_m, 'role', 'authenticated')::text, true);
  update public.annonce_membres set statut = 'accepte' where annonce_id = v_annonce and membre_id = v_m;
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_c and type = 'groupe';
  if v_n <> 1 then raise exception 'ÉCHEC 4 : le créateur n''est pas prévenu'; end if;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.annonce_membres where annonce_id = v_annonce;
  if v_n <> 1 then raise exception 'ÉCHEC 4 : le membre accepté n''est pas visible'; end if;

  -- 5. Règle d'or n°2 : M modifie le texte, mais ne supprime pas ; un étranger ne modifie pas.
  perform set_config('request.jwt.claims', json_build_object('sub', v_m, 'role', 'authenticated')::text, true);
  update public.annonces set description = 'Description réécrite par le membre du groupe.' where id = v_annonce;
  delete from public.annonces where id = v_annonce;
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  update public.annonces set titre = 'Piraté' where id = v_annonce;
  reset role;
  select count(*) into v_n from public.annonces where id = v_annonce and description = 'Description réécrite par le membre du groupe.' and titre <> 'Piraté';
  if v_n <> 1 then raise exception 'ÉCHEC 5 : modification par le membre, suppression ou piratage'; end if;
  -- (le texte a changé : Colette doit relire ; on revalide pour la suite du test)
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id = v_annonce;

  -- 6. 4 personnes au plus : la 3e invitation passe, la 4e est refusée.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  insert into public.annonce_membres (annonce_id, membre_id) values (v_annonce, v_e1), (v_annonce, v_e2);
  begin
    insert into public.annonce_membres (annonce_id, membre_id) values (v_annonce, v_e3);
    raise exception 'ÉCHEC 6 : 5e personne acceptée';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 7. Un membre ne demande pas le contact de son propre post-it, ni ne le soutient.
  perform set_config('request.jwt.claims', json_build_object('sub', v_m, 'role', 'authenticated')::text, true);
  begin
    insert into public.demandes_contact (annonce_id) values (v_annonce);
    raise exception 'ÉCHEC 7 : un membre demande son propre contact';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  begin
    insert into public.soutiens (annonce_id) values (v_annonce);
    raise exception 'ÉCHEC 7 : un membre soutient son propre post-it';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 8. D demande le contact : M (membre) est prévenu et lit la demande.
  perform set_config('request.jwt.claims', json_build_object('sub', v_d, 'role', 'authenticated')::text, true);
  insert into public.demandes_contact (annonce_id) values (v_annonce) returning id into v_demande;
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_m and type = 'demande_recue';
  if v_n <> 1 then raise exception 'ÉCHEC 8 : le membre n''est pas prévenu de la demande'; end if;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_m, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.demandes_contact where id = v_demande;
  if v_n <> 1 then raise exception 'ÉCHEC 8 : le membre ne lit pas la demande'; end if;

  -- 9. Un étranger ne peut pas répondre ; M accepte et devient le destinataire.
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  begin
    perform public.repondre_demande(v_demande, true);
    raise exception 'ÉCHEC 9 : un étranger répond à la demande';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_m, 'role', 'authenticated')::text, true);
  perform public.repondre_demande(v_demande, true);
  reset role;
  select count(*) into v_n from public.demandes_contact where id = v_demande and statut = 'acceptee' and destinataire_id = v_m;
  if v_n <> 1 then raise exception 'ÉCHEC 9 : acceptation par le membre'; end if;

  -- 10. Règle d'or n°1 : D voit les coordonnées de M (qui a accepté), PAS celles du créateur.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_d, 'role', 'authenticated')::text, true);
  if not public.peut_voir_coordonnees(v_m) then raise exception 'ÉCHEC 10 : coordonnées de celui qui accepte invisibles'; end if;
  if public.peut_voir_coordonnees(v_c) then raise exception 'ÉCHEC 10 : coordonnées du créateur montrées sans son accord'; end if;

  -- 11. Règle d'or n°3 : la discussion de groupe (D, M, le créateur) ; un étranger ne lit ni n'écrit.
  insert into public.messages (demande_id, contenu) values (v_demande, 'Salut le groupe !');
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  insert into public.messages (demande_id, contenu) values (v_demande, 'Salut, on est deux sur ce shooting.');
  select count(*) into v_n from public.messages where demande_id = v_demande;
  if v_n <> 2 then raise exception 'ÉCHEC 11 : le créateur ne lit pas la discussion de groupe'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.messages where demande_id = v_demande;
  if v_n <> 0 then raise exception 'ÉCHEC 11 : un étranger lit la discussion'; end if;
  begin
    insert into public.messages (demande_id, contenu) values (v_demande, 'Je m''incruste');
    raise exception 'ÉCHEC 11 : un étranger écrit dans la discussion';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  -- Un invité qui n'a pas encore accepté (E1) ne lit pas non plus.
  perform set_config('request.jwt.claims', json_build_object('sub', v_e1, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.messages where demande_id = v_demande;
  if v_n <> 0 then raise exception 'ÉCHEC 11 : un simple invité lit la discussion'; end if;

  -- 12 bis. Chaque message prévient tous les autres participants du groupe.
  reset role;
  select count(*) into v_n from public.notifications where type = 'message' and lien = '/demandes/' || v_demande and destinataire_id in (v_c, v_m, v_d);
  if v_n <> 3 then raise exception 'ÉCHEC 12 : % participants prévenus des messages (attendu 3 : D, M et le créateur)', v_n; end if;

  -- 12. L'entraide compte pour toute l'équipe : le créateur et M ont chacun aidé 1 personne.
  v_s := public.stats_profil(v_c);
  if (v_s->>'aides_donnees')::int <> 1 then raise exception 'ÉCHEC 12 : entraide non comptée pour le créateur (%)', v_s->>'aides_donnees'; end if;
  v_s := public.stats_profil(v_m);
  if (v_s->>'aides_donnees')::int <> 1 then raise exception 'ÉCHEC 12 : entraide non comptée pour le membre (%)', v_s->>'aides_donnees'; end if;
  v_s := public.stats_profil(v_d);
  if (v_s->>'aides_recues')::int <> 1 then raise exception 'ÉCHEC 12 : le demandeur n''a pas reçu d''aide (%)', v_s->>'aides_recues'; end if;

  raise exception 'OK : 12 tests groupe réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
