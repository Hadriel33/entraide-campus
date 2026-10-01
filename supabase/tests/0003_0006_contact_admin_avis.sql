-- Tests de sécurité : règle d'or n°1 (coordonnées), demandes, rôle admin, modération, avis, stats.
-- Une seule transaction annulée. Chaque test lève une exception « TEST n ÉCHEC » s'il ne passe pas.
-- Résultat attendu : une ligne « 14 tests de sécurité OK ».
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sam.test@mail-esp.com','{"prenom":"Sam","ecole":"ESP","pseudo":"sam.photo"}'),
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lea.test@mail-esd.com','{"prenom":"Léa","ecole":"ESD","pseudo":"lea.dev"}'),
 ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tom.test@mail-esd.com','{"prenom":"Tom","ecole":"ESD","pseudo":"tom_c"}');
insert into public.annonces (id, auteur_id, type, categorie, titre, description, contrepartie) values
 ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','propose','photo','Photos pour vos événements','Soirées, galas, tournois, retouche comprise.','gratuit');
update public.coordonnees set telephone = '0612345678' where id = '00000000-0000-0000-0000-00000000000a';

set local role authenticated;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  c constant uuid := '00000000-0000-0000-0000-00000000000c';
  ann constant uuid := '20000000-0000-0000-0000-000000000001';
  n int;
  v_dest uuid;
  v_demande uuid;
  v_tel text;
  v_cible uuid;
  s json;
  bloque boolean;
begin
  -- Léa (B)
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.coordonnees where id = a;
  if n <> 0 then raise exception 'TEST 1 ÉCHEC : B voit les coordonnées de A sans accord'; end if;

  insert into public.demandes_contact (annonce_id, destinataire_id) values (ann, c) returning id, destinataire_id into v_demande, v_dest;
  if v_dest <> a then raise exception 'TEST 2 ÉCHEC : le destinataire a pu être détourné'; end if;

  update public.demandes_contact set statut = 'acceptee' where id = v_demande;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'TEST 3 ÉCHEC : le demandeur a accepté sa propre demande'; end if;

  -- Tom (C), étranger à la demande
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.demandes_contact;
  if n <> 0 then raise exception 'TEST 4 ÉCHEC : C voit une demande qui ne le concerne pas'; end if;

  -- Sam (A) accepte
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  update public.demandes_contact set statut = 'acceptee' where id = v_demande;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'TEST 5 ÉCHEC : le destinataire ne peut pas accepter'; end if;

  -- Léa voit maintenant le téléphone de Sam
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select telephone into v_tel from public.coordonnees where id = a;
  if v_tel is distinct from '0612345678' then raise exception 'TEST 6 ÉCHEC : B ne voit pas les coordonnées après accord'; end if;

  -- Tom ne les voit toujours pas
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.coordonnees where id = a;
  if n <> 0 then raise exception 'TEST 7 ÉCHEC : C voit les coordonnées de A'; end if;

  -- Sam ne peut pas changer sa réponse
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  bloque := false;
  begin update public.demandes_contact set statut = 'refusee' where id = v_demande; exception when others then bloque := true; end;
  if not bloque then raise exception 'TEST 8 ÉCHEC : une réponse a pu être modifiée'; end if;

  -- Léa ne peut pas se donner le rôle admin, ni directement ni par la fonction
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  bloque := false;
  begin update public.profils set role = 'admin' where id = b; exception when insufficient_privilege then bloque := true; end;
  if not bloque then raise exception 'TEST 9 ÉCHEC : élévation de rôle par UPDATE'; end if;
  bloque := false;
  begin perform public.definir_role(b, 'admin'); exception when others then bloque := true; end;
  if not bloque then raise exception 'TEST 10 ÉCHEC : élévation de rôle par definir_role'; end if;

  -- Sam ne peut pas masquer lui-même son annonce (réservé à la modération)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  bloque := false;
  begin update public.annonces set statut = 'masquee' where id = ann; exception when others then bloque := true; end;
  if not bloque then raise exception 'TEST 11 ÉCHEC : un auteur a masqué son annonce'; end if;

  -- Tom ne peut pas laisser d'avis sur une mise en relation dont il ne fait pas partie
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  bloque := false;
  begin insert into public.avis (demande_id, cible_id, note) values (v_demande, a, 1); exception when others then bloque := true; end;
  if not bloque then raise exception 'TEST 12 ÉCHEC : faux avis accepté'; end if;

  -- Léa laisse un avis : la cible est forcée sur Sam, même si elle essaie de viser Tom
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  insert into public.avis (demande_id, cible_id, note, commentaire) values (v_demande, c, 5, 'Super photos !') returning cible_id into v_cible;
  if v_cible <> a then raise exception 'TEST 13 ÉCHEC : la cible de l''avis a été détournée'; end if;

  -- Statistiques de Sam : 1 personne aidée, 1 croisement ESP × ESD, 1 avis à 5
  s := public.stats_profil(a);
  if (s ->> 'aides_donnees')::int <> 1 or (s ->> 'croisements')::int <> 1 or (s ->> 'nb_avis')::int <> 1 then
    raise exception 'TEST 14 ÉCHEC : statistiques incorrectes %', s;
  end if;
end;
$$;

select '14 tests de sécurité OK' as resultat;
rollback;
