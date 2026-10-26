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

// Coordonnées GPS des quartiers de Bordeaux proposés dans les annonces.
export const GPS_QUARTIERS = {
  victor_hugo: [44.8333, -0.5736], // campus ESP Bordeaux, place de la Ferme de Richemont
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

// ============ Une carte par campus ESP (retour du prof, 22/10) ============
// Points au niveau du quartier (pas d'adresse précise). Campus : Paris 9 rue Henri Bocquillon (15e),
// Lyon quartier Jean Jaurès (7e), Bordeaux place de la Ferme de Richemont, Toulouse la Cartoucherie,
// Nantes rue Fulton, Lille avenue de la République (sources : espub.org, consulté le 26/10/2026).
type Point = readonly [number, number];
export type CarteCampus = { cadre: Cadre; campus: string; quartiers: Record<string, Point> };

export const CARTES = {
  Paris: {
    cadre: { nord: 48.905, sud: 48.815, ouest: 2.24, est: 2.42, zoom: 13 },
    campus: "paris_campus",
    quartiers: {
      paris_campus: [48.8399, 2.2951],
      paris_montparnasse: [48.8421, 2.3219],
      paris_quartier_latin: [48.8493, 2.347],
      paris_marais: [48.859, 2.3622],
      paris_bastille: [48.8532, 2.3692],
      paris_republique: [48.8675, 2.3637],
      paris_montmartre: [48.8867, 2.3431],
      paris_batignolles: [48.8862, 2.3204],
      paris_belleville: [48.8721, 2.3767],
      paris_gare_de_lyon: [48.8443, 2.3743],
      paris_issy_boulogne: [48.83, 2.258],
    },
  },
  Lyon: {
    cadre: { nord: 45.79, sud: 45.71, ouest: 4.77, est: 4.92, zoom: 13 },
    campus: "lyon_campus",
    quartiers: {
      lyon_campus: [45.7445, 4.8405],
      lyon_bellecour: [45.7578, 4.832],
      lyon_part_dieu: [45.7606, 4.859],
      lyon_croix_rousse: [45.7744, 4.832],
      lyon_vieux_lyon: [45.7622, 4.827],
      lyon_confluence: [45.743, 4.817],
      lyon_guillotiere: [45.753, 4.843],
      lyon_villeurbanne: [45.767, 4.88],
      lyon_gerland: [45.729, 4.832],
      lyon_monplaisir: [45.744, 4.871],
    },
  },
  Bordeaux: {
    cadre: CADRE_BORDEAUX,
    campus: "victor_hugo",
    quartiers: GPS_QUARTIERS,
  },
  Toulouse: {
    cadre: { nord: 43.645, sud: 43.56, ouest: 1.36, est: 1.52, zoom: 13 },
    campus: "toulouse_campus",
    quartiers: {
      toulouse_campus: [43.6045, 1.4125],
      toulouse_capitole: [43.6045, 1.444],
      toulouse_carmes: [43.597, 1.447],
      toulouse_saint_cyprien: [43.598, 1.429],
      toulouse_compans: [43.611, 1.434],
      toulouse_minimes: [43.623, 1.435],
      toulouse_matabiau: [43.611, 1.454],
      toulouse_rangueil: [43.57, 1.465],
      toulouse_purpan: [43.608, 1.398],
      toulouse_saint_agne: [43.58, 1.45],
    },
  },
  Nantes: {
    cadre: { nord: 47.255, sud: 47.17, ouest: -1.64, est: -1.48, zoom: 13 },
    campus: "nantes_campus",
    quartiers: {
      nantes_campus: [47.216, -1.577],
      nantes_centre: [47.2148, -1.553],
      nantes_graslin: [47.2132, -1.5625],
      nantes_ile_de_nantes: [47.206, -1.556],
      nantes_chantenay: [47.201, -1.592],
      nantes_gare: [47.2175, -1.542],
      nantes_erdre: [47.23, -1.552],
      nantes_reze: [47.185, -1.549],
      nantes_doulon: [47.226, -1.52],
      nantes_saint_herblain: [47.218, -1.62],
    },
  },
  Lille: {
    cadre: { nord: 50.68, sud: 50.6, ouest: 2.98, est: 3.16, zoom: 13 },
    campus: "lille_campus",
    quartiers: {
      lille_campus: [50.647, 3.079],
      lille_vieux_lille: [50.643, 3.062],
      lille_centre: [50.6365, 3.0632],
      lille_wazemmes: [50.628, 3.048],
      lille_euralille: [50.638, 3.075],
      lille_moulins: [50.623, 3.07],
      lille_vauban: [50.634, 3.043],
      lille_villeneuve_ascq: [50.609, 3.143],
      lille_marcq: [50.665, 3.096],
      lille_lambersart: [50.65, 3.025],
    },
  },
} as const satisfies Record<string, CarteCampus>;

export type CampusCarte = keyof typeof CARTES;

// Les quartiers d'un campus (dans l'ordre : le campus d'abord).
export function quartiersDu(campus: string): string[] {
  const carte = CARTES[campus as CampusCarte];
  return carte ? Object.keys(carte.quartiers) : [];
}

// Le campus d'un quartier (pour ranger une annonce sur la bonne carte).
export function campusDuQuartier(quartier: string): CampusCarte | null {
  for (const [campus, carte] of Object.entries(CARTES)) if (quartier in carte.quartiers) return campus as CampusCarte;
  return null;
}

// Point GPS d'un quartier, quel que soit son campus.
export function pointDuQuartier(quartier: string): Point | null {
  for (const carte of Object.values(CARTES)) {
    const p = (carte.quartiers as Record<string, Point>)[quartier];
    if (p) return p;
  }
  return null;
}
