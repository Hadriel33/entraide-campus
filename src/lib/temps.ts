// « il y a 5 min », « il y a 3 h », « il y a 2 j » (calcul hors des composants : règle de pureté React).
export function ilYa(iso: string, maintenant = new Date()) {
  const min = Math.round((maintenant.getTime() - Date.parse(iso)) / 60000);
  if (min < 60) return `il y a ${Math.max(min, 1)} min`;
  if (min < 1440) return `il y a ${Math.round(min / 60)} h`;
  return `il y a ${Math.round(min / 1440)} j`;
}
