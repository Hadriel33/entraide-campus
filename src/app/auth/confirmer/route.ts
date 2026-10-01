import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Lien de confirmation d'email. Redirige toujours vers un chemin interne fixe (pas d'open redirect).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  // Destination choisie dans une liste fermée (jamais une URL reçue en paramètre : pas d'open redirect).
  const suite = searchParams.get("suite") === "mot-de-passe" ? "/compte/mot-de-passe" : "/bienvenue";
  return NextResponse.redirect(new URL(ok ? suite : "/connexion?lien=invalide", origin));
}
