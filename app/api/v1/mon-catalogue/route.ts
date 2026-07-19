import { exigerEmprunteur } from "@/lib/api/authentification-eleve"
import { reponseErreur, succes } from "@/lib/api/reponses"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
export async function GET(){try{const e=await exigerEmprunteur();const s=parseServerEnvironment().DATABASE_SCHEMA;const profil=(await pool.query(`SELECT niveau_scolaire_id FROM "${s}".emprunteurs WHERE id=$1`,[e.emprunteur_id])).rows[0];return succes((await pool.query(`SELECT o.id,o.titre,o.sous_titre,o.niveau_scolaire_id,n.nom niveau_nom,count(x.id) FILTER(WHERE x.statut='DISPONIBLE')::int disponibles FROM "${s}".ouvrages o LEFT JOIN "${s}".niveaux_scolaires n ON n.id=o.niveau_scolaire_id LEFT JOIN "${s}".exemplaires x ON x.ouvrage_id=o.id WHERE o.est_actif AND (o.niveau_scolaire_id=$1 OR o.niveau_scolaire_id IS NULL) GROUP BY o.id,n.nom ORDER BY o.titre`,[profil.niveau_scolaire_id])).rows)}catch(e){return reponseErreur(e)}}
