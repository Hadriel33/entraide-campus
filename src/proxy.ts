import type { NextRequest } from "next/server";
import { mettreAJourSession } from "@/lib/supabase/proxy";

// Next.js 16 : « proxy » remplace l'ancien « middleware ».
export async function proxy(request: NextRequest) {
  return mettreAJourSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
