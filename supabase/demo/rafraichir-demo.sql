-- Rafraîchir le campus de démo (à lancer dans l'éditeur SQL avant une séance ou la démo finale).
-- Les post-its expirent (14 à 30 jours selon la catégorie) : sans ce script, le tableau en ligne se vide
-- et le robot quotidien échoue (« plusieurs formes sur le tableau »). Seuls les comptes de démo sont touchés.
do $$
begin
  perform set_config('entraide.prolongation', 'oui', true); -- autorise le changement de date (comme prolonger_annonce)
  update public.annonces a
     set expire_le = now() + interval '30 days',
         relance_envoyee = false,
         -- étalés sur les 10 derniers jours : le fil et « Nouveau » restent crédibles
         cree_le = now() - (abs(hashtext(a.id::text)) % 240) * interval '1 hour'
   where a.auteur_id in (select id from auth.users where email like 'demo-postit-%')
     and a.statut = 'publiee';
end $$;
select categorie, count(*) as actives
from public.annonces
where statut = 'publiee' and expire_le > now()
group by categorie order by actives desc;
