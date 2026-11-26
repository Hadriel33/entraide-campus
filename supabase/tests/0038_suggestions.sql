-- Boîte à suggestions (26/11/2026). À exécuter APRÈS la migration 0038.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 6 tests suggestions réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000038a1'; -- étudiant qui suggère
  v_b uuid := '00000000-0000-0000-0000-0000000038a2'; -- autre étudiant
  v_adm uuid := '00000000-0000-0000-0000-0000000038a3';
  v_id uuid;
  v_n int;
  v_s text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.x1@mail-esp.com', '{"prenom":"Ada","pseudo":"test.x1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.x2@mail-esp.com', '{"prenom":"Bob","pseudo":"test.x2","campus":"Bordeaux"}'),
    (v_adm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.x3@mail-esp.com', '{"prenom":"Ali","pseudo":"test.x3","campus":"Bordeaux"}');
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profils set role = 'admin' where id = v_adm;

  set local role authenticated;

  -- 1. Un étudiant envoie une suggestion, en son nom.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  insert into public.suggestions (categorie, texte) values ('idee', 'Un mode sombre pour la carte.') returning id into v_id;
  select count(*) into v_n from public.suggestions where auteur_id = v_a;
  if v_n <> 1 then raise exception 'ÉCHEC 1 : suggestion non enregistrée'; end if;

  -- 2. Il ne peut pas écrire au nom d'un autre, ni se déclarer « faite ».
  begin
    insert into public.suggestions (auteur_id, categorie, texte) values (v_b, 'idee', 'Au nom de Bob, pas bien.');
    raise exception 'ÉCHEC 2 : suggestion au nom d''un autre';
  exception when insufficient_privilege then null;
  end;
  update public.suggestions set statut = 'faite' where id = v_id;
  reset role;
  select statut into v_s from public.suggestions where id = v_id;
  if v_s <> 'nouvelle' then raise exception 'ÉCHEC 2 : un étudiant change le statut (%)', v_s; end if;
  set local role authenticated;

  -- 3. Un autre étudiant ne lit pas les suggestions des autres.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.suggestions where id = v_id;
  if v_n <> 0 then raise exception 'ÉCHEC 3 : un étudiant lit la suggestion d''un autre'; end if;

  -- 4. L'admin lit tout et marque « faite ».
  perform set_config('request.jwt.claims', json_build_object('sub', v_adm, 'role', 'authenticated')::text, true);
  update public.suggestions set statut = 'faite' where id = v_id;
  select statut into v_s from public.suggestions where id = v_id;
  if v_s is distinct from 'faite' then raise exception 'ÉCHEC 4 : l''admin ne peut pas suivre la suggestion'; end if;

  -- 5. Anti-spam : la 6e suggestion du jour est refusée.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  insert into public.suggestions (categorie, texte) select 'autre', 'Suggestion numéro ' || g from generate_series(2, 5) g;
  begin
    insert into public.suggestions (categorie, texte) values ('autre', 'Une de trop aujourd''hui.');
    raise exception 'ÉCHEC 5 : la limite de 5 par jour ne marche pas';
  exception when sqlstate 'P0429' then null;
  end;

  -- 6. Un visiteur non connecté ne lit ni n'écrit rien.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v_n from public.suggestions;
    raise exception 'ÉCHEC 6 : un visiteur lit les suggestions (%)', v_n;
  exception when insufficient_privilege then null;
  end;

  raise exception 'OK : 6 tests suggestions réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
