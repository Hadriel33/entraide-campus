-- 0038 (26/11/2026) : la boîte à suggestions (demande de Hadriel). Un étudiant connecté envoie une idée, un bug ou
-- autre chose à l'équipe ; il revoit les siennes (et leur suite : lue, faite) ; seul l'admin les lit toutes.
-- Aucune règle RLS existante n'est modifiée : une NOUVELLE table, avec ses propres policies.
--   insert : seulement en mon nom, statut « nouvelle » (on ne s'auto-déclare pas « faite »)
--   select : mes suggestions, ou toutes pour l'admin (jamais celles des autres étudiants)
--   update : l'admin seul, et seulement la colonne statut
--   delete : personne (on garde la trace ; la suppression du compte efface les siennes par cascade)
-- Anti-spam vérifié en base : 5 suggestions par 24 h.

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  categorie text not null check (categorie in ('idee', 'bug', 'autre')),
  texte text not null check (char_length(texte) between 10 and 1000),
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'lue', 'faite')),
  cree_le timestamptz not null default now()
);
create index suggestions_date_idx on public.suggestions (cree_le desc);
create index suggestions_auteur_idx on public.suggestions (auteur_id);

alter table public.suggestions enable row level security;

create policy "suggestions_creation_par_soi" on public.suggestions for insert to authenticated
  with check ((select auth.uid()) = auteur_id and statut = 'nouvelle');
create policy "suggestions_lecture_auteur_ou_admin" on public.suggestions for select to authenticated
  using ((select auth.uid()) = auteur_id or public.est_admin());
create policy "suggestions_suivi_admin" on public.suggestions for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

revoke all on public.suggestions from anon, authenticated;
grant select, insert (categorie, texte) on public.suggestions to authenticated;
grant update (statut) on public.suggestions to authenticated;

create function public.limiter_suggestions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.est_admin() then return new; end if;
  if (select count(*) from public.suggestions where auteur_id = new.auteur_id and cree_le > now() - interval '24 hours') >= 5 then
    raise exception 'Limite atteinte : 5 suggestions par jour. Merci, on lit tout !' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
revoke execute on function public.limiter_suggestions() from public, anon, authenticated;
create trigger suggestions_limite before insert on public.suggestions for each row execute function public.limiter_suggestions();
