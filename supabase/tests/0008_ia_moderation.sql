-- Tests de sécurité de la modération IA. Transaction annulée. Attendu : « 4 tests IA OK ».
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sam.test@exemple.fr','{"prenom":"Sam","ecole":"ESP","pseudo":"sam.photo"}');
set local role authenticated;
do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  v_id uuid; v_mod text; bloque boolean;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.annonces (type, categorie, titre, description, contrepartie, moderation, moderation_raisons)
  values ('propose','photo','Photos pour vos événements','Soirées, galas, tournois, retouche comprise.','gratuit','ok','{}')
  returning id, moderation into v_id, v_mod;
  if v_mod <> 'en_attente' then raise exception 'TEST IA 1 ÉCHEC : auto-validation à la création'; end if;
  bloque := false;
  begin update public.annonces set moderation = 'ok' where id = v_id; exception when insufficient_privilege then bloque := true; end;
  if not bloque then raise exception 'TEST IA 2 ÉCHEC : auto-validation par UPDATE'; end if;
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  update public.annonces set moderation = 'ok' where id = v_id;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  update public.annonces set description = 'Nouveau texte, envoie-moi ton IBAN pour réserver.' where id = v_id returning moderation into v_mod;
  if v_mod <> 'en_attente' then raise exception 'TEST IA 3 ÉCHEC : texte modifié sans nouvelle modération'; end if;
  bloque := false;
  begin update public.profils set competences = array(select 'Compétence ' || g from generate_series(1, 20) g) where id = a; exception when check_violation then bloque := true; end;
  if not bloque then raise exception 'TEST IA 4 ÉCHEC : 20 compétences acceptées'; end if;
end $$;
select '4 tests IA OK' as resultat;
rollback;
