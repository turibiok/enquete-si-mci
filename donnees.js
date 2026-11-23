/* Mise en forme des réponses : colonnes, synthèse, CSV, classeur Excel.
   Utilisé par la page des résultats (navigateur) et par serveur.js (Node). */
(function () {
  "use strict";
  var S = window.SURVEY, SEP = " | ";
  var n = 0;
  S.sections.forEach(function (s) { s.questions.forEach(function (q) { if (!q.sansNumero) q.n = ++n; }); });

  function lignes(q) { return q.rows === "systems" ? S.systems : q.rows; }
  function libelle(q) { return (q.n ? q.n + ". " : "") + q.text; }
  function val(r, k) { var v = r[k]; return v === undefined || v === null ? "" : String(v); }

  // Liste ordonnée des colonnes de la base : [{ cle, libelle }]
  var COLONNES = [{ cle: "date", libelle: "Date de réponse" }];
  S.sections.forEach(function (s) {
    s.questions.forEach(function (q) {
      if (q.type === "matrix") {
        lignes(q).forEach(function (l) { COLONNES.push({ cle: q.id + "_" + l.id, libelle: libelle(q) + " [" + l.label + "]" }); });
      } else {
        COLONNES.push({ cle: q.id, libelle: libelle(q) });
        if (q.other) COLONNES.push({ cle: q.id + "_autre", libelle: libelle(q) + " [précision]" });
      }
    });
  });

  // Retourne [{ section, question, modalite, effectif, base, pct }]
  function synthese(rows) {
    var out = [];
    function ajouter(sec, question, modalites, valeurs) {
      var base = valeurs.length;
      modalites.forEach(function (m) {
        var eff = valeurs.filter(function (v) { return v.indexOf(m) !== -1; }).length;
        out.push({ section: sec, question: question, modalite: m, effectif: eff, base: base, pct: base ? Math.round(eff / base * 1000) / 10 : 0 });
      });
    }
    S.sections.forEach(function (s) {
      s.questions.forEach(function (q) {
        if (q.type === "text") return;
        if (q.type === "matrix") {
          lignes(q).forEach(function (l) {
            var v = rows.map(function (r) { return val(r, q.id + "_" + l.id); }).filter(Boolean).map(function (x) { return x.split(SEP); });
            ajouter(s.title, libelle(q) + " [" + l.label + "]", q.cols, v);
          });
        } else {
          var v = rows.map(function (r) { return val(r, q.id); }).filter(Boolean).map(function (x) { return q.type === "multi" ? x.split(SEP) : [x]; });
          ajouter(s.title, libelle(q), q.options, v);
        }
      });
    });
    return out;
  }

  function tableBrute(rows) {
    return [COLONNES.map(function (c) { return c.cle; })]
      .concat(rows.map(function (r) { return COLONNES.map(function (c) { return val(r, c.cle); }); }));
  }
  function tableSynthese(rows) {
    return [["Section", "Question", "Modalité", "Effectif", "Répondants à la question", "%"]]
      .concat(synthese(rows).map(function (x) { return [x.section, x.question, x.modalite, x.effectif, x.base, x.pct]; }));
  }
  function csv(table) {
    return "﻿" + table.map(function (l) {
      return l.map(function (v) {
        v = String(v);
        if (/^[=+\-@]/.test(v)) v = "'" + v;   // neutralise les formules à l'ouverture dans un tableur
        return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(";");
    }).join("\r\n");
  }
  function feuilles(rows) {
    return [
      { name: "Réponses", rows: tableBrute(rows) },
      { name: "Synthèse", rows: tableSynthese(rows) },
      { name: "Dictionnaire", rows: [["Colonne", "Question"]].concat(COLONNES.map(function (c) { return [c.cle, c.libelle]; })) }
    ];
  }

  window.Donnees = { SEP: SEP, COLONNES: COLONNES, lignes: lignes, libelle: libelle, val: val,
    synthese: synthese, tableBrute: tableBrute, tableSynthese: tableSynthese, csv: csv, feuilles: feuilles };
})();
