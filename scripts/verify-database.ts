import { Client } from "pg"
import { parseServerEnvironment } from "../config/env"

const TABLES_METIER = [
  "matieres", "niveaux_scolaires", "ouvrages", "exemplaires",
  "emprunteurs", "agents", "emprunts", "evenements_emprunt",
] as const
const ANCIENNES_TABLES = [
  "subjects", "education_levels", "books", "book_copies",
  "borrowers", "staff_members", "loans", "loan_events", "foundation_status",
] as const
const COLONNES_ANGLAISES = [
  "name", "is_active", "created_at", "updated_at", "title", "subtitle",
  "publisher", "publication_year", "subject_id", "education_level_id",
  "cover_image_key", "book_id", "inventory_code", "qr_code", "status",
  "acquisition_date", "acquisition_price", "currency", "notes",
  "borrower_number", "first_name", "last_name", "phone", "class_name",
  "school_name", "external_auth_id", "book_copy_id", "borrower_id",
  "issued_by_staff_id", "returned_to_staff_id", "loaned_at", "due_at",
  "returned_at", "return_condition", "loan_id", "event_type",
  "performed_by_staff_id", "event_at", "migrated_at",
] as const

async function main() {
  const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()
  const client = new Client({ connectionString: DATABASE_URL })
  const schema = `"${DATABASE_SCHEMA}"`
  try {
    await client.connect()
    const schemaExists = await client.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) AS exists",
      [DATABASE_SCHEMA],
    )
    if (!schemaExists.rows[0]?.exists) throw new Error(`Schéma ${DATABASE_SCHEMA} absent`)

    const tableResult = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE'`,
      [DATABASE_SCHEMA],
    )
    const tables = new Set(tableResult.rows.map(({ table_name }) => table_name))
    const manquantes = [...TABLES_METIER, "statut_fondation", "migrations_eblon_bibliotheque", "parametres_application", "invitations_agents"].filter((t) => !tables.has(t))
    const anciennes = ANCIENNES_TABLES.filter((t) => tables.has(t))
    if (manquantes.length) throw new Error(`Tables manquantes: ${manquantes.join(", ")}`)
    if (anciennes.length) throw new Error(`Anciennes tables restantes: ${anciennes.join(", ")}`)

    const migrations = await client.query<{ name: string; occurrences: number }>(
      `SELECT name, count(*)::int AS occurrences FROM ${schema}.migrations_eblon_bibliotheque GROUP BY name ORDER BY name`,
    )
    if (migrations.rows.length !== 8 || migrations.rows.some(({ occurrences }) => occurrences !== 1) ||
        migrations.rows.at(-1)?.name !== "000008_acces_eleves_invitations_agents") {
      throw new Error("Historique des migrations incohérent")
    }

    const authTables = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name=ANY($2::text[])`,
      [DATABASE_SCHEMA, ["user", "session", "account", "verification"]],
    )
    if (authTables.rowCount !== 4) throw new Error("Tables Better Auth manquantes")

    const englishColumns = await client.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = ANY($2::text[]) AND column_name = ANY($3::text[])`,
      [DATABASE_SCHEMA, TABLES_METIER, COLONNES_ANGLAISES],
    )
    if (englishColumns.rowCount) throw new Error("Colonnes métier anglaises restantes")

    const englishObjects = await client.query<{ name: string }>(
      `SELECT conname AS name FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
       WHERE n.nspname=$1 AND conname ~ '(subjects|education_levels|books|book_copies|borrowers|staff_members|loans|loan_events)'
       UNION ALL
       SELECT indexname FROM pg_indexes WHERE schemaname=$1
       AND indexname ~ '(subjects|education_levels|books|book_copies|borrowers|staff_members|loans|loan_events)'`,
      [DATABASE_SCHEMA],
    )
    if (englishObjects.rowCount) throw new Error(`Objets métier anglais restants: ${englishObjects.rows.map(({ name }) => name).join(", ")}`)

    const seed = await client.query<{ matieres: number; niveaux: number; ouvrages: number; exemplaires: number; emprunteurs: number; agents: number }>(`
      SELECT
        (SELECT count(*)::int FROM ${schema}.matieres WHERE id::text LIKE '10000000-%') matieres,
        (SELECT count(*)::int FROM ${schema}.niveaux_scolaires WHERE id::text LIKE '20000000-%') niveaux,
        (SELECT count(*)::int FROM ${schema}.ouvrages WHERE id::text LIKE '30000000-%') ouvrages,
        (SELECT count(*)::int FROM ${schema}.exemplaires WHERE id::text LIKE '40000000-%') exemplaires,
        (SELECT count(*)::int FROM ${schema}.emprunteurs WHERE id::text LIKE '50000000-%') emprunteurs,
        (SELECT count(*)::int FROM ${schema}.agents WHERE id::text LIKE '60000000-%') agents`)
    const d = seed.rows[0]
    if (!d || d.matieres < 6 || d.niveaux < 4 || d.ouvrages < 3 || d.exemplaires < 4 || d.emprunteurs < 2 || d.agents < 1) {
      throw new Error("Données de seed incomplètes")
    }

    const brokenRelations = await client.query<{ count: number }>(`
      SELECT count(*)::int AS count FROM ${schema}.exemplaires e LEFT JOIN ${schema}.ouvrages o ON o.id=e.ouvrage_id WHERE o.id IS NULL
      UNION ALL SELECT count(*)::int FROM ${schema}.ouvrages o LEFT JOIN ${schema}.matieres m ON m.id=o.matiere_id WHERE m.id IS NULL
      UNION ALL SELECT count(*)::int FROM ${schema}.ouvrages o LEFT JOIN ${schema}.niveaux_scolaires n ON n.id=o.niveau_scolaire_id WHERE o.niveau_scolaire_id IS NOT NULL AND n.id IS NULL`)
    if (brokenRelations.rows.some(({ count }) => count !== 0)) throw new Error("Relations orphelines détectées")

    const publicTables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])`,
      [[...TABLES_METIER, ...ANCIENNES_TABLES, "user", "session", "account", "verification"]],
    )
    if (publicTables.rowCount) throw new Error("Tables métier présentes dans public")
    console.log("Vérification PostgreSQL: OK (modèle français, authentification, 8 migrations uniques, seed cohérent, relations intactes)")
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Échec de la vérification PostgreSQL")
  process.exitCode = 1
})
