export function Champ({
  label,
  name,
  type = "text",
  erreur,
  defaultValue,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  erreur?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={!!erreur}
        className="rounded-ui border border-ligne bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-encre aria-[invalid=true]:border-alerte"
      />
      {erreur && <span className="text-sm font-normal text-alerte">{erreur}</span>}
    </label>
  );
}
