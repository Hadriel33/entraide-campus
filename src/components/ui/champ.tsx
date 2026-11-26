import { SAISIE } from "./saisie";

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
        className={SAISIE}
      />
      {erreur ? (
        <span className="text-sm font-normal text-alerte">{erreur}</span>
      ) : (
        aide && <span className="text-xs font-normal text-encre-douce">{aide}</span>
      )}
    </label>
  );
}
