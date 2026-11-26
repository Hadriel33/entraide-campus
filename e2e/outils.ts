import { expect, test, type Page } from "@playwright/test";

// Erreurs JavaScript de la page (un composant qui plante) : on les collecte pour échouer franchement.
export function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  // Chaque erreur porte la page affichée à ce moment-là : une erreur tardive se range sur la bonne page.
  const ou = () => new URL(page.url()).pathname;
  page.on("pageerror", (e) => erreurs.push(`${e.message} (sur ${ou()})`));
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      !/favicon|Failed to load resource|tile\.openstreetmap/i.test(m.text())
    )
      erreurs.push(`${m.text()} (sur ${ou()})`);
  });
  return erreurs;
}

// Rien ne dépasse à droite (pas de défilement horizontal, surtout sur téléphone).
export async function pasDeDebordement(page: Page) {
  const { large, vue } = await page.evaluate(() => ({
    large: document.documentElement.scrollWidth,
    vue: window.innerWidth,
  }));
  expect(large, "la page déborde horizontalement").toBeLessThanOrEqual(vue + 1);
}

// Écart d'hydratation (React #418) : on joint au rapport le HTML envoyé par le serveur et la page finale du
// navigateur, pour trouver à coup sûr l'élément qui diffère (l'erreur minifiée ne le dit pas).
export async function joindreSiHydratation(page: Page, chemin: string, erreurs: string[], htmlRecu?: string) {
  if (!erreurs.some((e) => e.includes("#418"))) return;
  // La page EXACTE reçue par le navigateur (pas une seconde requête) et le début du document tel que le navigateur
  // l'a construit, noté au DOMContentLoaded, avant que React ne reprenne la page (voir espionHydratation).
  if (htmlRecu) await test.info().attach(`html-recu-navigateur${chemin.replace(/\W+/g, "-")}.html`, { body: htmlRecu, contentType: "text/plain" });
  const initial = await page.evaluate(() => (window as unknown as { __domInitial?: string }).__domInitial ?? "");
  if (initial) await test.info().attach(`dom-avant-react${chemin.replace(/\W+/g, "-")}.html`, { body: initial, contentType: "text/plain" });
  const serveur = await (await page.request.get(chemin)).text();
  const nom = chemin.replace(/\W+/g, "-");
  await test.info().attach(`html-serveur${nom}.html`, { body: serveur, contentType: "text/plain" });
  await test.info().attach(`dom-navigateur${nom}.html`, { body: await page.content(), contentType: "text/plain" });
}

// Espion d'hydratation (26/11) : l'erreur React #418 minifiée ne dit pas QUEL élément diffère, et la page finale
// ressemble au HTML du serveur (React a tout redessiné). On pose un point d'arrêt (protocole Chrome) dans la
// fonction de React qui lève l'erreur : elle reçoit l'élément attendu (fiber). On note sa lignée (balises,
// classes, texte) et le nœud réellement trouvé dans la page à cet endroit. Lecture seule, rien n'est modifié.
export async function espionHydratation(page: Page) {
  const notes: string[] = [];
  let cdp;
  try {
    cdp = await page.context().newCDPSession(page);
  } catch {
    return notes; // navigateur sans protocole Chrome : pas d'espion
  }
  const nosPoints = new Set<string>();
  // Le début du document au DOMContentLoaded : où se trouvent <meta charset>, <head> et le début de <body>.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const html = document.documentElement.outerHTML;
      const corps = html.indexOf("<body");
      (window as unknown as { __domInitial?: string }).__domInitial = html.slice(0, 3000) + "\n...\n" + html.slice(Math.max(0, corps - 200), corps + 2000);
    });
  });
  await cdp.send("Debugger.enable");
  cdp.on("Debugger.scriptParsed", async ({ scriptId, url }) => {
    if (!/\/_next\/static\/.*\.js/.test(url)) return;
    try {
      const { scriptSource } = await cdp.send("Debugger.getScriptSource", { scriptId });
      const m = /function (\w+)\((\w+)\)\{var \w+=Error\(\w+\(418,/.exec(scriptSource);
      if (!m) return;
      const curseur = /var (\w+)=null,(\w+)=null,(\w+)=!1,(\w+)=null,(\w+)=!1,\w+=Error\(\w+\(519\)\)/.exec(scriptSource);
      const index = m.index + m[0].indexOf("{") + 1;
      const avant = scriptSource.slice(0, index);
      const lineNumber = avant.split("\n").length - 1;
      const columnNumber = index - (avant.lastIndexOf("\n") + 1);
      const { breakpointId } = await cdp.send("Debugger.setBreakpoint", { location: { scriptId, lineNumber, columnNumber } });
      nosPoints.add(breakpointId);
      (cdp as unknown as { _fiber: string; _suivant: string })._fiber = m[2];
      (cdp as unknown as { _fiber: string; _suivant: string })._suivant = curseur?.[2] ?? "null";
    } catch {}
  });
  cdp.on("Debugger.paused", async ({ callFrames, hitBreakpoints }) => {
    try {
      if ((hitBreakpoints ?? []).some((b: string) => nosPoints.has(b))) {
        const { _fiber: F, _suivant: N } = cdp as unknown as { _fiber: string; _suivant: string };
        const expression = `(() => {
          const d = (f) => { const p = f.pendingProps || {}; const t = typeof f.type === "string" ? f.type : (f.type && (f.type.displayName || f.type.name)) || "tag" + f.tag;
            return t + (typeof p.className === "string" ? "." + p.className.slice(0, 60).replace(/ /g, ".") : "") + (typeof p.children === "string" ? " «" + p.children.slice(0, 60) + "»" : typeof p === "string" ? " «" + p.slice(0, 60) + "»" : ""); };
          const lignee = []; let x = ${F}; for (let i = 0; i < 14 && x; i++) { lignee.push(d(x)); x = x.return; }
          const n = ${N};
          const trouve = !n ? "rien" : n.nodeType === 1 ? n.outerHTML.slice(0, 400) : n.nodeType === 3 ? "TEXTE «" + n.textContent.slice(0, 120) + "»" : n.nodeType === 8 ? "COMMENTAIRE «" + n.textContent + "»" : "nœud " + n.nodeType;
          return "attendu : " + lignee.join("  <  ") + "\\ntrouvé dans la page : " + trouve;
        })()`;
        const r = await cdp.send("Debugger.evaluateOnCallFrame", { callFrameId: callFrames[0].callFrameId, expression, returnByValue: true });
        notes.push(`${new URL(page.url()).pathname} : ${r.result?.value ?? r.exceptionDetails?.text ?? "?"}`);
      }
    } catch (e) {
      notes.push(`espion : ${String(e)}`);
    } finally {
      await cdp.send("Debugger.resume").catch(() => {});
    }
  });
  return notes;
}
