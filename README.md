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

Les migrations sont explicites et versionnées dans `migrations/`. Aucune table n'est créée automatiquement au démarrage. La table technique initiale est désormais nommée `statut_fondation`.

Les commandes `pnpm db:migrate` et `pnpm db:verify` chargent automatiquement le fichier `.env`. Les métadonnées sont isolées dans `<DATABASE_SCHEMA>.migrations_eblon_bibliotheque`. Le lanceur renomme de manière transactionnelle l'ancienne table `pgmigrations` lorsqu'elle existe et refuse de poursuivre si deux historiques concurrents sont détectés.

## Modèle métier PostgreSQL

Toutes les tables métier utilisent des UUID et appartiennent au schéma défini par `DATABASE_SCHEMA`. Les identifiants PostgreSQL applicatifs sont en français, ASCII et `snake_case`. Le modèle distingue l'ouvrage intellectuel (`ouvrages`) de chaque exemplaire physique (`exemplaires`). Les événements de prêt sont conservés dans un journal immuable.

```text
matieres ────────────────┐
                         ├── ouvrages ── exemplaires ── emprunts ── evenements_emprunt
niveaux_scolaires ───────┘                              │             │
        │                                               │             │
        └── emprunteurs ────────────────────────────────┘             │
                                                                      │
agents ── agent_preteur / agent_recepteur / agent_id ─────────────────┘
```

Tables métier :

- `matieres` et `niveaux_scolaires` : référentiels configurables ;
- `ouvrages` : descriptions bibliographiques ;
- `exemplaires` : inventaire physique, QR codes et états ;
- `emprunteurs` : élèves et autres emprunteurs ;
- `agents` : responsables, sans mot de passe local ;
- `emprunts` : prêts actifs et historique des retours ;
- `evenements_emprunt` : journal append-only des événements.

Correspondance de la migration `000004_renommage_modele_francais` :

| Ancien nom | Nouveau nom |
|---|---|
| `subjects` | `matieres` |
| `education_levels` | `niveaux_scolaires` |
| `books` | `ouvrages` |
| `book_copies` | `exemplaires` |
| `borrowers` | `emprunteurs` |
| `staff_members` | `agents` |
| `loans` | `emprunts` |
| `loan_events` | `evenements_emprunt` |
| `foundation_status` | `statut_fondation` |

Valeurs métier : exemplaires `PREVU`, `ACHETE`, `A_ETIQUETER`, `ETIQUETE`, `DISPONIBLE`, `EMPRUNTE`, `PERDU`, `ABIME`, `RETIRE` ; emprunteurs `ACTIF`, `SUSPENDU`, `ARCHIVE` ; agents `ACTIF`, `DESACTIVE` et rôles `ADMIN`, `ENSEIGNANT`, `BIBLIOTHECAIRE`, `LECTEUR` ; emprunts `ACTIF`, `RETOURNE`, `EN_RETARD`, `PERDU`, `ANNULE` ; événements `CREE`, `PROLONGE`, `RETOURNE`, `MARQUE_EN_RETARD`, `MARQUE_PERDU`, `ANNULE`, `NOTE_AJOUTEE`.

Les migrations `000001` à `000003`, déjà exécutées, sont immuables. Le retour arrière de la migration de renommage doit être testé sur une sauvegarde ou un schéma temporaire, puis exécuté explicitement depuis la racine du dépôt :

```powershell
pnpm exec node-pg-migrate down --envPath .env --migrations-dir migrations `
  --migrations-table migrations_eblon_bibliotheque `
  --migrations-schema eblon_bibliotheque --schema eblon_bibliotheque `
  --migration-file-language ts
```

Cette commande revient d'une seule migration. Vérifier `DATABASE_SCHEMA` avant toute exécution et ne jamais modifier un ancien fichier de migration pour simuler un rollback.

Commandes de base de données :

```powershell
pnpm db:migrate
pnpm db:seed
pnpm db:tables
pnpm db:verify
pnpm test
```

Le seed contient uniquement des données fictives préfixées `DEV-` et peut être relancé sans créer de doublons. Les tests d'intégration PostgreSQL utilisent des transactions annulées après chaque test et ne modifient pas les données locales existantes.

## Réinitialisation locale contrôlée

Pour appliquer normalement les nouvelles migrations sans perdre les données :

```powershell
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm db:verify
```

Pour recréer volontairement une base de développement vide :

```powershell
docker compose down -v
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm db:verify
```

**Attention : `docker compose down -v` supprime définitivement le volume PostgreSQL local et toutes ses données. Ne jamais utiliser cette commande pour un environnement contenant des données à conserver.**

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
