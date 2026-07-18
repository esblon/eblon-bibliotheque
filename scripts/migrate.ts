import { runner } from "node-pg-migrate"
import { parseServerEnvironment } from "../config/env"

async function main() {
  const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()

  await runner({
    databaseUrl: DATABASE_URL,
    direction: "up",
    dir: "migrations",
    migrationsTable: "pgmigrations",
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
