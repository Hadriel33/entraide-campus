-- Campus ESP (22/10/2026) : l'ESD rejoint l'ESP, la compétition se joue entre les 6 campus.
-- À exécuter APRÈS la migration 0024. Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé.
-- Attendu : « OK : 8 tests campus réussis ».
-- 1 inscription avec le campus Lyon -> profil Lyon · 2 campus inconnu refusé · 3 sans campus -> Bordeaux
-- 4 un étudiant ne change pas son campus lui-même · 5 l'admin le change, un étudiant non
-- 6 un étudiant @mail-esd.com rejoint une formation ESP de son campus · 7 pas une classe d'un autre campus
-- 8 une classe proposée l'est pour son propre campus, pas un autre
do $test$
declare
  v_lyon uuid := '00000000-0000-0000-0000-0000000024a1';
  v_bdx uuid := '00000000-0000-0000-0000-0000000024a2';
  v_admin uuid := (select id from public.profils where role = 'admin' limit 1);
  v_classe_esp_bdx uuid := (select id from public.classes where ecole = 'ESP' and campus = 'Bordeaux' and validee limit 1);
  v_classe_paris uuid;
  v_n int;
  v_campus text;
begin
  -- 1 et 3 : le campus vient du formulaire d'inscription, Bordeaux par défaut.
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_lyon, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.lyon@mail-esp.com', '{"prenom":"Lou","pseudo":"test.lyon","campus":"Lyon"}'),
    (v_bdx, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.bdx@mail-esd.com', '{"prenom":"Bao","pseudo":"test.bdx"}');
  select campus into v_campus from public.profils where id = v_lyon;
  if v_campus is distinct from 'Lyon' then raise exception 'ÉCHEC 1 : campus Lyon non enregistré (%)', v_campus; end if;
  select campus into v_campus from public.profils where id = v_bdx;
  if v_campus is distinct from 'Bordeaux' then raise exception 'ÉCHEC 3 : pas de campus par défaut (%)', v_campus; end if;

  -- 2 : un campus qui n'existe pas est refusé.
  begin
    insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
      ('00000000-0000-0000-0000-0000000024a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.mars@mail-esp.com', '{"prenom":"Max","pseudo":"test.mars","campus":"Mars"}');
    raise exception 'ÉCHEC 2 : campus inconnu accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- Une classe validée à Paris, créée par le serveur.
  insert into public.classes (ecole, campus, nom, validee) values ('ESP', 'Paris', 'Test 0024 Bachelor Paris', true) returning id into v_classe_paris;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_bdx, 'role', 'authenticated')::text, true);

  -- 4 : on ne change pas son campus soi-même (sinon on triche au championnat).
  begin
    update public.profils set campus = 'Paris' where id = v_bdx;
    raise exception 'ÉCHEC 4 : un étudiant a changé son campus';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 5 : changer_campus est réservé aux admins.
  begin
    perform public.changer_campus(v_bdx, 'Lille');
    raise exception 'ÉCHEC 5 : un étudiant a utilisé changer_campus';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 6 : l'école fusionnée : un compte @mail-esd.com rejoint une formation ESP de son campus.
  update public.profils set classe_id = v_classe_esp_bdx where id = v_bdx;
  select count(*) into v_n from public.profils where id = v_bdx and classe_id = v_classe_esp_bdx;
  if v_n <> 1 then raise exception 'ÉCHEC 6 : formation ESP refusée à un compte ESD du même campus'; end if;

  -- 7 : pas de classe d'un autre campus.
  begin
    update public.profils set classe_id = v_classe_paris where id = v_bdx;
    raise exception 'ÉCHEC 7 : classe d''un autre campus acceptée';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 8 : proposer une classe pour un autre campus est refusé.
  begin
    insert into public.classes (ecole, campus, nom, validee, proposee_par) values ('ESP', 'Paris', 'Test 0024 proposition', false, v_bdx);
    raise exception 'ÉCHEC 8 : proposition de classe pour un autre campus acceptée';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 5 bis : l'admin, lui, peut corriger un campus.
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform public.changer_campus(v_bdx, 'Lille');
  reset role;
  select campus into v_campus from public.profils where id = v_bdx;
  if v_campus is distinct from 'Lille' then raise exception 'ÉCHEC 5 : l''admin n''a pas pu changer le campus'; end if;

  raise exception 'OK : 8 tests campus réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
