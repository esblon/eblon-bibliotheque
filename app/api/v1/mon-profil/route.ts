import { exigerEmprunteur } from "@/lib/api/authentification-eleve"
import { reponseErreur, succes } from "@/lib/api/reponses"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
export async function GET(){try{const e=await exigerEmprunteur();const s=parseServerEnvironment().DATABASE_SCHEMA;return succes((await pool.query(`SELECT id,numero_emprunteur,prenom,nom,email,niveau_scolaire_id,classe,etablissement,statut FROM "${s}".emprunteurs WHERE id=$1`,[e.emprunteur_id])).rows[0])}catch(e){return reponseErreur(e)}}
