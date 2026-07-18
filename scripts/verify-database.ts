import { Client } from "pg"
import { parseServerEnvironment } from "../config/env"

async function main() {
  const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()
  const client = new Client({ connectionString: DATABASE_URL })
  try {
    await client.connect()
    const result = await client.query<{ migrated: boolean }>(
      "select exists(select 1 from information_schema.tables where table_schema = $1 and table_name = 'foundation_status') as migrated",
      [DATABASE_SCHEMA],
    )
    if (!result.rows[0]?.migrated) throw new Error("Foundation migration is missing")
    console.log("Database connection and foundation migration: OK")
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Database verification failed")
  process.exitCode = 1
})
