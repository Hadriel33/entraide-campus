-- Quartiers des 6 campus (26/10/2026). Le bloc finit TOUJOURS par une erreur volontaire : rien n'est gardé.
-- Attendu : « OK : 3 tests quartiers réussis ».
do $test$
declare
  v_auteur uuid := (select id from public.profils where role = 'admin' limit 1);
begin
  -- 1. Un quartier de Lyon est accepté.
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier)
    values (v_auteur, 'propose', 'coloc', 'Test 0026 coloc Lyon', 'Une chambre libre à deux pas de Bellecour.', 'a_discuter', 'lyon_bellecour');
  -- 2. Bordeaux et « Ailleurs » marchent toujours.
  insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier)
    values (v_auteur, 'propose', 'coloc', 'Test 0026 coloc Bordeaux', 'Une chambre libre à deux pas de la gare.', 'a_discuter', 'saint_jean');
  -- 3. Un quartier inventé est refusé.
  begin
    insert into public.annonces (auteur_id, type, categorie, titre, description, contrepartie, quartier)
      values (v_auteur, 'propose', 'coloc', 'Test 0026 pirate', 'Un quartier qui n''existe pas du tout.', 'a_discuter', 'mars_olympus');
    raise exception 'ÉCHEC 3 : quartier inventé accepté';
  exception when others then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  raise exception 'OK : 3 tests quartiers réussis (erreur volontaire : rien n''est gardé en base)';
end $test$;
