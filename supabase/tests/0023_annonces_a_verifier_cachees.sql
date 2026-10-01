-- Faille du 02/10 : une annonce « à vérifier » ne doit être visible que de son auteur et de l'admin.
-- À coller dans Supabase › SQL Editor APRÈS la migration 0023 (le campus de démo doit exister).
-- Le bloc finit TOUJOURS par une erreur volontaire, pour tout annuler : rien n'est gardé en base.
-- Attendu : « OK : 6 tests réussis ». Sinon, le message dit quel test échoue.
do $test$
declare
  v_annonce uuid;
  v_yanis uuid := (select id from public.profils where pseudo = 'yanis.growth');
  v_lena uuid := (select id from public.profils where pseudo = 'lena.rse');
  v_admin uuid := (select id from public.profils where role = 'admin' limit 1);
  v_n int;
begin
  -- Une annonce de Yanis, classée « à vérifier » par le serveur (numéro dans le texte).
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
  values (v_yanis, 'propose', 'coup_de_main', 'Test 0023 cours', 'Appelle-moi au 06 11 22 33 44 pour un cours.', 'gratuit')
  returning id into v_annonce;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'a_verifier', moderation_raisons = array['Coordonnées dans le texte'] where id = v_annonce;

  set local role authenticated;

  -- 1. Une autre étudiante ne la voit pas.
  perform set_config('request.jwt.claims', json_build_object('sub', v_lena, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.annonces where id = v_annonce;
  if v_n <> 0 then raise exception 'ÉCHEC 1 : une annonce à vérifier est visible des autres'; end if;

  -- 2. Elle ne peut pas demander le contact en connaissant l'id.
  begin
    insert into public.demandes_contact (annonce_id, destinataire_id) values (v_annonce, v_yanis);
    raise exception 'ÉCHEC 2 : demande de contact acceptée sur une annonce cachée';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 3. L'auteur la voit (avec la correction proposée).
  perform set_config('request.jwt.claims', json_build_object('sub', v_yanis, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.annonces where id = v_annonce;
  if v_n <> 1 then raise exception 'ÉCHEC 3 : l''auteur ne voit plus son annonce'; end if;

  -- 4. L'admin la voit, pour trancher.
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.annonces where id = v_annonce;
  if v_n <> 1 then raise exception 'ÉCHEC 4 : l''admin ne voit pas l''annonce à vérifier'; end if;

  -- 5. Les chiffres publics ne la comptent pas.
  if (public.stats_publiques()->>'annonces_actives')::int <> (
    select count(*) from public.annonces where statut = 'publiee' and moderation <> 'a_verifier' and expire_le > now()
  ) then raise exception 'ÉCHEC 5 : stats publiques'; end if;

  -- 6. Validée par la modération, elle redevient visible de tous.
  reset role;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok', moderation_raisons = '{}' where id = v_annonce;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_lena, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.annonces where id = v_annonce;
  if v_n <> 1 then raise exception 'ÉCHEC 6 : annonce validée toujours cachée'; end if;

  raise exception 'OK : 6 tests réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
