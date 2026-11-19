-- Coût des IA et plafond (19/11/2026). À exécuter APRÈS la migration 0035.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 6 tests coût IA réussis ».
do $test$
declare
  v_etu uuid := '00000000-0000-0000-0000-0000000035a1';
  v_adm uuid := '00000000-0000-0000-0000-0000000035a2';
  v_n int;
  v_p numeric;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_etu, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.c1@mail-esp.com', '{"prenom":"Eva","pseudo":"test.c1","campus":"Bordeaux"}'),
    (v_adm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.c2@mail-esp.com', '{"prenom":"Ali","pseudo":"test.c2","campus":"Bordeaux"}');
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profils set role = 'admin' where id = v_adm;
  -- Le serveur (clé secrète) note un appel.
  insert into public.ia_usages (ia, modele, tokens_entree, tokens_sortie, cout_eur) values ('moderation', 'google/gemini-2.5-flash', 2000, 300, 0.0012);

  set local role authenticated;

  -- 1. Un étudiant ne lit pas la dépense.
  perform set_config('request.jwt.claims', json_build_object('sub', v_etu, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.ia_usages;
  if v_n <> 0 then raise exception 'ÉCHEC 1 : un étudiant lit les coûts des IA'; end if;

  -- 2. Un étudiant ne peut pas ajouter de fausses lignes (pour épuiser le plafond).
  begin
    insert into public.ia_usages (ia, modele, cout_eur) values ('tri', 'x', 999);
    raise exception 'ÉCHEC 2 : un étudiant ajoute une consommation';
  exception when insufficient_privilege then null;
  end;

  -- 3. Un étudiant ne change pas le plafond (ni ne le lit).
  update public.ia_reglages set plafond_eur = 1000;
  select count(*) into v_n from public.ia_reglages;
  if v_n <> 0 then raise exception 'ÉCHEC 3 : un étudiant lit le plafond'; end if;
  reset role;
  select plafond_eur into v_p from public.ia_reglages;
  if v_p <> 5 then raise exception 'ÉCHEC 3 : un étudiant a changé le plafond (%)', v_p; end if;
  set local role authenticated;

  -- 4. L'admin lit la dépense.
  perform set_config('request.jwt.claims', json_build_object('sub', v_adm, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.ia_usages where ia = 'moderation';
  if v_n < 1 then raise exception 'ÉCHEC 4 : l''admin ne lit pas les coûts'; end if;

  -- 5. L'admin règle le plafond, dans les bornes.
  update public.ia_reglages set plafond_eur = 2, maj_le = now();
  select plafond_eur into v_p from public.ia_reglages;
  if v_p <> 2 then raise exception 'ÉCHEC 5 : l''admin ne peut pas régler le plafond'; end if;
  begin
    update public.ia_reglages set plafond_eur = -1;
    raise exception 'ÉCHEC 5 : plafond négatif accepté';
  exception when check_violation then null;
  end;

  -- 6. Un visiteur non connecté ne lit rien.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v_n from public.ia_usages;
    if v_n <> 0 then raise exception 'ÉCHEC 6 : un visiteur lit les coûts'; end if;
  exception when insufficient_privilege then null;
  end;

  raise exception 'OK : 6 tests coût IA réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
