-- Photos des post-its et signalement des messages (05/11/2026). À exécuter APRÈS la migration 0031.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 8 tests photos et signalements réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000031a1'; -- Bordeaux, auteur
  v_b uuid := '00000000-0000-0000-0000-0000000031a2'; -- Bordeaux
  v_c uuid := '00000000-0000-0000-0000-0000000031a3'; -- Lyon
  v_annonce uuid;
  v_com uuid;
  v_msg uuid;
  v_n int;
  v_txt text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.p1@mail-esp.com', '{"prenom":"Ana","pseudo":"test.p1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.p2@mail-esp.com', '{"prenom":"Ben","pseudo":"test.p2","campus":"Bordeaux"}'),
    (v_c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.p3@mail-esp.com', '{"prenom":"Cléo","pseudo":"test.p3","campus":"Lyon"}');
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'materiel', 'Test 0031 prêt', 'Je prête mon appareil photo pour un week-end.', 'gratuit') returning id into v_annonce;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id = v_annonce;

  set local role authenticated;

  -- 1. On ne pose pas la photo d'un autre (dossier d'un autre utilisateur).
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  begin
    update public.annonces set photo_chemin = v_b || '/11111111-2222-4333-8444-555555555555.jpg' where id = v_annonce;
    raise exception 'ÉCHEC 1 : photo prise dans le dossier d''un autre';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 2. Sa propre photo passe, et le post-it repart en relecture IA.
  update public.annonces set photo_chemin = v_a || '/11111111-2222-4333-8444-555555555555.jpg' where id = v_annonce;
  reset role;
  select moderation into v_txt from public.annonces where id = v_annonce;
  if v_txt <> 'en_attente' then raise exception 'ÉCHEC 2 : changer de photo ne relance pas la relecture (%)', v_txt; end if;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id = v_annonce;

  -- 3. Un chemin qui n'a pas la bonne forme est refusé par la base.
  begin
    update public.annonces set photo_chemin = '../../secret.png' where id = v_annonce;
    raise exception 'ÉCHEC 3 : chemin de photo invalide accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- Un commentaire de A, un message de A dans le salon de Bordeaux.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_annonce, 'Commentaire de test 0031') returning id into v_com;
  insert into public.salon_messages (salon, contenu) values ('campus:Bordeaux', 'Message de test 0031') returning id into v_msg;

  -- 4. B signale le commentaire : la base garde une copie et l'auteur du message.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.signalements_messages (cible_type, cible_id, motif) values ('commentaire', v_com, 'harcelement');
  reset role;
  select count(*) into v_n from public.signalements_messages
    where cible_id = v_com and auteur_id = v_b and auteur_signale_id = v_a and contenu_signale = 'Commentaire de test 0031';
  if v_n <> 1 then raise exception 'ÉCHEC 4 : signalement du commentaire mal enregistré'; end if;

  -- 5. Pas deux fois le même, et pas son propre message.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  begin
    insert into public.signalements_messages (cible_type, cible_id, motif) values ('commentaire', v_com, 'autre');
    raise exception 'ÉCHEC 5 : double signalement accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  begin
    insert into public.signalements_messages (cible_type, cible_id, motif) values ('salon', v_msg, 'autre');
    raise exception 'ÉCHEC 5 : signalement de son propre message accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 6. C (Lyon) ne peut pas signaler un message d'un salon qu'il ne lit pas.
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  begin
    insert into public.signalements_messages (cible_type, cible_id, motif) values ('salon', v_msg, 'inapproprie');
    raise exception 'ÉCHEC 6 : signalement d''un salon illisible accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 7. Un étudiant ne lit pas les signalements des autres (ni la copie du message).
  select count(*) into v_n from public.signalements_messages where cible_id = v_com;
  if v_n <> 0 then raise exception 'ÉCHEC 7 : un étudiant lit les signalements des autres'; end if;

  -- 8. Un visiteur non connecté ne lit rien.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v_n from public.signalements_messages;
    if v_n <> 0 then raise exception 'ÉCHEC 8 : un visiteur lit les signalements'; end if;
  exception when insufficient_privilege then null;
  end;

  raise exception 'OK : 8 tests photos et signalements réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
