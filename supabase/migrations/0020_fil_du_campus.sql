-- Le fil du campus : « @lea (ESP) a aidé @tom (ESD) ». Une entraide n'y apparaît que si LES DEUX
-- étudiants ont coché « Apparaître dans le fil du campus » (désactivé par défaut, réversible à tout moment).
-- Rien d'autre ne sort : ni message, ni coordonnées, ni titre d'annonce, seulement la catégorie.

alter table public.profils add column fil_public boolean not null default false;
grant update (fil_public) on public.profils to authenticated;

create function public.fil_campus(limite int default 20)
returns table (
  aidant_pseudo text,
  aidant_ecole text,
  aidant_avatar text,
  aidant_couleur text,
  aide_pseudo text,
  aide_ecole text,
  aide_avatar text,
  aide_couleur text,
  categorie text,
  quand timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select ai.pseudo, ai.ecole, ai.avatar_chemin, ai.colette_couleur,
         ad.pseudo, ad.ecole, ad.avatar_chemin, ad.colette_couleur,
         a.categorie, coalesce(d.repondu_le, d.cree_le)
  from public.demandes_contact d
  join public.annonces a on a.id = d.annonce_id
  -- Qui aide qui : sur une annonce « je propose », l'auteur aide ; sur « je cherche », c'est le demandeur.
  join public.profils ai on ai.id = case when a.type = 'propose' then d.destinataire_id else d.demandeur_id end
  join public.profils ad on ad.id = case when a.type = 'propose' then d.demandeur_id else d.destinataire_id end
  where d.statut = 'acceptee'
    and ai.fil_public and ad.fil_public
    and coalesce(d.repondu_le, d.cree_le) > now() - interval '60 days'
  order by coalesce(d.repondu_le, d.cree_le) desc
  limit least(greatest(limite, 1), 50);
$$;
revoke execute on function public.fil_campus(int) from public, anon;
grant execute on function public.fil_campus(int) to authenticated;
