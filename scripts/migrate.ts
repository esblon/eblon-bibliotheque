import { runner } from "node-pg-migrate"
import { Client } from "pg"
import { parseServerEnvironment } from "../config/env"

const OLD_TABLE = "pgmigrations"
const MIGRATIONS_TABLE = "migrations_eblon_bibliotheque"

async function preserveMigrationHistory(databaseUrl: string, schema: string) {
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const result = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = ANY($2::text[])`,
      [schema, [OLD_TABLE, MIGRATIONS_TABLE]],
    )
    const tables = new Set(result.rows.map(({ table_name }) => table_name))
    if (tables.has(OLD_TABLE) && tables.has(MIGRATIONS_TABLE)) {
      throw new Error("Les deux tables de migrations existent; migration interrompue pour proteger l'historique")
    }
    if (tables.has(OLD_TABLE)) {
      const quotedSchema = `"${schema}"`
      await client.query("BEGIN")
      await client.query(
        `ALTER TABLE ${quotedSchema}."${OLD_TABLE}" RENAME TO "${MIGRATIONS_TABLE}"`,
      )
      await client.query(
        `ALTER TABLE ${quotedSchema}."${MIGRATIONS_TABLE}"
         RENAME CONSTRAINT pgmigrations_pkey TO pk_migrations_eblon_bibliotheque`,
      )
      await client.query("COMMIT")
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

async function main() {
  const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()

  await preserveMigrationHistory(DATABASE_URL, DATABASE_SCHEMA)

  await runner({
    databaseUrl: DATABASE_URL,
    direction: "up",
    dir: "migrations",
    migrationsTable: MIGRATIONS_TABLE,
    migrationsSchema: DATABASE_SCHEMA,
    createMigrationsSchema: true,
    checkOrder: true,
  })
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Database migration failed",
  )
  process.exitCode = 1
})
