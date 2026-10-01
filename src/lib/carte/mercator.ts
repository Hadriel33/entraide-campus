// Carte réelle sans librairie : on pose nous-mêmes les tuiles (projection Web Mercator, comme Google Maps ou OSM)
// et on place chaque point GPS en pourcentage du cadre. Fond : tuiles OpenStreetMap (attribution affichée).

export type Cadre = { nord: number; sud: number; ouest: number; est: number; zoom: number };

// Bordeaux Métropole : de Bacalan à Pessac, de Mérignac à La Bastide.
export const CADRE_BORDEAUX: Cadre = { nord: 44.888, sud: 44.79, ouest: -0.69, est: -0.51, zoom: 13 };

const TUILE = 256;

function pixel(lat: number, lng: number, zoom: number) {
  const n = TUILE * 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  return { x, y };
}

function bornes(c: Cadre) {
  const hautGauche = pixel(c.nord, c.ouest, c.zoom);
  const basDroite = pixel(c.sud, c.est, c.zoom);
  return { x0: hautGauche.x, y0: hautGauche.y, largeur: basDroite.x - hautGauche.x, hauteur: basDroite.y - hautGauche.y };
}

// Position d'un point GPS en % du cadre (0 à 100).
export function versPourcent(lat: number, lng: number, c: Cadre = CADRE_BORDEAUX) {
  const b = bornes(c);
  const p = pixel(lat, lng, c.zoom);
  return { gauche: ((p.x - b.x0) / b.largeur) * 100, haut: ((p.y - b.y0) / b.hauteur) * 100 };
}

// Les tuiles qui couvrent le cadre, chacune positionnée en % (elles débordent un peu : le cadre coupe).
export function tuiles(c: Cadre = CADRE_BORDEAUX) {
  const b = bornes(c);
  const liste: { x: number; y: number; gauche: number; haut: number; largeur: number; hauteur: number }[] = [];
  for (let tx = Math.floor(b.x0 / TUILE); tx * TUILE < b.x0 + b.largeur; tx++) {
    for (let ty = Math.floor(b.y0 / TUILE); ty * TUILE < b.y0 + b.hauteur; ty++) {
      liste.push({
        x: tx,
        y: ty,
        gauche: ((tx * TUILE - b.x0) / b.largeur) * 100,
        haut: ((ty * TUILE - b.y0) / b.hauteur) * 100,
        largeur: (TUILE / b.largeur) * 100,
        hauteur: (TUILE / b.hauteur) * 100,
      });
    }
  }
  return liste;
}

// Rapport largeur / hauteur du cadre, pour garder la carte non déformée.
export function ratio(c: Cadre = CADRE_BORDEAUX) {
  const b = bornes(c);
  return b.largeur / b.hauteur;
}

// Coordonnées GPS des quartiers proposés dans les annonces.
export const GPS_QUARTIERS = {
  victor_hugo: [44.8333, -0.5736], // campus ESD / ESP, place de la Ferme de Richemont
  centre: [44.8412, -0.5745],
  chartrons: [44.8545, -0.5705],
  saint_michel: [44.8318, -0.5655],
  saint_jean: [44.8259, -0.5563],
  bastide: [44.8445, -0.5542],
  bacalan: [44.8695, -0.5565],
  cauderan: [44.8478, -0.6115],
  talence_pessac: [44.8035, -0.5985],
  merignac: [44.8392, -0.6455],
  begles: [44.8075, -0.5485],
} as const;
