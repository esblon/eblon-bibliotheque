import { Client } from "pg"
import { parseServerEnvironment } from "../config/env"
import { auth } from "../lib/auth"

async function main() {
  const { DATABASE_URL, DATABASE_SCHEMA } = parseServerEnvironment()
  const base = process.env.BETTER_AUTH_URL
  const secret = process.env.BETTER_AUTH_SECRET
  const origins = process.env.TRUSTED_ORIGINS?.split(",").map((v) => v.trim()) ?? []
  if (base !== "http://localhost:3000") throw new Error("BETTER_AUTH_URL doit être http://localhost:3000 en local")
  if (!secret || secret.length < 32 || secret.startsWith("replace-with")) throw new Error("BETTER_AUTH_SECRET local absent ou fictif")
  if (!origins.includes("http://localhost:3000")) throw new Error("TRUSTED_ORIGINS doit contenir http://localhost:3000")

  const client = new Client({ connectionString: DATABASE_URL, options: `-c search_path=${DATABASE_SCHEMA}` })
  try {
    await client.connect()
    const path = await client.query<{ search_path: string }>("SHOW search_path")
    if (!path.rows[0]?.search_path.startsWith(DATABASE_SCHEMA)) throw new Error("search_path Better Auth incorrect")
    const required: Record<string, string[]> = {
      user: ["id","name","email","emailVerified","role","statut"], session: ["id","token","userId","expiresAt"],
      account: ["id","accountId","providerId","userId","password"], verification: ["id","identifier","value","expiresAt"],
    }
    for (const [table, columns] of Object.entries(required)) {
      const r = await client.query<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`, [DATABASE_SCHEMA, table])
      const found = new Set(r.rows.map(({ column_name }) => column_name))
      const missing = columns.filter((column) => !found.has(column)); if (missing.length) throw new Error(`Colonnes manquantes dans ${table}: ${missing.join(", ")}`)
    }
    const publicAuth = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])`, [Object.keys(required)])
    if (publicAuth.rowCount) throw new Error("Tables Better Auth présentes dans public")
    const associations = await client.query<{ orphelins: number; doubles: number }>(`
      SELECT
        count(*) FILTER (WHERE a.id IS NULL AND e.id IS NULL)::int AS orphelins,
        count(*) FILTER (WHERE a.id IS NOT NULL AND e.id IS NOT NULL)::int AS doubles
      FROM "${DATABASE_SCHEMA}"."user" u
      LEFT JOIN "${DATABASE_SCHEMA}".agents a ON a.identifiant_auth_externe = u.id
      LEFT JOIN "${DATABASE_SCHEMA}".emprunteurs e ON e.identifiant_auth_externe = u.id
    `)
    const { orphelins = 0, doubles = 0 } = associations.rows[0] ?? {}
    if (orphelins > 0) throw new Error(`${orphelins} utilisateur(s) Better Auth sans agent ni emprunteur associé`)
    if (doubles > 0) throw new Error(`${doubles} utilisateur(s) Better Auth associé(s) à la fois à un agent et à un emprunteur`)
    const session = await auth.api.getSession({ headers: new Headers() })
    if (session !== null) throw new Error("Lecture anonyme de session incohérente")
    console.log("Vérification Better Auth: OK (configuration, search_path, tables, session et identités agent/élève cohérentes)")
  } finally { await client.end() }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Échec de la vérification Better Auth"); process.exitCode = 1 })
