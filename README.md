<div align="center">

<img src="https://raw.githubusercontent.com/OumarouSandaSouley/env-doctor/main/logo.png" width="128" alt="env-doctor logo" />

# env-doctor

**Check environment variables consistency before deployment.** Scan your code, cross-reference `.env` and `.env.example`, and catch missing, unused, or mismatched variables before they break production.

[![npm](https://img.shields.io/npm/v/env-doctor.svg?style=flat-square)](https://www.npmjs.com/package/@oumarou_sanda_souley/env-doctor)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg?style=flat-square)](#requirements)

</div>

---

## Why

Environment variables are a frequent source of silent bugs. A developer adds `STRIPE_KEY` in code but forgets `.env.example`, a colleague clones the repository and nothing works. A renamed variable leaves the old one lingering everywhere. A missing variable in production crashes the app at 2 AM. 

`env-doctor` bridges the gap between your codebase, your local `.env`, and your example file.

## Features

- **Code scanning** — finds all actually used variables across JS/TS (`process.env`, `import.meta.env`), Python (`os.environ`, `os.getenv`, pydantic), Next.js and Expo (`NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`)
- **Missing & Unused detection** — detects variables used in code but absent from `.env.example`, or declared in `.env.example` but never read
- **Desynchronization check** — flags discrepancies between local `.env` and `.env.example`
- **Auto-fix (`--fix`)** — automatically populates missing variables into `.env.example`
- **Security & format validation (`--security`)** — checks for weak/default values, validates URL formats for `_URL`/`_URI` variables, and enforces `UPPER_SNAKE_CASE` naming conventions
- **CI Mode (`--ci`)** — returns non-zero exit codes to block PRs when inconsistencies or security issues are found
- **GitHub PR reports (`--markdown`)** — generates markdown reports ready for PR comments
- **Monorepo & Ignore support** — full support for monorepos, `.gitignore`, and `.envdiffignore`

## Requirements

- Node.js **18+**

## Install

```bash
npm install -g @oumarou_sanda_souley/env-doctor
```

Or run without installing:

```bash
npx @oumarou_sanda_souley/env-doctor
```

## Quick start

```bash
# Run standard consistency check
npx @oumarou_sanda_souley/env-doctor

# Run in CI mode (blocks on errors)
npx @oumarou_sanda_souley/env-doctor --ci

# Automatically add missing variables to .env.example
npx @oumarou_sanda_souley/env-doctor --fix

# Enable security & format checks
npx @oumarou_sanda_souley/env-doctor --security

# Generate markdown report for PRs
npx @oumarou_sanda_souley/env-doctor --markdown
```

## Usage

```text
env-doctor [options]
```

### Options

| Flag | Description |
|------|-------------|
| `-d, --dir <path>` | Directory to scan (default: current directory) |
| `-c, --config <path>` | Path to custom config file (`.envdiffrc`) |
| `--env-file <path>` | Path to local `.env` file |
| `--env-example <path>` | Path to `.env.example` file |
| `--ci` | Run in CI mode (exits with code `1` on errors) |
| `--json` | Output report in JSON format |
| `--markdown [path]` | Generate Markdown report file (default: `envdiff-report.md`) |
| `--fix` | Automatically add missing variables to `.env.example` |
| `--security` | Enable security and format validation for `.env` values |
| `-h, --help` | Show help |
| `-V, --version` | Show version |

## Configuration

Optional JSON config (`.envdiffrc`) at the project root:

```json
{
  "envPath": ".env",
  "envExamplePath": ".env.example",
  "ignore": ["NODE_ENV", "PORT"],
  "strict": false
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `envPath` | `string` | `".env"` | Path to the local environment file |
| `envExamplePath` | `string` | `".env.example"` | Path to the environment example file |
| `ignore` | `string[]` | `[]` | Additional variables to ignore |
| `excludeDirs` | `string[]` | `[]` | Additional directories to exclude |
| `strict` | `boolean` | `false` | Treat warnings/code warnings as errors in CI |

### Ignoring Files, Folders & Variables

- **`.envdiffignore`** : Permet d'ignorer des fichiers, dossiers ou variables spécifiques lors de l'analyse (similaire au `.gitignore`).
- **`.gitignore`** : `env-doctor` respecte automatiquement vos règles `.gitignore` pour éviter de scanner les dossiers non suivis ou lourds (`node_modules`, `dist`, etc.).

## Project layout

```text
env-doctor/
├── bin/
│   └── env-doctor.js       # CLI entrypoint
├── src/
│   ├── index.ts            # Programmatic API
│   ├── cli.ts              # Commander entrypoint
│   ├── config.ts           # Config load + ignore rules
│   ├── env/
│   │   └── loader.ts       # .env and .env.example loader
│   ├── scanners/
│   │   ├── index.ts        # Directory walker & orchestrator
│   │   ├── js-ts.ts        # JS/TS/Next/Expo AST scanner
│   │   └── python.ts       # Python os.environ / pydantic scanner
│   ├── engine/
│   │   ├── analyzer.ts     # Consistency analysis engine
│   │   ├── fixer.ts        # Auto-fixer for .env.example
│   │   └── validator.ts    # Security & format validator
│   └── reporters/
│       ├── console.ts      # Colored terminal reporter
│       ├── json.ts         # JSON reporter
│       └── markdown.ts     # Markdown PR report generator
├── tests/
│   └── envdiff.test.ts     # Unit tests (vitest)
├── package.json
└── README.md
```

## Local development

```bash
git clone https://github.com/OumarouSandaSouley/env-doctor.git
cd env-doctor
npm install
npm run build
node bin/env-doctor.js --dir .
```

Useful scripts:

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript with tsup |
| `npm test` | Run unit tests with vitest |

## Contributing

Contributions are welcome. Please open an issue or pull request to discuss improvements.

1. Fork the repo and create a feature branch from `main`
2. Make your change
3. Run `npm run build` and `npm test`
4. Open a pull request

## License

[MIT](LICENSE) © the env-doctor contributors
