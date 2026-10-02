-- ============================================================================
-- LE COMPTE ROBOT des parcours de bout en bout (à lancer par Hadriel dans Supabase › SQL Editor).
-- Un étudiant « robot » qui se connecte chaque matin et après chaque déploiement pour vérifier l'appli.
-- Il ne publie rien. Choisis un mot de passe long, remplace CHANGE-MOI ci-dessous (2 fois : le même),
-- puis mets-le dans GitHub : Settings › Secrets and variables › Actions › New repository secret :
--   E2E_EMAIL    = e2e-robot@mail-esd.com
--   E2E_PASSWORD = (ton mot de passe)
-- Le mot de passe n'est écrit nulle part dans le dépôt. Pour supprimer le robot :
--   delete from auth.users where email = 'e2e-robot@mail-esd.com';
-- ============================================================================
do $robot$
declare
  v_id uuid := gen_random_uuid();
  v_mdp text := 'CHANGE-MOI';
begin
  if v_mdp = 'CHANGE-MOI' or length(v_mdp) < 12 then
    raise exception 'Remplace CHANGE-MOI par un vrai mot de passe (12 caractères minimum)';
  end if;
  delete from auth.users where email = 'e2e-robot@mail-esd.com';

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e2e-robot@mail-esd.com',
    extensions.crypt(v_mdp, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"prenom":"Robot","pseudo":"robot.tests"}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text, 'email', json_build_object('sub', v_id::text, 'email', 'e2e-robot@mail-esd.com', 'email_verified', true)::jsonb, now(), now(), now());

  -- Un profil complet, discret : quelques compétences pour que « Pour moi » ait de quoi classer, hors du fil du campus.
  update public.profils set competences = array['Python', 'Figma', 'Photographie'], fil_public = false, bio = 'Compte de test automatique.'
  where id = v_id;
end $robot$;

select pseudo, ecole, competences from public.profils where pseudo = 'robot.tests';
