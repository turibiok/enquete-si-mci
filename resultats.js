/* Page des résultats : accès par code (vérifié par le point de collecte), synthèse, exports. */
(function () {
  "use strict";
  var S = window.SURVEY, C = window.CONFIG || {};
  var app = document.getElementById("app");
  var toutes = [];          // toutes les réponses reçues
  var filtre = "";          // structure sélectionnée ("" = toutes)
  var SEP = " | ";

  function el(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return e;
  }

  (function () {
    var h = document.getElementById("entete");
    if (C.logo) h.appendChild(el("img", { src: C.logo, alt: "" }));
    h.appendChild(el("div", null, el("div", { class: "min", text: C.ministere || "" }),
      el("h1", { text: "Résultats de l'enquête" })));
  })();

  var D = window.Donnees, COLONNES = D.COLONNES, lignes = D.lignes, libelle = D.libelle, val = D.val;
  function selection() {
    return filtre ? toutes.filter(function (r) { return r.q1 === filtre; }) : toutes;
  }

  /* ---------- Exports ---------- */
  function enregistrer(blob, nom) {
    var a = el("a", { href: URL.createObjectURL(blob), download: nom });
    document.body.appendChild(a); a.click(); a.remove();
  }
  function horodatage() { return new Date().toISOString().slice(0, 10); }
  var exports_ = {
    xlsx: function (rows) {
      enregistrer(window.XlsxMini.build(D.feuilles(rows)), "resultats-enquete-si-" + horodatage() + ".xlsx");
    },
    csv: function (rows) {
      enregistrer(new Blob([D.csv(D.tableBrute(rows))], { type: "text/csv;charset=utf-8" }), "reponses-enquete-si-" + horodatage() + ".csv");
    },
    csvSynthese: function (rows) {
      enregistrer(new Blob([D.csv(D.tableSynthese(rows))], { type: "text/csv;charset=utf-8" }), "synthese-enquete-si-" + horodatage() + ".csv");
    },
    json: function (rows) {
      enregistrer(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }), "reponses-enquete-si-" + horodatage() + ".json");
    },
    pdf: function () { window.print(); }
  };

  /* ---------- Écran d'accès ---------- */
  function ecranAcces(message) {
    app.innerHTML = "";
    var carte = el("section", { class: "carte acces" });
    carte.appendChild(el("h2", { text: "Accès aux résultats" }));
    if (C.endpoint) {
      var champ = el("input", { type: "password", id: "code", autocomplete: "off" });
      var err = el("div", { class: "erreur", role: "alert", text: message || "" });
      var btn = el("button", { class: "principal", type: "submit", text: "Afficher les résultats" });
      var form = el("form", null,
        el("label", { class: "intitule", for: "code", text: "Code d'accès" }), champ, err,
        el("div", { class: "actions" }, el("span"), btn));
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        if (!champ.value) { err.textContent = "Saisissez le code d'accès."; return; }
        btn.disabled = true; btn.textContent = "Chargement…"; err.textContent = "";
        fetch(C.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "resultats", code: champ.value }) })
          .then(function (res) { if (!res.ok && res.status !== 403 && res.status !== 429) throw new Error("HTTP " + res.status); return res.json(); })
          .then(function (d) {
            if (!d || !d.ok) { btn.disabled = false; btn.textContent = "Afficher les résultats"; err.textContent = d && d.erreur === "blocage" ? "Trop d'essais. Réessayez dans 15 minutes." : "Code d'accès incorrect."; champ.select(); return; }
            toutes = d.reponses || []; afficher();
          })
          .catch(function () { btn.disabled = false; btn.textContent = "Afficher les résultats"; err.textContent = "Le serveur ne répond pas. Réessayez."; });
      });
      carte.appendChild(form);
    } else {
      carte.appendChild(el("p", { text: "Mode test : aucun serveur n'est configuré dans config.js. Le code d'accès est vérifié par le serveur ; sans lui, cette page ne peut afficher que des fichiers de réponses importés depuis cet appareil." }));
      var imp = el("input", { type: "file", accept: ".json,application/json", multiple: "multiple", id: "import" });
      imp.addEventListener("change", function () {
        Promise.all([].map.call(imp.files, function (f) { return f.text(); })).then(function (txts) {
          toutes = [];
          txts.forEach(function (t) { try { var d = JSON.parse(t); toutes = toutes.concat(Array.isArray(d) ? d : [d]); } catch (e) { /* fichier ignoré */ } });
          afficher();
        });
      });
      carte.appendChild(el("label", { class: "intitule", for: "import", text: "Importer des fichiers de réponses (.json)" }));
      carte.appendChild(imp);
    }
    app.appendChild(carte);
  }

  /* ---------- Affichage des résultats ---------- */
  function barres(q, rows, cle, base) {
    var liste = el("table", { class: "barres" });
    var options = q.cols || q.options;
    options.forEach(function (o) {
      var eff = rows.filter(function (r) { return val(r, cle).split(SEP).indexOf(o) !== -1; }).length;
      var pct = base ? Math.round(eff / base * 100) : 0;
      liste.appendChild(el("tr", null,
        el("th", { scope: "row", text: o }),
        el("td", { class: "jauge" }, el("span", { style: "width:" + pct + "%" })),
        el("td", { class: "nb", text: eff + " (" + pct + " %)" })));
    });
    return liste;
  }
  function blocQuestion(q, rows) {
    var bloc = el("div", { class: "resultat" });
    bloc.appendChild(el("h3", { text: libelle(q) }));
    if (q.type === "text") {
      var rep = rows.map(function (r) { return val(r, q.id).trim(); }).filter(Boolean);
      bloc.appendChild(el("p", { class: "aide", text: rep.length + " réponse(s) libre(s)" }));
      if (rep.length) {
        var ul = el("ul", { class: "verbatims" });
        rep.forEach(function (t) { ul.appendChild(el("li", { text: t })); });
        bloc.appendChild(ul);
      }
    } else if (q.type === "matrix") {
      var t = el("table", { class: "matrice croise" });
      var tete = el("tr", null, el("th", { text: "" }));
      q.cols.forEach(function (c) { tete.appendChild(el("th", { scope: "col", text: c })); });
      tete.appendChild(el("th", { scope: "col", text: "Répondants" }));
      t.appendChild(el("thead", null, tete));
      var corps = el("tbody");
      lignes(q).forEach(function (l) {
        var cle = q.id + "_" + l.id;
        var base = rows.filter(function (r) { return val(r, cle); }).length;
        var tr = el("tr", null, el("th", { scope: "row", text: l.label }));
        q.cols.forEach(function (c) {
          var eff = rows.filter(function (r) { return val(r, cle).split(SEP).indexOf(c) !== -1; }).length;
          var pct = base ? Math.round(eff / base * 100) : 0;
          var td = el("td", { text: base ? eff + " (" + pct + " %)" : "" });
          td.style.background = "color-mix(in srgb, var(--c-primaire) " + Math.round(pct * 0.45) + "%, #fff)";
          if (pct > 60) td.style.color = "#fff";
          tr.appendChild(td);
        });
        tr.appendChild(el("td", { text: String(base) }));
        corps.appendChild(tr);
      });
      t.appendChild(corps);
      bloc.appendChild(el("div", { class: "matrice-cadre" }, t));
    } else {
      var base = rows.filter(function (r) { return val(r, q.id); }).length;
      bloc.appendChild(el("p", { class: "aide", text: base + " répondant(s)" + (q.type === "multi" ? ", plusieurs réponses possibles" : "") }));
      bloc.appendChild(barres(q, rows, q.id, base));
    }
    return bloc;
  }

  function afficher() {
    app.innerHTML = "";
    var rows = selection();
    var structures = toutes.map(function (r) { return r.q1; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();

    // Barre d'outils
    var sel = el("select", { id: "filtre" }, el("option", { value: "", text: "Toutes les structures" }));
    structures.forEach(function (s) { var o = el("option", { value: s, text: s }); if (s === filtre) o.selected = true; sel.appendChild(o); });
    sel.addEventListener("change", function () { filtre = sel.value; afficher(); });
    function bouton(txt, fn) { var b = el("button", { class: "secondaire", type: "button", text: txt }); b.addEventListener("click", function () { fn(selection()); }); return b; }
    var courriels = rows.map(function (r) { return val(r, "email").toLowerCase(); }).filter(Boolean);
    var doublons = courriels.filter(function (c, i) { return courriels.indexOf(c) !== i; }).length;

    app.appendChild(el("section", { class: "carte outils" },
      el("div", { class: "chiffres" },
        el("div", null, el("strong", { text: String(rows.length) }), el("span", { text: " réponse(s)" + (filtre ? " sur " + toutes.length : "") })),
        doublons ? el("div", { class: "alerte", text: doublons + " réponse(s) en doublon (même adresse électronique)" }) : null),
      el("div", { class: "ligne" }, el("label", { for: "filtre", text: "Structure : " }), sel),
      el("div", { class: "ligne exports" },
        bouton("Excel (.xlsx)", exports_.xlsx), bouton("CSV des réponses", exports_.csv),
        bouton("CSV de la synthèse", exports_.csvSynthese), bouton("JSON", exports_.json),
        bouton("PDF (imprimer)", exports_.pdf))));

    app.appendChild(el("p", { class: "impression-seule", text: "Synthèse au " + horodatage() + ". Périmètre : " + (filtre || "toutes les structures") + ". " + rows.length + " réponse(s)." }));

    if (!rows.length) { app.appendChild(el("section", { class: "carte" }, el("p", { text: "Aucune réponse pour ce périmètre." }))); return; }

    // Synthèse par section
    S.sections.forEach(function (s) {
      var carte = el("section", { class: "carte section-resultats" }, el("h2", { text: s.title }));
      s.questions.forEach(function (q) { if (!q.sansNumero) carte.appendChild(blocQuestion(q, rows)); });
      app.appendChild(carte);
    });

    // Réponses individuelles
    var t = el("table", { class: "matrice brut" });
    var tete = el("tr");
    COLONNES.forEach(function (c) { tete.appendChild(el("th", { scope: "col", title: c.libelle, text: c.cle })); });
    t.appendChild(el("thead", null, tete));
    var corps = el("tbody");
    rows.forEach(function (r) {
      var tr = el("tr");
      COLONNES.forEach(function (c) { tr.appendChild(el("td", { text: val(r, c.cle) })); });
      corps.appendChild(tr);
    });
    t.appendChild(corps);
    app.appendChild(el("section", { class: "carte ecran-seul" },
      el("h2", { text: "Réponses individuelles" }),
      el("p", { class: "aide", text: "Données nominatives. Survolez un en-tête pour lire la question. Ce tableau n'est pas inclus dans le PDF." }),
      el("div", { class: "matrice-cadre haut" }, t)));
  }

  ecranAcces();
})();
