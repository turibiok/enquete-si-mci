/* Contenu du questionnaire (annexe 2 de la note de cadrage). Modifier ici les libellés et les options. */
(function () {
  var FREQ = ["Jamais", "Rarement", "Souvent", "Presque toujours"];
  var USAGE = [
    "Je ne connais pas",
    "Je connais, sans accès",
    "J'ai un accès, sans l'utiliser",
    "Usage occasionnel",
    "Usage hebdomadaire",
    "Usage quotidien",
    "Non concerné par mes fonctions"
  ];

  window.SURVEY = {
    version: "2026-11",
    // Réponses de la question 11 qui comptent comme un usage effectif.
    usageEffectif: ["Usage occasionnel", "Usage hebdomadaire", "Usage quotidien"],
    accesSansUsage: "J'ai un accès, sans l'utiliser",
    metier: ["eservices", "gesrh", "gec", "econseil"],
    systems: [
      { id: "eservices", label: "Traitement des demandes d'e-services (service-public.bj)" },
      { id: "gesrh", label: "GesRH" },
      { id: "gec", label: "GEC (gestion des courriers)" },
      { id: "sharepoint", label: "SharePoint du MCI" },
      { id: "econseil", label: "eConseil" },
      { id: "outlook", label: "Outlook" },
      { id: "teams", label: "Teams" },
      { id: "onedrive", label: "OneDrive" },
      { id: "office", label: "Word, Excel, PowerPoint" }
    ],
    intro: [
      "Madame, Monsieur,",
      "Le Ministère du Commerce Intérieur réalise un diagnostic de l'utilisation de ses outils et applications numériques. Votre réponse sert à définir les équipements, les améliorations et les formations à prévoir en priorité.",
      "Ce questionnaire est nominatif : vos nom, prénoms et adresse électronique sont enregistrés avec vos réponses. Les résultats sont présentés par structure et ne peuvent fonder aucune mesure individuelle. Il n'y a ni bonne ni mauvaise réponse : décrivez votre situation réelle.",
      "Durée : 20 à 25 minutes. Sauf mention contraire, une seule réponse par question. Vos réponses sont conservées sur cet appareil tant que vous n'avez pas envoyé le questionnaire : vous pouvez l'interrompre et le reprendre."
    ],
    fin: [
      "Merci pour votre participation. Vos réponses sont enregistrées.",
      "Si vous souhaitez participer à un groupe de travail sur les outils numériques du ministère, signalez-le à votre point focal."
    ],
    sections: [
      {
        title: "Section 1. Profil",
        questions: [
          { id: "nom", type: "text", short: true, required: true, sansNumero: true, autocomplete: "name", text: "Nom et prénoms" },
          { id: "email", type: "text", short: true, required: true, sansNumero: true, format: "email", autocomplete: "email", text: "Adresse électronique" },
          { id: "q1", type: "single", text: "Quelle est votre structure de rattachement ?",
            options: ["Cabinet du Ministre", "Secrétariat général", "Direction du commerce intérieur", "DPAF", "DTDI", "Direction départementale", "Autre structure (précisez)"],
            other: "Autre structure (précisez)" },
          { id: "q2", type: "single", text: "Quelle est votre fonction ?",
            options: ["Directeur ou responsable de structure", "Chef de service", "Cadre ou chargé d'études", "Assistant administratif ou secrétaire", "Agent technique", "Personnel d'appui"] },
          { id: "q3", type: "single", text: "Depuis combien de temps travaillez-vous au ministère ?",
            options: ["Moins d'un an", "1 à 3 ans", "4 à 7 ans", "8 à 15 ans", "Plus de 15 ans"] },
          { id: "q4", type: "single", text: "Quel est votre principal domaine d'activité ?",
            options: ["Administration et gestion", "Commerce et réglementation", "Suivi et contrôle des activités commerciales", "Études et statistiques", "Finances et comptabilité", "Ressources humaines", "Informatique et systèmes d'information", "Autre"] }
        ]
      },
      {
        title: "Section 2. Équipements et accès",
        questions: [
          { id: "q5", type: "single", text: "Avec quel ordinateur travaillez-vous ?",
            options: ["Un ordinateur fourni par le ministère, pour moi seul", "Un ordinateur fourni par le ministère, partagé avec des collègues", "Mon ordinateur personnel", "Je n'ai pas d'ordinateur pour travailler"] },
          { id: "q6", type: "single", text: "Dans quel état est cet ordinateur ?",
            options: ["Il fonctionne bien", "Il est lent mais utilisable", "Il tombe souvent en panne", "Non concerné"] },
          { id: "q7", type: "single", text: "Comment est la connexion Internet à votre poste de travail ?",
            options: ["Stable", "Irrégulière", "Trop lente pour travailler", "Je n'ai pas de connexion"] },
          { id: "q8", type: "single", text: "Utilisez-vous votre forfait Internet personnel pour travailler ?", options: FREQ.map(function (f) { return f === "Rarement" ? "Parfois" : f; }) },
          { id: "q9", type: "single", text: "Avez-vous une adresse électronique professionnelle ?",
            options: ["Oui, je l'utilise chaque jour", "Oui, je l'utilise rarement", "Oui, mais je ne sais pas y accéder", "Non"] },
          { id: "q10", type: "multi", max: 3, text: "Quelles sont vos principales difficultés matérielles ?",
            options: ["Pas assez d'ordinateurs", "Matériel ancien", "Connexion Internet", "Coupures d'électricité", "Pannes non réparées", "Imprimante ou scanner indisponible", "Aucune difficulté"],
            exclusive: ["Aucune difficulté"] }
        ]
      },
      {
        title: "Section 3. Applications et plateformes : connaissance et usage",
        questions: [
          { id: "q11", type: "matrix", rows: "systems", cols: USAGE,
            text: "Pour chaque application ou plateforme, indiquez votre situation.", help: "Une réponse par ligne." },
          { id: "q12", type: "single", showIf: "accesSansUsage",
            text: "Si vous avez un accès à une application sans l'utiliser, quelle en est la raison principale ?",
            options: ["Je n'ai pas été formé", "L'application ne correspond pas à mes tâches", "L'application est trop lente ou souvent indisponible", "Mon service continue de travailler sur papier", "J'utilise un autre outil à la place", "Non concerné"] },
          { id: "q13", type: "text", short: true,
            text: "Utilisez-vous pour votre travail d'autres applications, non citées à la question 11 ? Si oui, lesquelles ?" }
        ]
      },
      {
        title: "Section 4. Usages",
        questions: [
          { id: "q14", type: "multi", text: "Pour quelles tâches utilisez-vous Outlook ?",
            options: ["Envoyer et recevoir des courriels professionnels", "Gérer mon calendrier et les invitations aux réunions", "Envoyer des documents en pièce jointe", "Consulter ma messagerie sur téléphone", "Je n'utilise pas Outlook"],
            exclusive: ["Je n'utilise pas Outlook"] },
          { id: "q15", type: "multi", text: "Pour quelles tâches utilisez-vous Teams ?",
            options: ["Participer à des réunions en ligne", "Organiser des réunions en ligne", "Échanger des messages avec les collègues", "Partager ou modifier des documents à plusieurs", "Je n'utilise pas Teams"],
            exclusive: ["Je n'utilise pas Teams"] },
          { id: "q16", type: "multi", text: "Où enregistrez-vous les documents que vous partagez avec vos collègues ?",
            options: ["SharePoint du MCI", "OneDrive", "Pièce jointe envoyée par Outlook", "Clé USB", "WhatsApp ou autre messagerie personnelle", "Papier"] },
          { id: "q17", type: "single", text: "Utilisez-vous une messagerie personnelle (Gmail, Yahoo, WhatsApp) pour des échanges professionnels ?", options: FREQ },
          { id: "q18", type: "single", showIf: "messageriePerso", text: "Si oui, pour quelle raison principale ?",
            options: ["Je n'ai pas d'adresse professionnelle", "La messagerie professionnelle fonctionne mal", "Mes interlocuteurs utilisent ces canaux", "C'est plus rapide", "Non concerné"] },
          { id: "q19", type: "text", showIf: "metier",
            text: "Quelles opérations réalisez-vous dans les applications métier que vous utilisez (GesRH, GEC, eConseil, traitement des e-services) ?", help: "Réponse courte, par application." },
          { id: "q20", type: "single", showIf: "metier", text: "Pour ces opérations, tenez-vous encore un registre ou un dossier papier en parallèle ?",
            options: ["Non", "Oui, pour certaines opérations", "Oui, pour toutes", "Non concerné"] },
          { id: "q21", type: "text", showIf: "eservices",
            text: "Si vous traitez des demandes d'agrément ou d'autorisation, quelles étapes se font encore sur papier ou hors plateforme ?" },
          { id: "q22", type: "multi", text: "Dans votre service, quelles tâches se font encore principalement sur papier ?",
            options: ["Enregistrement et circulation du courrier", "Signature et validation des documents", "Archivage", "Demandes de congé et actes de gestion du personnel", "Suivi des dossiers des usagers", "Rapports et statistiques", "Aucune"],
            exclusive: ["Aucune"] }
        ]
      },
      {
        title: "Section 5. Problèmes rencontrés",
        questions: [
          { id: "q23", type: "matrix", multi: true, rows: "systems", filter: "used",
            cols: ["Compte ou accès", "Lenteur ou indisponibilité", "Erreurs ou blocages", "Difficile à utiliser", "Fonctions manquantes", "Aucun problème"],
            exclusiveCol: "Aucun problème",
            text: "Pour chaque application que vous utilisez, quels problèmes rencontrez-vous ?", help: "Plusieurs réponses possibles par ligne." },
          { id: "q24", type: "single", showIf: "usage", text: "À quelle fréquence ces problèmes vous empêchent-ils de travailler ?",
            options: ["Chaque jour", "Chaque semaine", "Chaque mois", "Rarement ou jamais"] },
          { id: "q25", type: "single", showIf: "usage", text: "Quand un problème survient, que faites-vous en premier ?",
            options: ["Je demande à un collègue", "Je contacte la DTDI", "Je passe par le papier ou un autre outil", "J'attends"] },
          { id: "q26", type: "single", showIf: "usage", text: "En général, en combien de temps un problème signalé est-il résolu ?",
            options: ["Le jour même", "Dans la semaine", "En plus d'une semaine", "Il n'est pas résolu", "Je n'ai jamais signalé de problème"] },
          { id: "q27", type: "text", showIf: "usage", text: "Quel problème vous gêne le plus, et sur quelle application ?" }
        ],
        vide: "Vous n'avez déclaré utiliser aucune application à la question 11 : cette section ne vous concerne pas. Passez à la suivante."
      },
      {
        title: "Section 6. Compétences et formation",
        questions: [
          { id: "q28", type: "single", text: "Comment évaluez-vous votre niveau général en informatique ?",
            options: ["Débutant", "Intermédiaire", "Avancé", "Expert"] },
          { id: "q29", type: "matrix", cols: ["Oui", "Avec de l'aide", "Non"],
            rows: [
              { id: "courriel", label: "Envoyer un courriel avec une pièce jointe" },
              { id: "word", label: "Mettre en forme un document administratif dans Word" },
              { id: "excel", label: "Faire un tableau avec des formules dans Excel" },
              { id: "reunion", label: "Rejoindre une réunion en ligne" },
              { id: "lien", label: "Partager un document par un lien plutôt qu'en pièce jointe" },
              { id: "ia", label: "Utiliser un assistant d'intelligence artificielle" }
            ],
            text: "Savez-vous réaliser seul les opérations suivantes ?", help: "Une réponse par ligne." },
          { id: "q30", type: "multi", text: "Comment avez-vous appris à utiliser les applications du ministère ?",
            options: ["Formation organisée par le ministère", "Explications d'un collègue", "Guide ou tutoriel", "Seul, par la pratique"] },
          { id: "q31", type: "matrix", cols: ["Aucun", "Initiation", "Perfectionnement", "Non concerné"],
            rows: [
              { id: "outlook", label: "Outlook" },
              { id: "teams", label: "Teams" },
              { id: "sharepoint_onedrive", label: "SharePoint et OneDrive" },
              { id: "word", label: "Word" },
              { id: "excel", label: "Excel" },
              { id: "powerpoint", label: "PowerPoint" },
              { id: "gesrh", label: "GesRH" },
              { id: "gec", label: "GEC" },
              { id: "econseil", label: "eConseil" },
              { id: "eservices", label: "Traitement des demandes d'e-services" }
            ],
            text: "Pour chaque application ou plateforme, quel est votre besoin de formation ?", help: "Une réponse par ligne." },
          { id: "q32", type: "multi", max: 3, text: "Sur quels points souhaitez-vous être formé en priorité ?",
            options: ["Gérer ma messagerie et mon calendrier dans Outlook", "Organiser et animer une réunion dans Teams", "Classer, partager et modifier des documents à plusieurs dans SharePoint et OneDrive", "Tableaux, formules et graphiques dans Excel", "Mise en forme de documents administratifs dans Word", "Utilisation d'une application métier (GesRH, GEC, eConseil)", "Sécurité : mots de passe, courriels frauduleux, partage de documents", "Utilisation de l'intelligence artificielle dans mon travail"] },
          { id: "q33", type: "single", text: "Quel format de formation vous convient le mieux ?",
            options: ["Atelier pratique en présentiel", "Séance en ligne", "Vidéos courtes", "Guide écrit pas à pas", "Accompagnement à mon poste de travail"] },
          { id: "q34", type: "single", text: "Combien de temps pouvez-vous consacrer à la formation ?",
            options: ["Moins de 2 heures par mois", "2 à 4 heures par mois", "Une journée par mois", "Plus d'une journée par mois"] },
          { id: "q35", type: "single", text: "Disposez-vous d'un guide d'utilisation pour les applications que vous utilisez ?",
            options: ["Oui, pour toutes", "Oui, pour certaines", "Non"] }
        ]
      },
      {
        title: "Section 7. Sécurité et données",
        questions: [
          { id: "q36", type: "single", text: "Connaissez-vous les règles de sécurité informatique de votre service ?",
            options: ["Oui, je les ai reçues par écrit", "Oui, on me les a expliquées oralement", "Non"] },
          { id: "q37", type: "single", text: "Vous arrive-t-il de partager vos identifiants ou mots de passe avec des collègues ?",
            options: ["Jamais", "Rarement", "Parfois", "Souvent"] },
          { id: "q38", type: "multi", text: "Au cours des 12 derniers mois, avez-vous rencontré l'un de ces incidents ?",
            options: ["Perte de documents de travail", "Virus sur mon ordinateur ou ma clé USB", "Compte utilisé par quelqu'un d'autre sans mon accord", "Courriel ou message frauduleux", "Aucun incident"],
            exclusive: ["Aucun incident"] },
          { id: "q39", type: "single", text: "Savez-vous à qui signaler un incident informatique ?", options: ["Oui", "Non"] }
        ]
      },
      {
        title: "Section 8. Intelligence artificielle",
        questions: [
          { id: "q40", type: "single", text: "Utilisez-vous des assistants d'intelligence artificielle (ChatGPT, Gemini, Copilot ou autres) ?",
            options: ["Régulièrement, y compris pour mon travail", "Régulièrement, à titre personnel seulement", "Occasionnellement", "J'ai essayé, je ne les utilise plus", "Jamais"] },
          { id: "q41", type: "multi", max: 3, text: "Pour quelles activités l'intelligence artificielle vous serait-elle utile ?",
            options: ["Rédaction et synthèse de documents", "Analyse de données commerciales", "Rapports et tableaux de bord", "Recherche documentaire et veille réglementaire", "Traitement des demandes et réclamations des usagers", "Traduction", "Aucune"],
            exclusive: ["Aucune"] },
          { id: "q42", type: "multi", text: "Quels risques associez-vous à l'intelligence artificielle dans l'administration ?",
            options: ["Fuite de données confidentielles", "Informations fausses ou non vérifiées", "Dépendance à l'outil", "Perte de compétences", "Suppression de postes", "Aucun risque particulier", "Je ne sais pas"],
            exclusive: ["Aucun risque particulier", "Je ne sais pas"] },
          { id: "q43", type: "single", text: "Souhaitez-vous suivre une formation sur l'usage responsable de l'intelligence artificielle dans votre travail ?",
            options: ["Oui", "Peut-être", "Non"] }
        ]
      },
      {
        title: "Section 9. Appréciation et priorités",
        questions: [
          { id: "q44", type: "matrix", rows: "systems", filter: "used",
            cols: ["Très satisfait", "Satisfait", "Peu satisfait", "Pas du tout satisfait"],
            text: "Pour chaque application que vous utilisez, quel est votre niveau de satisfaction ?", help: "Une réponse par ligne." },
          { id: "q45", type: "text", text: "Quelles fonctions manquent dans les applications que vous utilisez ?" },
          { id: "q46", type: "text", text: "Quelles informations saisissez-vous plusieurs fois dans des applications différentes ?" },
          { id: "q47", type: "single", text: "Quelle application doit être améliorée en priorité ?",
            options: ["Traitement des demandes d'e-services", "GesRH", "GEC", "SharePoint du MCI", "eConseil", "Outlook", "Teams", "OneDrive", "Word, Excel, PowerPoint", "Aucune"] },
          { id: "q48", type: "multi", max: 3, text: "Quelles actions le ministère doit-il engager en priorité ?",
            options: ["Fournir ou renouveler les ordinateurs", "Améliorer la connexion Internet", "Former les agents aux outils existants", "Améliorer les applications existantes", "Dématérialiser de nouvelles procédures", "Renforcer l'assistance aux utilisateurs", "Renforcer la sécurité des données", "Introduire des outils d'intelligence artificielle"] },
          { id: "q49", type: "text", text: "Quelle tâche répétitive de votre travail souhaitez-vous voir automatisée ?" },
          { id: "q50", type: "text", text: "Avez-vous d'autres observations ou propositions ?" }
        ]
      }
    ]
  };
})();
