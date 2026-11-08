<p align="center">
  <img src="./logo.png" width="120" alt="envdiff logo" />
</p>

# envdiff 🔍

`envdiff` est un outil en ligne de commande open-source qui vérifie la cohérence des variables d’environnement d’un projet en croisant le code source, `.env` et `.env.example`.

## Installation & Utilisation

```bash
npx envdiff
```

## Options CLI

- `-d, --dir <path>` : Répertoire à scanner (défaut : répertoire courant)
- `-c, --config <path>` : Chemin vers un fichier de configuration personnalisé (`.envdiffrc`)
- `--env-file <path>` : Chemin vers le fichier `.env` local (support multi-environnements)
- `--env-example <path>` : Chemin vers le fichier `.env.example`
- `--ci` : Mode CI (renvoie un code d'erreur `1` en cas d'incohérence ou d'erreur de sécurité)
- `--json` : Sortie du rapport au format JSON
- `--markdown [path]` : Génère un fichier de rapport au format Markdown (par défaut : `envdiff-report.md`, idéal pour les commentaires de PR GitHub)
- `--fix` : Ajoute automatiquement les variables manquantes détectées dans le code au fichier `.env.example`
- `--security` : Active la validation de sécurité et de format des valeurs du `.env` (détection de valeurs faibles, formats d'URL, et conventions `UPPER_SNAKE_CASE`)

## Fichiers de Configuration & Ignore

- **`.envdiffrc`** : Configuration globale optionnelle.
- **`.envdiffignore`** / **`.gitignore`** : Permet d'ignorer des fichiers, dossiers ou variables spécifiques lors de l'analyse.
