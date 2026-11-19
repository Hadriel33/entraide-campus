import type { Metadata } from "next";
import { AssistantRedaction } from "@/components/annonces/assistant-redaction";
import { TitrePage } from "@/components/ui/titre-page";
import { creerAnnonce } from "../actions";
import { TYPES } from "@/lib/annonces/validation";
import { exigerSession } from "@/lib/session";

export const metadata: Metadata = { title: "Publier un post-it" };

export default async function PageNouvelleAnnonce({ searchParams }: PageProps<"/annonces/nouvelle">) {
  const brut = await searchParams;
  const { profil } = await exigerSession();
  const initial: Record<string, string> = {};
  if (typeof brut.type === "string" && brut.type in TYPES) initial.type = brut.type;
  if (typeof brut.titre === "string") initial.titre = brut.titre.slice(0, 80);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <TitrePage accroche="Ce que tu sais faire, ou ce dont tu as besoin. Ton post-it est visible par les étudiants connectés.">
        Publier un post-it
      </TitrePage>
      <AssistantRedaction action={creerAnnonce} initial={initial} campus={profil.campus} />
    </div>
  );
}
