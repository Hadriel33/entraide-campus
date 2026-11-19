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
-- Suivi des entraides (0034) : les échanges acceptés avec un compte de démo reçoivent une étape, pour que
-- Colette livreuse et l'Historique de « Mes échanges » ne soient pas vides le jour de la démo. Un suivi déjà
-- commencé (vrai ou de démo) n'est jamais écrasé ; environ 1 échange sur 6 reste « pas encore commencé ».
insert into public.suivis_entraide (demande_id, etape, mot, maj_le)
select d.id, x.etape, x.mot, now() - (abs(hashtext(d.id::text)) % 72) * interval '1 hour'
from public.demandes_contact d
cross join lateral (
  select (array[null, 'parti', 'en_cours', 'presque', 'livre', 'recu'])[1 + abs(hashtext(d.id::text || 'suivi')) % 6] as etape
) e
cross join lateral (
  select e.etape,
         case e.etape
           when 'parti' then 'on cale un créneau cette semaine'
           when 'en_cours' then 'je m''y mets ce soir'
           when 'presque' then 'dernière retouche et je t''envoie tout'
           when 'livre' then 'c''est dans ta boîte, dis-moi si ça te va'
           when 'recu' then 'merci, nickel'
         end as mot
) x
where d.statut = 'acceptee'
  and x.etape is not null
  and (d.demandeur_id in (select id from auth.users where email like 'demo-postit-%')
       or d.destinataire_id in (select id from auth.users where email like 'demo-postit-%'))
on conflict (demande_id) do nothing;

select etape, count(*) as echanges from public.suivis_entraide group by etape order by etape;

select categorie, count(*) as actives
from public.annonces
where statut = 'publiee' and expire_le > now()
group by categorie order by actives desc;
