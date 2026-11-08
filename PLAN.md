# Plan de développement : envdiff

`envdiff` est un outil en ligne de commande open-source permettant de vérifier la cohérence des variables d'environnement d'un projet en croisant le code source, `.env` et `.env.example`.

---

## 1. Vue d'ensemble & Architecture

### 1.1 Stack technique choisie
- **Langage / Runtime** : TypeScript / Node.js (idéal pour un outil distribué via `npx`, avec un vaste écosystème de parsers AST pour JS, TS, Python, etc.).
- **CLI Framework** : `commander` (robuste, gestion des options, aides, sous-commandes).
- **Parsers AST / Analyse de code** :
  - **JS / TS / Next.js / Expo** : `@typescript-eslint/typescript-estree` ou `acorn` / `babel/parser` pour analyser les AST et détecter `process.env.XYZ`, `import.meta.env.XYZ`, etc.
  - **Python** : Module `ast` standard via un script léger ou analyse par expressions régulières robustes (pour détecter `os.environ`, `os.getenv`, `pydantic`).
- **Gestion des fichiers .env** : `dotenv` / `dotenv-expand` pour parser proprement les fichiers `.env*`.
- **Affichage CLI** : `picocolors` (léger et rapide pour les couleurs), `ora` (spinners), `table` ou formatage personnalisé propre.
- **Ignore / Git** : `ignore` (package npm pour parser `.gitignore` et `.envdiffignore`).

### 1.2 Structure du projet monoréno / package
```
envdiff/
├── bin/
│   └── envdiff.js          # Point d'entrée CLI bin
├── src/
│   ├── index.ts            # API programmatique principale
│   ├── cli.ts              # Configuration de Commander.js
│   ├── config.ts           # Chargement du .envdiffrc et options
│   ├── scanners/
│   │   ├── index.ts        # Orchestrateur des scanners
│   │   ├── js-ts.ts        # Scanner JS/TS (AST process.env, import.meta.env)
│   │   └── python.ts       # Scanner Python (os.environ, os.getenv, pydantic)
│   ├── env/
│   │   ├── loader.ts       # Lecture .env, .env.example, .gitignore, .envdiffignore
│   │   └── resolver.ts     # Résolution des chemins (monorepo)
│   ├── engine/
│   │   └── analyzer.ts     # Croisement code vs .env vs .env.example
│   └── reporters/
│       ├── console.ts      # Sortie colorée et lisible avec fichier/ligne
│       └── json.ts         # Sortie JSON pour intégration CI / outils tiers
├── tests/                  # Tests unitaires et d'intégration (vitest)
├── package.json
└── README.md
```

---

## 2. Fonctionnalités détaillées & Implémentation

### 2.1 Analyse du code source (Scanners)
- **JS / TS** :
  - Parcours des fichiers sources en ignorant `node_modules`, `dist`, et les dossiers/fichiers exclus dans `.gitignore`, `.envdiffignore` ou `.envdiffrc`.
  - Détection par AST des patterns :
    - `process.env.VARIABLE_NAME`
    - `process.env['VARIABLE_NAME']` ou `process.env["VARIABLE_NAME"]`
    - `import.meta.env.VARIABLE_NAME`
    - `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`
  - **Accès dynamiques** : Détection de `process.env[dynamicName]` pour émettre un **Warning** (impossible à statuer statiquement).
- **Python** :
  - Détection par AST ou regex de :
    - `os.environ.get("VAR")`, `os.environ["VAR"]`
    - `os.getenv("VAR")`
    - Classes dérivées de `pydantic.BaseSettings` / `pydantic_settings.BaseSettings`.

### 2.2 Chargement et Résolution des Fichiers Env
- Recherche des fichiers `.env` et `.env.example` (ou `.env.template`).
- Support Monorepo :
  - Détection des packages/apps (ex: `packages/*/`, `apps/*/`, ou workspaces `package.json`).
  - Analyse par sous-projet ou globale selon la configuration.
- Respect strict du `.gitignore` et du `.envdiffignore` pour éviter de scanner des fichiers non suivis ou lourds.

### 2.3 Moteur d'Analyse (Analyzer)
Croisement des 3 sources (Code, `.env.example`, `.env`) :
1. **Manquantes** : Utilisées dans le code mais absentes de `.env.example` ➔ **Erreur bloquante en CI**.
2. **Inutilisées** : Déclarées dans `.env.example` mais jamais lues dans le code ➔ **Warning / Info**.
3. **Désynchronisées** : Présentes dans `.env.example` mais absentes du `.env` local (ou l'inverse) ➔ **Warning / Erreur configurable**.

### 2.4 Configuration (`.envdiffrc`) et Ignore (`.envdiffignore`)
- **`.envdiffrc`** : Fichier optionnel JSON/YAML/JS à la racine pour configurer les options globales :
  ```json
  {
    "strict": true,
    "envExamplePath": ".env.example",
    "envPath": ".env"
  }
  ```
- **`.envdiffignore`** : Fichier optionnel (similaire au `.gitignore`) permettant d'exclure des fichiers/dossiers additionnels ou d'ignorer des variables spécifiques (ex: `NODE_ENV`, `PORT`, ou motifs glob) de l'analyse.

---

## 3. Interfaces & Modes d'Exécution

### 3.1 CLI & Options
- `npx envdiff` : Lance l'analyse dans le répertoire courant.
- Options principales :
  - `--ci` : Active le mode CI (exit code `1` en cas d'erreur de cohérence).
  - `--json` : Retourne un rapport au format JSON exploitable par des scripts.
  - `--config <path>` : Spécifie un fichier de configuration personnalisé.
  - `--dir <path>` : Cible un répertoire spécifique.

### 3.2 Intégration CI (GitHub Action)
Création d'une action prête à l'emploi (`action.yml`) :
```yaml
name: 'EnvDiff Check'
description: 'Vérifie la cohérence des variables d''environnement'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
    - run: npx envdiff --ci
      shell: bash
```

---

## 4. Plan de Roadmap & Étapes

1. **Phase 1 : Core & Parsing JS/TS**
   - Initialisation du projet Node.js / TypeScript.
   - Implémentation du scanner AST JS/TS (`process.env`).
   - Implémentation du lecteur `.env` / `.env.example`.
2. **Phase 2 : Moteur d'analyse & Rapports**
   - Croisement des données (détection manquantes / inutilisées).
   - Formatage de sortie console coloré avec fichier et numéro de ligne.
3. **Phase 3 : Fonctionnalités Avancées**
   - Support Python (`os.environ`, `pydantic`).
   - Support Monorepo et `.gitignore`.
   - Configuration via `.envdiffrc`.
4. **Phase 4 : Mode CI & Packaging**
   - Option `--ci` avec gestion des exit codes.
   - Option `--json`.
   - Publication npm et documentation GitHub Action.
