/* Serveur de l'enquête (Node.js 18 ou plus, sans dépendance).
   - sert le formulaire et la page des résultats ;
   - enregistre chaque réponse dans la base du dossier data/ :
       data/reponses.json  (référence)
       data/reponses.csv   (régénéré à chaque réponse)
       data/reponses.xlsx  (régénéré à chaque réponse : Réponses, Synthèse, Dictionnaire)
   - ne renvoie les résultats que sur présentation du code d'accès (CODE_ACCES, fichier .env).
   Lancement : node serveur.js */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");

const RACINE = __dirname;
const DATA = path.join(RACINE, "data");

// Lecture du fichier .env (CLE=valeur), sans écraser l'environnement existant.
try {
  fs.readFileSync(path.join(RACINE, ".env"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  });
} catch (e) { /* pas de .env */ }

const CODE = process.env.CODE_ACCES || "";
const PORT = Number(process.env.PORT) || 8080;
if (!CODE) console.warn("Attention : CODE_ACCES n'est pas défini, la page des résultats refusera tout accès.");

// Chargement du questionnaire et des fonctions de mise en forme, partagés avec le navigateur.
const ctx = vm.createContext({ window: {}, TextEncoder });
["questions.js", "xlsx-mini.js", "donnees.js"].forEach((f) => vm.runInContext(fs.readFileSync(path.join(RACINE, f), "utf8"), ctx, { filename: f }));
const D = ctx.window.Donnees, X = ctx.window.XlsxMini;
const CLES = new Set(D.COLONNES.map((c) => c.cle));

/* ---------- Base de données (fichiers du dossier data/) ---------- */
const F = { json: path.join(DATA, "reponses.json"), csv: path.join(DATA, "reponses.csv"), xlsx: path.join(DATA, "reponses.xlsx") };
fs.mkdirSync(DATA, { recursive: true });
let reponses = [];
try { reponses = JSON.parse(fs.readFileSync(F.json, "utf8")); } catch (e) { reponses = []; }
if (!Array.isArray(reponses)) throw new Error("data/reponses.json est illisible : corrigez ou déplacez ce fichier avant de relancer.");

function ecrireFichier(fichier, contenu) {       // écriture atomique : fichier temporaire puis renommage
  const tmp = fichier + ".tmp";
  fs.writeFileSync(tmp, contenu);
  fs.renameSync(tmp, fichier);
}
function ecrireBase() {
  ecrireFichier(F.json, JSON.stringify(reponses, null, 2));
  ecrireFichier(F.csv, D.csv(D.tableBrute(reponses)));
  ecrireFichier(F.xlsx, Buffer.from(X.bytes(D.feuilles(reponses))));
}
ecrireBase();

function nettoyer(d) {                           // ne garde que les colonnes connues, en texte borné
  const r = {};
  Object.keys(d).forEach((k) => { if (CLES.has(k) && k !== "date") r[k] = String(d[k]).slice(0, 2000); });
  r.date = new Date().toISOString().slice(0, 10);
  return r;
}

/* ---------- Contrôle du code d'accès ---------- */
const essais = new Map();                        // adresse -> { n, debut }
const MAX_ESSAIS = 5, FENETRE = 15 * 60 * 1000;
function bloque(ip) {
  const e = essais.get(ip);
  if (e && Date.now() - e.debut > FENETRE) { essais.delete(ip); return false; }
  return !!e && e.n >= MAX_ESSAIS;
}
function echec(ip) {
  const e = essais.get(ip) || { n: 0, debut: Date.now() };
  e.n++; essais.set(ip, e);
}
function codeValide(saisi) {
  if (!CODE || typeof saisi !== "string") return false;
  const a = crypto.createHash("sha256").update(saisi).digest(), b = crypto.createHash("sha256").update(CODE).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ---------- Fichiers servis (liste fermée : data/, .env et serveur.js ne sont jamais servis) ---------- */
const PUBLICS = new Set(["index.html", "resultats.html", "config.js", "theme.css", "styles.css", "resultats.css",
  "questions.js", "app.js", "resultats.js", "xlsx-mini.js", "donnees.js"]);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon" };

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  const chemin = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");

  if (chemin === "api") {
    if (req.method !== "POST") return json(res, 405, { ok: false });
    let corps = "";
    req.on("data", (d) => { corps += d; if (corps.length > 200000) req.destroy(); });
    req.on("end", () => {
      let d;
      try { d = JSON.parse(corps); } catch (e) { return json(res, 400, { ok: false }); }
      if (!d || typeof d !== "object" || Array.isArray(d)) return json(res, 400, { ok: false });

      if (d.action === "resultats") {
        const ip = req.socket.remoteAddress || "";
        if (bloque(ip)) return json(res, 429, { ok: false, erreur: "blocage" });
        if (!codeValide(d.code)) { echec(ip); return json(res, 403, { ok: false }); }
        essais.delete(ip);
        return json(res, 200, { ok: true, reponses });
      }

      const r = nettoyer(d);
      if (!r.nom || !r.nom.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.email || "")) return json(res, 400, { ok: false });
      reponses.push(r);
      try { ecrireBase(); } catch (e) { reponses.pop(); console.error(e); return json(res, 500, { ok: false }); }
      json(res, 200, { ok: true });
    });
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
  const nom = chemin === "" ? "index.html" : chemin;
  let fichier = null;
  if (PUBLICS.has(nom)) fichier = path.join(RACINE, nom);
  else if (/^assets\/[A-Za-z0-9._-]+$/.test(nom)) fichier = path.join(RACINE, nom);
  if (!fichier) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Introuvable"); }
  fs.readFile(fichier, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Introuvable"); }
    const type = TYPES[path.extname(fichier)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": /^text|javascript/.test(type) ? type + "; charset=utf-8" : type });
    res.end(req.method === "HEAD" ? undefined : data);
  });
}).listen(PORT, () => console.log("Enquête SI : http://localhost:" + PORT + "  (" + reponses.length + " réponse(s) dans data/)"));
