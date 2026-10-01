import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PAGES_PROTEGEES = ["/compte", "/annonces", "/mes-annonces", "/demandes", "/classement", "/profils", "/admin", "/notifications", "/favoris", "/bienvenue", "/mur", "/bureau", "/carte"];

// Rafraîchit la session Supabase à chaque requête et redirige vers /connexion
// si une page protégée est demandée sans être connecté (vérification optimiste :
// chaque page revérifie l'utilisateur côté serveur).
export async function mettreAJourSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;
  if (!user && PAGES_PROTEGEES.some((p) => chemin === p || chemin.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
