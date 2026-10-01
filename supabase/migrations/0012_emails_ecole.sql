-- Appli réservée aux étudiants : seuls les emails @mail-esd.com et @mail-esp.com peuvent s'inscrire,
-- et l'école est DÉDUITE du domaine (on ne la demande plus, donc on ne peut plus mentir dessus).
-- Imposé en base : même un appel direct à l'API d'inscription est refusé.

create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ecole text := case lower(split_part(new.email, '@', 2))
    when 'mail-esd.com' then 'ESD'
    when 'mail-esp.com' then 'ESP'
  end;
begin
  if v_ecole is null then
    raise exception 'Inscription réservée aux emails @mail-esd.com et @mail-esp.com' using errcode = '42501';
  end if;
  insert into public.profils (id, prenom, ecole, pseudo)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'prenom'),
    v_ecole,
    lower(btrim(new.raw_user_meta_data ->> 'pseudo'))
  );
  insert into public.coordonnees (id, email) values (new.id, new.email);
  return new;
end;
$$;

revoke execute on function public.creer_profil() from public, anon, authenticated;

-- Un changement d'email vers une adresse extérieure est aussi refusé.
create function public.garder_email_ecole()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email
     and lower(split_part(new.email, '@', 2)) not in ('mail-esd.com', 'mail-esp.com') then
    raise exception 'Email de l''école obligatoire' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.garder_email_ecole() from public, anon, authenticated;

create trigger a_la_modification_garder_email_ecole
  before update of email on auth.users
  for each row execute function public.garder_email_ecole();
