-- Côté réseau social (22/10/2026) : salons, réactions, commentaires.
-- À exécuter APRÈS la migration 0025. Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé.
-- Attendu : « OK : 12 tests social réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000025a1'; -- Bordeaux, classe X
  v_b uuid := '00000000-0000-0000-0000-0000000025a2'; -- Bordeaux, sans classe
  v_c uuid := '00000000-0000-0000-0000-0000000025a3'; -- Lyon
  v_admin uuid := (select id from public.profils where role = 'admin' limit 1);
  v_classe uuid;
  v_annonce uuid;
  v_cachee uuid;
  v_com uuid;
  v_n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.s1@mail-esp.com', '{"prenom":"Ana","pseudo":"test.s1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.s2@mail-esd.com', '{"prenom":"Ben","pseudo":"test.s2","campus":"Bordeaux"}'),
    (v_c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.s3@mail-esp.com', '{"prenom":"Cléo","pseudo":"test.s3","campus":"Lyon"}');
  insert into public.classes (ecole, campus, nom, validee) values ('ESP', 'Bordeaux', 'Test 0025 classe', true) returning id into v_classe;
  update public.profils set classe_id = v_classe where id = v_a;
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'photo', 'Test 0025 photos', 'Des photos pour vos événements d''asso.', 'gratuit') returning id into v_annonce;
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'photo', 'Test 0025 cachée', 'Une annonce que la modération doit encore vérifier.', 'gratuit') returning id into v_cachee;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id = v_annonce;
  update public.annonces set moderation = 'a_verifier' where id = v_cachee;

  set local role authenticated;

  -- A écrit dans le général, son campus et sa classe.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  insert into public.salon_messages (salon, contenu) values ('general', 'Salut tout le monde');
  insert into public.salon_messages (salon, contenu) values ('campus:Bordeaux', 'Qui vient au BDE ?');
  insert into public.salon_messages (salon, contenu) values ('classe:' || v_classe, 'Rendu du projet vendredi');

  -- 1. A ne peut pas écrire dans le salon d'un autre campus.
  begin
    insert into public.salon_messages (salon, contenu) values ('campus:Lyon', 'Coucou Lyon');
    raise exception 'ÉCHEC 1 : message dans le salon d''un autre campus';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 2. Pas de numéro de téléphone dans un salon (règle d'or n°1 : on passe par « Demander le contact »).
  begin
    insert into public.salon_messages (salon, contenu) values ('general', 'Appelez-moi au 06 12 34 56 78');
    raise exception 'ÉCHEC 2 : numéro accepté dans un salon';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 3. On ne signe pas à la place d'un autre : l'auteur est imposé par la base.
  insert into public.salon_messages (salon, contenu, auteur_id) values ('general', 'Je suis B ?', v_b);
  select count(*) into v_n from public.salon_messages where contenu = 'Je suis B ?' and auteur_id = v_a;
  if v_n <> 1 then raise exception 'ÉCHEC 3 : auteur non imposé'; end if;

  -- 4. B (même campus, pas la même classe) lit le général et le campus, pas la classe.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.salon_messages where auteur_id = v_a and salon in ('general', 'campus:Bordeaux');
  if v_n <> 3 then raise exception 'ÉCHEC 4 : B ne lit pas le général ou son campus (%)', v_n; end if;
  select count(*) into v_n from public.salon_messages where salon like 'classe:%' and auteur_id = v_a;
  if v_n <> 0 then raise exception 'ÉCHEC 4 : B lit le salon d''une classe qui n''est pas la sienne'; end if;

  -- 5. C (Lyon) ne lit pas le salon du campus de Bordeaux.
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.salon_messages where salon = 'campus:Bordeaux' and auteur_id = v_a;
  if v_n <> 0 then raise exception 'ÉCHEC 5 : Lyon lit le salon de Bordeaux'; end if;

  -- 6. Réaction sur l'annonce de A : une seule fois par type.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.reactions (cible_type, cible_id, type) values ('annonce', v_annonce, 'bravo');
  begin
    insert into public.reactions (cible_type, cible_id, type) values ('annonce', v_annonce, 'bravo');
    raise exception 'ÉCHEC 6 : deux fois la même réaction';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 7. Pas de réaction sur sa propre annonce.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  begin
    insert into public.reactions (cible_type, cible_id, type) values ('annonce', v_annonce, 'feu');
    raise exception 'ÉCHEC 7 : réaction sur sa propre annonce';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 8. Commentaire de B sur l'annonce visible : accepté.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_annonce, 'Super idée, je partage à mon asso')
    returning id into v_com;

  -- 9. Pas de commentaire ni de réaction sur une annonce cachée (à vérifier).
  begin
    insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_cachee, 'Je la vois quand même ?');
    raise exception 'ÉCHEC 9 : commentaire sur une annonce cachée';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 10. Pas d'email dans un commentaire.
  begin
    insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_annonce, 'Écris-moi : ben@gmail.com');
    raise exception 'ÉCHEC 10 : email accepté dans un commentaire';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 11. C ne supprime pas le commentaire de B ; l'admin, oui.
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  delete from public.commentaires where id = v_com;
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.commentaires where id = v_com;
  if v_n <> 1 then raise exception 'ÉCHEC 11 : un autre a supprimé le commentaire'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  delete from public.commentaires where id = v_com;
  select count(*) into v_n from public.commentaires where id = v_com;
  if v_n <> 0 then raise exception 'ÉCHEC 11 : l''admin n''a pas pu supprimer'; end if;

  -- 12. Un visiteur non connecté ne lit rien.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v_n from public.salon_messages;
    if v_n <> 0 then raise exception 'ÉCHEC 12 : un visiteur lit les salons'; end if;
  exception when insufficient_privilege then null;
  end;

  raise exception 'OK : 12 tests social réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
