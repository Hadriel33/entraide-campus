export function Champ({
  label,
  name,
  type = "text",
  erreur,
  aide,
  defaultValue,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  erreur?: string;
  aide?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={!!erreur}
        className="min-h-10 rounded-ui border border-ligne-forte bg-surface px-3 py-2 text-base font-normal outline-none focus:border-encre focus:ring-3 focus:ring-accent/20 aria-[invalid=true]:border-alerte"
      />
      {erreur ? (
        <span className="text-sm font-normal text-alerte">{erreur}</span>
      ) : (
        aide && <span className="text-xs font-normal text-encre-douce">{aide}</span>
      )}
    </label>
  );
}
