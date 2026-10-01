import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { TitrePage } from "@/components/ui/titre-page";
import { MarqueurLu } from "./marqueur";

export const metadata: Metadata = { title: "Notifications" };

type Notification = { id: string; type: string; texte: string; lien: string; lu: boolean; cree_le: string };

function quand(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 60 * 24) return `il y a ${Math.round(minutes / 60)} h`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}

export default async function PageNotifications() {
  const { supabase, user } = await exigerSession();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, texte, lien, lu, cree_le")
    .eq("destinataire_id", user.id)
    .order("cree_le", { ascending: false })
    .limit(50);
  const notifications = (data ?? []) as Notification[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <MarqueurLu actif={notifications.some((n) => !n.lu)} />
      <TitrePage accroche="Demandes, réponses, messages et avis : tout ce qui te concerne.">Notifications</TitrePage>
      {notifications.length ? (
        <ol className="flex flex-col gap-2">
          {notifications.map((n, i) => (
            <li key={n.id} className="apparition" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={n.lien}
                className={`souleve flex items-start justify-between gap-3 rounded-carte border p-4 ${n.lu ? "border-ligne bg-surface" : "border-encre bg-offre"}`}
              >
                <span className="flex items-start gap-2.5">
                  {!n.lu && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-label="Non lue" />}
                  <span>{n.texte}</span>
                </span>
                <span className="shrink-0 text-xs text-encre-douce">{quand(n.cree_le)}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-carte border border-dashed border-ligne-forte p-6 text-sm text-encre-douce">
          Rien pour l&apos;instant. Tu seras prévenu ici dès qu&apos;on te répond.
        </p>
      )}
    </div>
  );
}
