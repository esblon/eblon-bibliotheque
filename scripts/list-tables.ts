import { Client } from "pg"
import { parseServerEnvironment } from "../config/env"

async function main() {
  const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    const result = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [DATABASE_SCHEMA],
    )
    console.log(result.rows.map((row) => row.table_name).join("\n"))
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Table listing failed")
  process.exitCode = 1
})
