-- Garde-robe élargie (26/11/2026). À exécuter APRÈS la migration 0037.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 3 tests garde-robe réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000037a1';
  v_b uuid := '00000000-0000-0000-0000-0000000037a2';
  v_c text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g1@mail-esp.com', '{"prenom":"Gus","pseudo":"test.g1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.g2@mail-esp.com', '{"prenom":"Gia","pseudo":"test.g2","campus":"Bordeaux"}');
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);

  -- 1. Un nouveau (aucune stat) choisit les nouveautés : tout est libre.
  update public.profils set colette_couleur = 'menthe', colette_humeur = 'rit', colette_accessoire = 'antennes' where id = v_a;
  select colette_couleur || '/' || colette_humeur || '/' || colette_accessoire into v_c from public.profils where id = v_a;
  if v_c <> 'menthe/rit/antennes' then raise exception 'ÉCHEC 1 : nouveautés refusées (%)', v_c; end if;

  -- 2. Une valeur inventée reste refusée.
  begin
    update public.profils set colette_couleur = 'fluo' where id = v_a;
    raise exception 'ÉCHEC 2 : couleur inventée acceptée';
  exception when check_violation then null;
  end;

  -- 3. On ne change toujours pas la Colette de quelqu'un d'autre.
  update public.profils set colette_accessoire = 'moustache' where id = v_b;
  reset role;
  select colette_accessoire into v_c from public.profils where id = v_b;
  if v_c = 'moustache' then raise exception 'ÉCHEC 3 : Colette d''un autre modifiée'; end if;

  raise exception 'OK : 3 tests garde-robe réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
