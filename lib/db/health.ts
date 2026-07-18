import { parseServerEnvironment } from "@/config/env"
import { pool } from "@/lib/db"

export async function checkDatabase(): Promise<boolean> {
  const { DATABASE_SCHEMA } = parseServerEnvironment()
  const result = await pool.query<{ migrated: boolean }>(
    "select exists(select 1 from information_schema.tables where table_schema = $1 and table_name = 'statut_fondation') as migrated",
    [DATABASE_SCHEMA],
  )
  return result.rows[0]?.migrated === true
}
