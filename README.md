# EBLON BIBLIOTHÈQUE

Fondation locale Next.js, React, TypeScript strict et PostgreSQL, portable vers AWS.

## Prérequis

- Windows 10/11
- Node.js 22 LTS (installer sur `D:` si nécessaire)
- pnpm 11.7.0
- Docker Desktop avec ses données déplacées sur `D:` si l'espace disque l'exige

## Démarrage local

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:verify
pnpm dev
```

Ouvrir <http://localhost:3000>. La route <http://localhost:3000/api/health> renvoie l'état de l'application, de PostgreSQL et de la migration, sans secret.

## Configuration

Modifier `.env` (jamais versionné) :

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- `DATABASE_URL`, URL PostgreSQL locale
- `DATABASE_SCHEMA`, par défaut `eblon_bibliotheque`
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
- `TRUSTED_ORIGINS`, origines autorisées séparées par des virgules
- `RESEND_API_KEY`, `EMAIL_FROM` si l'envoi d'e-mails est utilisé

## Commandes de qualité

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Les migrations sont explicites et versionnées dans `migrations/`. Aucune table n'est créée automatiquement au démarrage. La première migration crée uniquement le schéma configuré et la table technique `foundation_status`.

Les commandes `pnpm db:migrate` et `pnpm db:verify` chargent automatiquement le fichier `.env`. Les métadonnées de migration sont isolées dans `<DATABASE_SCHEMA>.pgmigrations`, soit `eblon_bibliotheque.pgmigrations` avec la configuration par défaut.

## Arrêt

```powershell
docker compose down
```

Ajouter `-v` uniquement pour supprimer volontairement les données PostgreSQL locales.

## Incidents courants

- **Port 5432 occupé** : modifier `POSTGRES_PORT` et le port de `DATABASE_URL`.
- **Base indisponible** : vérifier `docker compose ps` et `docker compose logs postgres`.
- **Migration absente** : exécuter `pnpm db:migrate`, puis `pnpm db:verify`.
- **Variables invalides** : comparer `.env` avec `.env.example` sans copier de secret dans Git.
- **Docker absent** : installer Docker Desktop sur `D:` puis relancer les commandes Docker.

## Architecture progressive

- `app/` : routes et interface Next.js existantes
- `components/ui/` : composants UI génériques
- `components/` : composants partagés et écrans existants
- `config/` : validation de configuration
- `lib/` : services techniques et accès aux données existants
- `migrations/` : migrations PostgreSQL versionnées
- `scripts/` : vérifications techniques
- `tests/` : tests minimaux

Le prototype métier existant est conservé. Sa réorganisation progressive vers `features/`, `domain/` et `types/` se fera avec les développements métier futurs afin d'éviter une refonte risquée à ce stade.
