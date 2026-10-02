// Crée le compte robot des parcours Playwright, en UNE commande lancée par Hadriel : npm run robot
// 1. demande un mot de passe (affiché en étoiles, jamais écrit sur le disque) ;
// 2. inscrit le robot sur l'appli, comme un étudiant (e2e-robot@mail-esd.com, pseudo robot.tests) ;
// 3. range l'email et le mot de passe dans les secrets GitHub du dépôt (gh secret set) ;
// 4. lance le parcours sur GitHub.
// Seules les valeurs PUBLIQUES de Supabase sont utilisées (les mêmes que dans le navigateur).
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";

const URL_SUPABASE = "https://oobnrocwpyyeaadbhweu.supabase.co";
const CLE_PUBLIQUE = "sb_publishable_pBc7zqK42NB4V8obmVevtQ_YAbmensn";
const EMAIL = "e2e-robot@mail-esd.com";

const ENTREE = ["\r", "\n"];
const CTRL_C = "\u0003";
const EFFACER = ["\u0008", "\u007f"];

// Saisie masquée : une étoile par caractère, Retour arrière pour corriger, Ctrl+C pour quitter.
function demanderEnSilence(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const entree = process.stdin;
    let saisie = "";
    entree.setRawMode(true);
    entree.resume();
    entree.setEncoding("utf8");
    const surTouche = (touches) => {
      for (const c of touches) {
        if (ENTREE.includes(c)) {
          entree.setRawMode(false);
          entree.pause();
          entree.off("data", surTouche);
          process.stdout.write("\n");
          resolve(saisie);
          return;
        }
        if (c === CTRL_C) {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (EFFACER.includes(c)) {
          if (saisie.length) {
            saisie = saisie.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          saisie += c;
          process.stdout.write("*");
        }
      }
    };
    entree.on("data", surTouche);
  });
}

const mdp = await demanderEnSilence("Mot de passe du robot (12 caractères minimum) : ");
if (mdp.length < 12) {
  console.error("Trop court : 12 caractères minimum. Relance : npm run robot");
  process.exit(1);
}
const confirmation = await demanderEnSilence("Retape-le : ");
if (confirmation !== mdp) {
  console.error("Les deux saisies ne correspondent pas. Relance : npm run robot");
  process.exit(1);
}

// 1. Inscription (ou connexion si le robot existe déjà).
const supabase = createClient(URL_SUPABASE, CLE_PUBLIQUE, { auth: { persistSession: false } });
const { error: errInscription } = await supabase.auth.signUp({
  email: EMAIL,
  password: mdp,
  options: { data: { prenom: "Robot", pseudo: "robot.tests" } },
});
if (errInscription && !/already/i.test(errInscription.message)) {
  console.error("Inscription refusée :", errInscription.message);
  process.exit(1);
}
const { error: errConnexion } = await supabase.auth.signInWithPassword({ email: EMAIL, password: mdp });
if (errConnexion) {
  console.error("Le robot ne peut pas se connecter :", errConnexion.message);
  console.error("(S'il existait déjà avec un autre mot de passe : supprime-le dans Supabase › Authentication, puis relance.)");
  process.exit(1);
}
console.log("Compte robot prêt :", EMAIL);

// 2. Secrets GitHub (la valeur passe par l'entrée standard, jamais dans la ligne de commande).
execFileSync("gh", ["secret", "set", "E2E_EMAIL"], { input: EMAIL, stdio: ["pipe", "inherit", "inherit"] });
execFileSync("gh", ["secret", "set", "E2E_PASSWORD"], { input: mdp, stdio: ["pipe", "inherit", "inherit"] });
console.log("Secrets GitHub enregistrés : E2E_EMAIL, E2E_PASSWORD.");

// 3. Premier parcours.
execFileSync("gh", ["workflow", "run", "parcours.yml"], { stdio: "inherit" });
console.log("Parcours lancé : https://github.com/Hadriel33/entraide-campus/actions/workflows/parcours.yml");
