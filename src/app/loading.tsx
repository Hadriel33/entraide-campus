// Écran de chargement : un squelette calme plutôt qu'une page blanche.
export default function Chargement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-6" aria-busy="true" aria-label="Chargement">
      <div className="h-10 w-72 rounded-ui bg-bandeau/60" />
      <div className="h-5 w-96 max-w-full rounded-ui bg-papier-fonce" />
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-40 rounded-carte border border-ligne bg-surface" />
        ))}
      </div>
    </div>
  );
}
