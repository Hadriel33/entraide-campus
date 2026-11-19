-- Partage d'un post-it et salons par thème (19/11/2026). À exécuter APRÈS la migration 0033.
-- Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé. Attendu : « OK : 8 tests partage réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000033a1'; -- Bordeaux, auteur du post-it
  v_b uuid := '00000000-0000-0000-0000-0000000033a2'; -- Lyon
  v_x uuid := '00000000-0000-0000-0000-0000000033a3'; -- Lille, étranger
  v_annonce uuid;
  v_cachee uuid;
  v_demande uuid;
  v_n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.t1@mail-esp.com', '{"prenom":"Ana","pseudo":"test.t1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.t2@mail-esp.com', '{"prenom":"Ben","pseudo":"test.t2","campus":"Lyon"}'),
    (v_x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.t3@mail-esp.com', '{"prenom":"Xav","pseudo":"test.t3","campus":"Lille"}');
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'photo', 'Test 0033 partagé', 'Des portraits pour ton profil LinkedIn.', 'gratuit') returning id into v_annonce;
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'photo', 'Test 0033 caché', 'Une annonce que la modération doit encore vérifier.', 'gratuit') returning id into v_cachee;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id = v_annonce;
  update public.annonces set moderation = 'a_verifier' where id = v_cachee;

  set local role authenticated;

  -- 1. B (Lyon) partage le post-it de A dans le salon thématique « Photo et vidéo ».
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.salon_messages (salon, contenu, annonce_id) values ('theme:photo-video', 'Regardez ça', v_annonce);

  -- 2. Un étudiant d'un autre campus (Lille) lit le salon thématique et voit le post-it partagé.
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.salon_messages m join public.annonces a on a.id = m.annonce_id
    where m.salon = 'theme:photo-video' and m.annonce_id = v_annonce;
  if v_n <> 1 then raise exception 'ÉCHEC 2 : le salon thématique n''est pas ouvert à tous'; end if;

  -- 3. Un thème inventé est refusé par la base.
  begin
    insert into public.salon_messages (salon, contenu) values ('theme:pirate', 'Coucou');
    raise exception 'ÉCHEC 3 : salon inventé accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 4. On ne partage pas un post-it caché (en attente de modération) : il n'est pas visible.
  begin
    insert into public.salon_messages (salon, contenu, annonce_id) values ('general', 'Un post-it caché', v_cachee);
    raise exception 'ÉCHEC 4 : partage d''un post-it caché accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 5. Toujours pas dans le salon du campus d'un autre.
  begin
    insert into public.salon_messages (salon, contenu, annonce_id) values ('campus:Bordeaux', 'Je m''invite', v_annonce);
    raise exception 'ÉCHEC 5 : partage dans le salon d''un autre campus accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- Une discussion acceptée entre B et A.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.demandes_contact (annonce_id) values (v_annonce) returning id into v_demande;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  perform public.repondre_demande(v_demande, true);

  -- 6. A partage son post-it dans la discussion ; un étranger ne peut ni l'y glisser ni la lire.
  insert into public.messages (demande_id, contenu, annonce_id) values (v_demande, 'Voilà le post-it', v_annonce);
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  begin
    insert into public.messages (demande_id, contenu, annonce_id) values (v_demande, 'Je m''incruste', v_annonce);
    raise exception 'ÉCHEC 6 : un étranger partage dans la discussion d''autrui';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  select count(*) into v_n from public.messages where demande_id = v_demande;
  if v_n <> 0 then raise exception 'ÉCHEC 6 : un étranger lit la discussion (règle d''or n°3)'; end if;

  -- 7. Le post-it est masqué ensuite : le message reste, mais le post-it n'est plus lisible par les autres.
  reset role;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'a_verifier' where id = v_annonce;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.salon_messages m where m.salon = 'theme:photo-video' and m.annonce_id = v_annonce;
  if v_n <> 1 then raise exception 'ÉCHEC 7 : le message a disparu avec le post-it'; end if;
  select count(*) into v_n from public.annonces where id = v_annonce;
  if v_n <> 0 then raise exception 'ÉCHEC 7 : le post-it masqué reste lisible via le partage'; end if;

  -- 8. Un visiteur non connecté ne lit pas les salons thématiques.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v_n from public.salon_messages where salon like 'theme:%';
    if v_n <> 0 then raise exception 'ÉCHEC 8 : un visiteur lit les salons thématiques'; end if;
  exception when insufficient_privilege then null;
  end;

  raise exception 'OK : 8 tests partage réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
