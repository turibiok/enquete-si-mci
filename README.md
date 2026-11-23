# Enquête SI - formulaire, base de données et page des résultats

Application Node.js sans dépendance (Node 18 ou plus).

- `index.html` : questionnaire adressé au personnel, 50 questions en 9 sections, précédées du nom et de l'adresse électronique du répondant.
- `resultats.html` : page séparée des résultats, accessible avec un code, avec exports Excel, CSV, JSON et PDF.
- `data/` : base de données, dans le dossier de l'application.

## Démarrage

```bash
node serveur.js
```

- Formulaire : `http://localhost:8080/`
- Résultats : `http://localhost:8080/resultats.html`

Le port et le code d'accès se règlent dans le fichier `.env` (`PORT`, `CODE_ACCES`).

## Base de données

Chaque réponse reçue met à jour trois fichiers du dossier `data/` :

| Fichier | Contenu |
| --- | --- |
| `data/reponses.json` | Fichier de référence, relu au démarrage du serveur |
| `data/reponses.xlsx` | Classeur Excel : feuilles Réponses, Synthèse, Dictionnaire |
| `data/reponses.csv` | Réponses, séparateur point-virgule, encodage UTF-8 |

Les fichiers Excel et CSV sont régénérés à partir du JSON à chaque réponse : une modification faite à la main dans ces deux fichiers est écrasée. Pour corriger la base, modifier `reponses.json` serveur arrêté.

**Remise à zéro :** arrêter le serveur, supprimer le contenu de `data/` (ou le déplacer pour archive), relancer. Les trois fichiers sont recréés vides.

**Sauvegarde :** copier le dossier `data/`.

## Code d'accès aux résultats

Le code est lu dans `.env` (`CODE_ACCES`) et vérifié par le serveur. Il n'est écrit dans aucune page. Après 5 essais erronés depuis une même adresse, l'accès est bloqué 15 minutes.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `serveur.js` | Sert les pages, enregistre les réponses, contrôle le code d'accès |
| `.env` | Code d'accès et port (non publié sur GitHub) |
| `config.js` | Nom du ministère, logo, date limite, adresse du serveur |
| `theme.css` | Couleurs et police (charte graphique) |
| `questions.js` | Texte des questions et des options |
| `app.js`, `styles.css` | Formulaire : étapes, contrôles, brouillon local, envoi |
| `resultats.js`, `resultats.css` | Page des résultats : synthèse, filtre par structure, exports |
| `donnees.js`, `xlsx-mini.js` | Mise en forme des données et écriture Excel, communs au serveur et au navigateur |

## Avant la mise en ligne

1. **Charte graphique.** Les couleurs de `theme.css` sont des valeurs par défaut. Les remplacer par les codes de la charte officielle, déposer le logo officiel dans `assets/` et renseigner `logo` dans `config.js` (exemple : `"assets/logo.png"`).
2. **Date limite.** Renseigner `dateLimite` dans `config.js`.
3. **Question 1.** Compléter la liste des structures dans `questions.js` avec l'organigramme officiel.
4. **HTTPS.** Placer le serveur derrière un proxy HTTPS (nginx, Caddy ou l'hébergeur) : sans cela, les noms, les réponses et le code d'accès circulent en clair.

## Déploiement via GitHub

GitHub Pages ne convient pas : il ne sert que des fichiers statiques et ne peut ni exécuter `serveur.js` ni écrire dans `data/`. GitHub sert ici à héberger le code, qu'un serveur Node récupère.

```bash
git init
git add .
git commit -m "Enquête SI"
git branch -M main
git remote add origin https://github.com/<organisation>/<depot>.git
git push -u origin main
```

Le fichier `.gitignore` exclut `data/` et `.env` : les réponses nominatives et le code d'accès ne partent pas sur GitHub.

Sur le serveur d'hébergement :

```bash
git clone https://github.com/<organisation>/<depot>.git
cd <depot>
cp .env.example .env      # puis renseigner CODE_ACCES
node serveur.js           # ou un gestionnaire de processus (systemd, pm2)
```

L'hébergeur doit offrir un disque persistant. Sur les offres qui recréent le conteneur à chaque déploiement, le dossier `data/` est effacé et les réponses sont perdues.

## Page des résultats

- Synthèse par question : effectifs et pourcentages, tableaux croisés pour les questions en grille, réponses libres listées sans nom.
- Filtre par structure, signalement des doublons (même adresse électronique).
- Tableau des réponses individuelles (nominatif).
- Exports : Excel, CSV des réponses, CSV de la synthèse, JSON, PDF. Le PDF passe par l'impression du navigateur (« Enregistrer au format PDF ») et contient la synthèse, pas le tableau nominatif.

## Limites à connaître

- **Données nominatives.** Le traitement relève du code du numérique : formalités à vérifier avec la structure juridique du ministère avant la collecte.
- **Un seul code partagé.** Toute personne qui connaît le code lit l'ensemble des réponses nominatives. Il n'y a ni compte individuel ni journal des accès.
- **Formulaire ouvert.** L'identité saisie n'est pas vérifiée et les réponses multiples ne sont pas bloquées, seulement signalées.
- **Base en fichiers.** Adaptée à quelques centaines ou milliers de réponses sur un seul serveur. Elle n'est pas chiffrée : la protection repose sur les droits d'accès au serveur.
- **Brouillon.** Les réponses en cours, nom compris, sont conservées dans le navigateur de l'agent et effacées après l'envoi. Sur un poste partagé, un agent qui interrompt sa saisie laisse son brouillon visible au suivant.
