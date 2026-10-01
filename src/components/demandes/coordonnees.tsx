export type Coordonnees = { telephone: string | null; email: string | null; reseau: string | null };

function telephoneLisible(t: string) {
  return t.startsWith("+33") ? `+33 ${t.slice(3).replace(/(\d)(?=(\d{2})+$)/g, "$1 ")}` : t.replace(/(\d{2})(?=\d)/g, "$1 ");
}

// Affichée UNIQUEMENT quand la base a renvoyé les coordonnées (accord donné). Sinon, rien ne transite.
export function BlocCoordonnees({ c, prenom }: { c: Coordonnees | null; prenom: string }) {
  if (!c || (!c.telephone && !c.email && !c.reseau)) {
    return <p className="text-sm text-encre-douce">{prenom} n&apos;a pas encore renseigné de coordonnées.</p>;
  }
  return (
    <dl className="pop grid gap-1 rounded-ui bg-ok-fond p-3 text-sm">
      <dt className="sr-only">Coordonnées de {prenom}</dt>
      {c.telephone && (
        <dd>
          Téléphone :{" "}
          <a className="font-semibold underline-offset-2 hover:underline" href={`tel:${c.telephone}`}>
            {telephoneLisible(c.telephone)}
          </a>
        </dd>
      )}
      {c.email && (
        <dd>
          Email :{" "}
          <a className="font-semibold underline-offset-2 hover:underline" href={`mailto:${c.email}`}>
            {c.email}
          </a>
        </dd>
      )}
      {c.reseau && (
        <dd>
          Réseau : <span className="font-semibold">{c.reseau}</span>
        </dd>
      )}
    </dl>
  );
}
