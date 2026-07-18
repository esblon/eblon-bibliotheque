import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { ErreurApi } from "./erreurs"

export type RoleAgent = "ADMIN" | "ENSEIGNANT" | "BIBLIOTHECAIRE" | "LECTEUR"
export type IdentiteApi = { agent_id: string; role: RoleAgent; email: string }
export function roleAutorise(role: RoleAgent, roles?: RoleAgent[]) { return !roles || roles.includes(role) }

export async function exigerIdentite(roles?: RoleAgent[]): Promise<IdentiteApi> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.email) throw new ErreurApi("NON_AUTHENTIFIE", "Authentification requise", 401)
  const { DATABASE_SCHEMA } = parseServerEnvironment()
  const result = await pool.query<IdentiteApi>(
    `SELECT id AS agent_id, role, email FROM "${DATABASE_SCHEMA}".agents WHERE lower(email)=lower($1) AND statut='ACTIF'`, [session.user.email],
  )
  const identite = result.rows[0]
  if (!identite || !roleAutorise(identite.role, roles)) throw new ErreurApi("ACCES_INTERDIT", "Accès interdit", 403)
  return identite
}
