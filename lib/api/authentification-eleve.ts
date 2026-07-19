import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { ErreurApi } from "./erreurs"
export async function exigerEmprunteur(){const session=await auth.api.getSession({headers:await headers()});if(!session?.user)throw new ErreurApi("NON_AUTHENTIFIE","Authentification requise",401);const s=parseServerEnvironment().DATABASE_SCHEMA;const r=await pool.query<{emprunteur_id:string;statut:string}>(`SELECT id emprunteur_id,statut FROM "${s}".emprunteurs WHERE identifiant_auth_externe=$1`,[session.user.id]);const e=r.rows[0];if(!e)throw new ErreurApi("ACCES_INTERDIT","Espace élève inaccessible",403);return e}
