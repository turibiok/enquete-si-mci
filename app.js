/* Moteur du questionnaire : affichage par étapes, contrôles, brouillon local, envoi. */
(function () {
  "use strict";
  var S = window.SURVEY, C = window.CONFIG || {};
  var CLE = "enquete-si-mci-" + S.version;
  var app = document.getElementById("app");
  var etat = { etape: 0, rep: {} };
  var DERNIERE = S.sections.length + 1; // 0 = introduction, 1..n = sections, n+1 = fin

  // Numérotation continue des questions.
  var n = 0;
  S.sections.forEach(function (s) { s.questions.forEach(function (q) { if (!q.sansNumero) q.n = ++n; }); });

  /* ---------- Brouillon local ---------- */
  function charger() {
    try {
      var b = JSON.parse(localStorage.getItem(CLE) || "null");
      if (b && b.rep) { etat.rep = b.rep; etat.etape = Math.min(b.etape || 0, S.sections.length); }
    } catch (e) { /* stockage indisponible : on continue sans brouillon */ }
  }
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* ignoré */ }
  }
  function effacer() {
    try { localStorage.removeItem(CLE); } catch (e) { /* ignoré */ }
  }

  /* ---------- Règles d'affichage ---------- */
  function utilises() {
    var a = etat.rep.q11 || {};
    return S.systems.filter(function (s) { return S.usageEffectif.indexOf(a[s.id]) !== -1; })
      .map(function (s) { return s.id; });
  }
  var regles = {
    accesSansUsage: function () {
      var a = etat.rep.q11 || {};
      return Object.keys(a).some(function (k) { return a[k] === S.accesSansUsage; });
    },
    messageriePerso: function () { return !!etat.rep.q17 && etat.rep.q17 !== "Jamais"; },
    metier: function () { return utilises().some(function (id) { return S.metier.indexOf(id) !== -1; }); },
    eservices: function () { return utilises().indexOf("eservices") !== -1; },
    usage: function () { return utilises().length > 0; }
  };
  function lignes(q) {
    var l = q.rows === "systems" ? S.systems : q.rows;
    if (q.filter === "used") {
      var u = utilises();
      l = l.filter(function (r) { return u.indexOf(r.id) !== -1; });
    }
    return l;
  }
  function visible(q) {
    if (q.showIf && !regles[q.showIf]()) return false;
    if (q.type === "matrix" && lignes(q).length === 0) return false;
    return true;
  }

  /* ---------- Outils DOM ---------- */
  function el(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (attrs[k] === true) e.setAttribute(k, "");
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return e;
  }

  /* ---------- En-tête ---------- */
  (function () {
    var h = document.getElementById("entete");
    if (C.logo) h.appendChild(el("img", { src: C.logo, alt: "" }));
    h.appendChild(el("div", null,
      el("div", { class: "min", text: C.ministere || "" }),
      el("h1", { text: C.titre || document.title })));
  })();

  /* ---------- Rendu des questions ---------- */
  function aide(q) {
    var t = q.help || "";
    if (q.type === "multi") t = q.max ? q.max + " réponses au plus." : "Plusieurs réponses possibles.";
    if (q.type === "text" && !q.required) t = (t ? t + " " : "") + "Réponse facultative.";
    return t ? el("p", { class: "aide", text: t }) : null;
  }

  function rendreChoix(q, bloc) {
    var multi = q.type === "multi";
    var liste = el("div", { class: "options" });
    var cur = etat.rep[q.id];
    q.options.forEach(function (o, i) {
      var inp = el("input", { type: multi ? "checkbox" : "radio", name: q.id, value: o, id: q.id + "_" + i });
      inp.checked = multi ? (cur || []).indexOf(o) !== -1 : cur === o;
      liste.appendChild(el("label", { for: q.id + "_" + i }, inp, el("span", { text: o })));
    });
    bloc.appendChild(liste);

    var champAutre = null;
    if (q.other) {
      champAutre = el("input", { type: "text", class: "autre", "aria-label": "Précisez", placeholder: "Précisez", maxlength: "120" });
      champAutre.value = etat.rep[q.id + "_autre"] || "";
      champAutre.hidden = cur !== q.other;
      champAutre.addEventListener("input", function () { etat.rep[q.id + "_autre"] = champAutre.value; sauver(); });
      bloc.appendChild(champAutre);
    }

    liste.addEventListener("change", function (ev) {
      var t = ev.target;
      if (!multi) {
        etat.rep[q.id] = t.value;
        if (champAutre) champAutre.hidden = t.value !== q.other;
      } else {
        var excl = q.exclusive || [];
        var boites = [].slice.call(liste.querySelectorAll("input"));
        if (t.checked && excl.indexOf(t.value) !== -1) {
          boites.forEach(function (b) { if (b !== t) b.checked = false; });
        } else if (t.checked) {
          boites.forEach(function (b) { if (excl.indexOf(b.value) !== -1) b.checked = false; });
        }
        var choisis = boites.filter(function (b) { return b.checked; });
        if (q.max && choisis.length > q.max) {
          t.checked = false;
          signaler(bloc, q.max + " réponses au plus : décochez une réponse pour en choisir une autre.");
          return;
        }
        etat.rep[q.id] = boites.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      }
      apresSaisie(bloc);
    });
  }

  function rendreMatrice(q, bloc) {
    var cur = etat.rep[q.id] || {};
    var table = el("table", { class: "matrice" });
    var tete = el("tr", null, el("th", { scope: "col", text: "" }));
    q.cols.forEach(function (c) { tete.appendChild(el("th", { scope: "col", text: c })); });
    table.appendChild(el("thead", null, tete));
    var corps = el("tbody");
    lignes(q).forEach(function (r) {
      var tr = el("tr", null, el("th", { scope: "row", text: r.label }));
      q.cols.forEach(function (c, i) {
        var id = q.id + "_" + r.id + "_" + i;
        var inp = el("input", { type: q.multi ? "checkbox" : "radio", name: q.id + "_" + r.id, value: c, id: id, "data-ligne": r.id });
        var v = cur[r.id];
        inp.checked = q.multi ? (v || []).indexOf(c) !== -1 : v === c;
        tr.appendChild(el("td", null, el("label", { for: id }, inp,
          el("span", { class: "lib", text: c }))));
        inp.setAttribute("aria-label", r.label + " : " + c);
      });
      corps.appendChild(tr);
    });
    table.appendChild(corps);
    bloc.appendChild(el("div", { class: "matrice-cadre" }, table));

    table.addEventListener("change", function (ev) {
      var t = ev.target, lig = t.getAttribute("data-ligne");
      var rep = etat.rep[q.id] || (etat.rep[q.id] = {});
      if (!q.multi) {
        rep[lig] = t.value;
      } else {
        var boites = [].slice.call(table.querySelectorAll('input[data-ligne="' + lig + '"]'));
        if (t.checked && t.value === q.exclusiveCol) {
          boites.forEach(function (b) { if (b !== t) b.checked = false; });
        } else if (t.checked) {
          boites.forEach(function (b) { if (b.value === q.exclusiveCol) b.checked = false; });
        }
        rep[lig] = boites.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      }
      apresSaisie(bloc);
    });
  }

  function rendreTexte(q, bloc) {
    var champ = q.short
      ? el("input", { type: q.format === "email" ? "email" : "text", id: q.id, maxlength: "300", autocomplete: q.autocomplete || "off", "aria-required": q.required ? "true" : null })
      : el("textarea", { id: q.id, maxlength: "1500" });
    champ.value = etat.rep[q.id] || "";
    champ.addEventListener("input", function () { etat.rep[q.id] = champ.value; effacerErreur(bloc); sauver(); });
    bloc.appendChild(champ);
  }

  function rendreQuestion(q) {
    var groupe = q.type !== "text";
    var bloc = el(groupe ? "fieldset" : "div", { class: "question", id: "bloc_" + q.id });
    var titre = el(groupe ? "legend" : "label", { class: "intitule" },
      q.n ? el("span", { class: "num", text: q.n + "." }) : null, q.text);
    if (!groupe) titre.setAttribute("for", q.id);
    bloc.appendChild(titre);
    var a = aide(q);
    if (a) bloc.appendChild(a);
    if (q.type === "matrix") rendreMatrice(q, bloc);
    else if (q.type === "text") rendreTexte(q, bloc);
    else rendreChoix(q, bloc);
    bloc.hidden = !visible(q);
    return bloc;
  }

  function signaler(bloc, msg) {
    effacerErreur(bloc);
    bloc.classList.add("invalide");
    bloc.appendChild(el("div", { class: "erreur", role: "alert", text: msg }));
  }
  function effacerErreur(bloc) {
    bloc.classList.remove("invalide");
    var e = bloc.querySelector(".erreur");
    if (e) e.remove();
  }
  function apresSaisie(bloc) {
    effacerErreur(bloc);
    sauver();
    majVisibilite();
  }
  function majVisibilite() {
    if (etat.etape < 1 || etat.etape > S.sections.length) return;
    var sec = S.sections[etat.etape - 1], auMoinsUne = false;
    sec.questions.forEach(function (q) {
      var b = document.getElementById("bloc_" + q.id), v = visible(q);
      if (b) b.hidden = !v;
      if (v) auMoinsUne = true;
    });
    var vide = document.getElementById("section_vide");
    if (vide) vide.hidden = auMoinsUne;
  }

  /* ---------- Contrôle d'une section ---------- */
  function controler(sec) {
    var premier = null;
    sec.questions.forEach(function (q) {
      if (!visible(q) || (q.type === "text" && !q.required)) return;
      var bloc = document.getElementById("bloc_" + q.id), r = etat.rep[q.id], msg = "";
      if (q.type === "text") {
        var txt = (r || "").trim();
        if (!txt) msg = "Ce champ est obligatoire.";
        else if (q.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(txt)) msg = "Adresse électronique invalide.";
      }
      if (q.type === "single" && !r) msg = "Choisissez une réponse.";
      if (q.type === "multi" && !(r && r.length)) msg = "Choisissez au moins une réponse.";
      if (q.type === "matrix") {
        var manque = lignes(q).some(function (l) {
          var v = (r || {})[l.id];
          return q.multi ? !(v && v.length) : !v;
        });
        if (manque) msg = "Répondez pour chaque ligne.";
      }
      if (msg) { signaler(bloc, msg); if (!premier) premier = bloc; }
    });
    if (premier) {
      premier.scrollIntoView({ behavior: "smooth", block: "center" });
      var f = premier.querySelector("input, textarea");
      if (f) f.focus({ preventScroll: true });
    }
    return !premier;
  }

  /* ---------- Préparation de la réponse ---------- */
  function reponseFinale() {
    var out = { version: S.version, date: new Date().toISOString().slice(0, 10) };
    S.sections.forEach(function (sec) {
      sec.questions.forEach(function (q) {
        if (!visible(q)) return;
        var r = etat.rep[q.id];
        if (q.type === "matrix") {
          lignes(q).forEach(function (l) {
            var v = (r || {})[l.id];
            out[q.id + "_" + l.id] = Array.isArray(v) ? v.join(" | ") : (v || "");
          });
        } else if (q.type === "multi") {
          out[q.id] = (r || []).join(" | ");
        } else {
          out[q.id] = typeof r === "string" ? r.trim() : "";
          if (q.other && r === q.other) out[q.id + "_autre"] = (etat.rep[q.id + "_autre"] || "").trim();
        }
      });
    });
    return out;
  }

  function telecharger(donnees) {
    var blob = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
    var a = el("a", { href: URL.createObjectURL(blob), download: "reponse-enquete-si-" + Date.now() + ".json" });
    document.body.appendChild(a); a.click(); a.remove();
  }

  function envoyer(bouton, zoneErreur) {
    var donnees = reponseFinale();
    if (!C.endpoint) { telecharger(donnees); terminer(true); return; }
    bouton.disabled = true; bouton.textContent = "Envoi en cours…";
    zoneErreur.textContent = "";
    // text/plain évite la requête préalable CORS, refusée par certains points de collecte.
    fetch(C.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(donnees) })
      .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); terminer(false); })
      .catch(function () {
        bouton.disabled = false; bouton.textContent = "Envoyer mes réponses";
        zoneErreur.textContent = "L'envoi a échoué. Vérifiez votre connexion et réessayez. Vos réponses sont conservées sur cet appareil.";
      });
  }
  function terminer(modeTest) {
    effacer();
    etat = { etape: DERNIERE, rep: {}, modeTest: modeTest };
    rendre();
  }

  /* ---------- Rendu d'une étape ---------- */
  function aller(etape) {
    etat.etape = etape; sauver(); rendre();
    window.scrollTo(0, 0);
    var t = app.querySelector("h2");
    if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
  }

  function rendre() {
    app.innerHTML = "";
    if (!C.endpoint && etat.etape !== DERNIERE) {
      app.appendChild(el("div", { class: "bandeau-test", text: "Mode test : aucun serveur n'est configuré. À la fin, la réponse sera téléchargée en fichier au lieu d'être envoyée." }));
    }
    var carte = el("section", { class: "carte" });

    if (etat.etape === 0) {
      carte.appendChild(el("h2", { text: "Avant de commencer" }));
      S.intro.forEach(function (p) { carte.appendChild(el("p", { text: p })); });
      if (C.dateLimite) carte.appendChild(el("p", null, el("strong", { text: "Date limite de réponse : " + C.dateLimite })));
      var deb = el("button", { class: "principal", type: "button", text: Object.keys(etat.rep).length ? "Reprendre le questionnaire" : "Commencer" });
      deb.addEventListener("click", function () { aller(1); });
      carte.appendChild(el("div", { class: "actions" }, el("span"), deb));
      app.appendChild(carte);
      return;
    }

    if (etat.etape === DERNIERE) {
      carte.appendChild(el("h2", { text: "Questionnaire terminé" }));
      S.fin.forEach(function (p) { carte.appendChild(el("p", { text: p })); });
      if (etat.modeTest) carte.appendChild(el("p", { class: "aide", text: "Mode test : la réponse a été téléchargée en fichier et n'a pas été transmise." }));
      app.appendChild(carte);
      return;
    }

    var i = etat.etape, sec = S.sections[i - 1], total = S.sections.length;
    app.appendChild(el("div", { class: "progression" },
      el("div", { class: "txt", text: "Section " + i + " sur " + total }),
      el("div", { class: "barre", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(i) },
        el("span", { style: "width:" + Math.round(i / total * 100) + "%" }))));
    carte.appendChild(el("h2", { text: sec.title }));
    if (sec.vide) {
      var v = el("p", { id: "section_vide", text: sec.vide });
      carte.appendChild(v);
    }
    sec.questions.forEach(function (q) { carte.appendChild(rendreQuestion(q)); });

    var zoneErreur = el("div", { class: "erreur", role: "alert" });
    var prec = el("button", { class: "secondaire", type: "button", text: "Précédent" });
    prec.addEventListener("click", function () { aller(i - 1); });
    var suiv = el("button", { class: "principal", type: "button", text: i === total ? "Envoyer mes réponses" : "Suivant" });
    suiv.addEventListener("click", function () {
      if (!controler(sec)) return;
      if (i === total) envoyer(suiv, zoneErreur); else aller(i + 1);
    });
    carte.appendChild(zoneErreur);
    carte.appendChild(el("div", { class: "actions" }, prec, suiv));
    app.appendChild(carte);
    majVisibilite();
  }

  charger();
  rendre();
})();
