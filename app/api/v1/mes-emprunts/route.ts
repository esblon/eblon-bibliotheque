import { exigerEmprunteur } from "@/lib/api/authentification-eleve"
import { reponseErreur, succes } from "@/lib/api/reponses"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
export async function GET(){try{const e=await exigerEmprunteur();const s=parseServerEnvironment().DATABASE_SCHEMA;return succes((await pool.query(`SELECT p.*,x.code_inventaire,o.titre FROM "${s}".emprunts p JOIN "${s}".exemplaires x ON x.id=p.exemplaire_id JOIN "${s}".ouvrages o ON o.id=x.ouvrage_id WHERE p.emprunteur_id=$1 ORDER BY p.date_emprunt DESC`,[e.emprunteur_id])).rows)}catch(e){return reponseErreur(e)}}
