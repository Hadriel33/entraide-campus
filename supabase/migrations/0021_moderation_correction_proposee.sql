-- IA n°2, version 2 : quand une annonce est « à vérifier » mais réparable, l'IA propose une version corrigée
-- à son auteur. Comme le reste de la modération, cette proposition n'est écrite que par le serveur ou un admin ;
-- l'auteur l'applique (ou non) en modifiant son annonce, ce qui relance la modération.

alter table public.annonces
  add column moderation_suggestion jsonb
  check (
    moderation_suggestion is null
    or (
      jsonb_typeof(moderation_suggestion) = 'object'
      and char_length(moderation_suggestion->>'titre') between 5 and 80
      and char_length(moderation_suggestion->>'description') between 20 and 1000
    )
  );

grant update (moderation_suggestion) on public.annonces to authenticated;

-- Même garde qu'en 0008, la proposition en plus : protégée, et effacée dès que le texte change.
create or replace function public.annonces_garde_ia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role' or public.est_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.moderation := 'en_attente';
    new.moderation_raisons := '{}';
    new.moderation_suggestion := null;
    new.modere_le := null;
    return new;
  end if;
  if (new.moderation, new.moderation_raisons, new.modere_le, new.moderation_suggestion)
     is distinct from (old.moderation, old.moderation_raisons, old.modere_le, old.moderation_suggestion) then
    raise exception 'Seule la modération peut changer ce statut' using errcode = '42501';
  end if;
  if (new.titre, new.description, new.lieu) is distinct from (old.titre, old.description, old.lieu) then
    new.moderation := 'en_attente';
    new.moderation_raisons := '{}';
    new.moderation_suggestion := null;
    new.modere_le := null;
  end if;
  return new;
end;
$$;
