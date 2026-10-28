-- Colette, série et @mentions (28/10/2026).
-- À exécuter APRÈS la migration 0027. Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé.
-- Attendu : « OK : 8 tests Colette, série et mentions réussis ».
do $test$
declare
  v_a uuid := '00000000-0000-0000-0000-0000000027a1'; -- auteur du post
  v_b uuid := '00000000-0000-0000-0000-0000000027a2'; -- mentionné
  v_c uuid := '00000000-0000-0000-0000-0000000027a3'; -- commente
  v_annonce uuid;
  v_cachee uuid;
  v_n int;
  v_s json;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.m1@mail-esp.com', '{"prenom":"Ana","pseudo":"test.m1","campus":"Bordeaux"}'),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.m2@mail-esp.com', '{"prenom":"Ben","pseudo":"test.m2","campus":"Bordeaux"}'),
    (v_c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.m3@mail-esp.com', '{"prenom":"Cléo","pseudo":"test.m3","campus":"Lyon"}');
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'photo', 'Test 0027 photos', 'Des photos pour vos événements d''asso.', 'gratuit') returning id into v_annonce;
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie)
    values (v_a, 'propose', 'photo', 'Test 0027 cachée', 'Une annonce que la modération doit encore vérifier.', 'gratuit') returning id into v_cachee;
  -- A a aussi publié il y a 1 et 2 semaines : 3 semaines d'affilée avec cette semaine.
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, cree_le) values
    (v_a, 'propose', 'dev', 'Test 0027 semaine -1', 'Une annonce publiée la semaine dernière.', 'gratuit', now() - interval '7 days'),
    (v_a, 'propose', 'dev', 'Test 0027 semaine -2', 'Une annonce publiée il y a deux semaines.', 'gratuit', now() - interval '14 days');
  -- B n'a rien fait depuis un mois : pas de série.
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, cree_le)
    values (v_b, 'propose', 'dev', 'Test 0027 ancienne', 'Une annonce publiée il y a un mois.', 'gratuit', now() - interval '30 days');
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.annonces set moderation = 'ok' where id = v_annonce;
  update public.annonces set moderation = 'a_verifier' where id = v_cachee;

  -- 1. La série compte les semaines d'affilée, et retombe à 0 après une semaine sans rien.
  if public.serie_semaines(v_a) <> 3 then raise exception 'ÉCHEC 1 : série de A = % (attendu 3)', public.serie_semaines(v_a); end if;
  if public.serie_semaines(v_b) <> 0 then raise exception 'ÉCHEC 1 : série de B = % (attendu 0)', public.serie_semaines(v_b); end if;

  set local role authenticated;

  -- 2. C mentionne B et A sous le post de A : B est prévenu par la mention, A une seule fois (le commentaire).
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_annonce, 'Trop bien ! @test.m2 regarde, et merci @test.m1.');
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_b and texte like '@test.m3 t''a mentionné%';
  if v_n <> 1 then raise exception 'ÉCHEC 2 : B a % notifications de mention (attendu 1)', v_n; end if;

  -- 3. Pas de double notification pour l'auteur du post.
  select count(*) into v_n from public.notifications where destinataire_id = v_a;
  if v_n <> 1 then raise exception 'ÉCHEC 3 : A a % notifications (attendu 1)', v_n; end if;

  -- 4. Une mention sous une annonce cachée ne prévient personne (on ne révèle pas un post caché).
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_cachee, 'Note pour @test.m2');
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_b;
  if v_n <> 1 then raise exception 'ÉCHEC 4 : mention sur un post caché notifiée'; end if;

  -- 5. Se mentionner soi-même ne notifie pas.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  insert into public.commentaires (cible_type, cible_id, contenu) values ('annonce', v_annonce, 'Moi c''est @test.m3');
  reset role;
  select count(*) into v_n from public.notifications where destinataire_id = v_c;
  if v_n <> 0 then raise exception 'ÉCHEC 5 : on se notifie soi-même'; end if;

  -- 6. Les stats comptent les commentaires écrits et les réactions reçues.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  insert into public.reactions (cible_type, cible_id, type) values ('annonce', v_annonce, 'bravo'), ('annonce', v_annonce, 'merci');
  reset role;
  v_s := public.stats_profil(v_c);
  if (v_s->>'commentaires')::int <> 2 then raise exception 'ÉCHEC 6 : commentaires de C = %', v_s->>'commentaires'; end if;
  v_s := public.stats_profil(v_a);
  if (v_s->>'reactions_recues')::int <> 2 then raise exception 'ÉCHEC 6 : réactions reçues par A = %', v_s->>'reactions_recues'; end if;

  -- 7. Une nouvelle pièce libre (fleur) passe ; le micro (3 commentaires) est refusé à B qui n'a rien écrit.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  update public.profils set colette_accessoire = 'fleur', colette_motif = 'mariniere' where id = v_b;
  begin
    update public.profils set colette_accessoire = 'micro' where id = v_b;
    raise exception 'ÉCHEC 7 : micro accepté sans commentaire';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;

  -- 8. A, avec 3 semaines d'affilée, a gagné la flamme et le motif étoilé.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  update public.profils set colette_accessoire = 'flamme', colette_motif = 'etoiles' where id = v_a;
  reset role;
  select count(*) into v_n from public.profils where id = v_a and colette_accessoire = 'flamme' and colette_motif = 'etoiles';
  if v_n <> 1 then raise exception 'ÉCHEC 8 : flamme refusée malgré la série'; end if;

  raise exception 'OK : 8 tests Colette, série et mentions réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
