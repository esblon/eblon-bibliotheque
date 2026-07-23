import "server-only"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import type { ClasseInscription, EtablissementInscription, NiveauInscription } from "@/lib/referentiels-inscription"

const schema=()=>`"${parseServerEnvironment().DATABASE_SCHEMA}"`
export async function listerReferentielsInscription(){
 const [classes,etablissements]=await Promise.all([
  pool.query<ClasseInscription&{niveau_code:string;niveau_nom:string}>(`SELECT c.id,c.niveau_scolaire_id,c.nom,n.code niveau_code,n.nom niveau_nom FROM ${schema()}.classes_scolaires c JOIN ${schema()}.niveaux_scolaires n ON n.id=c.niveau_scolaire_id WHERE c.est_active AND n.est_actif ORDER BY n.code,c.ordre,c.nom`),
  pool.query<EtablissementInscription>(`SELECT id,nom,type_etablissement FROM ${schema()}.etablissements WHERE est_actif ORDER BY nom`),
 ])
 const niveaux=new Map<string,NiveauInscription>()
 for(const classe of classes.rows){if(!niveaux.has(classe.niveau_scolaire_id))niveaux.set(classe.niveau_scolaire_id,{id:classe.niveau_scolaire_id,code:classe.niveau_code,nom:classe.niveau_nom,classes:[]});niveaux.get(classe.niveau_scolaire_id)?.classes.push({id:classe.id,niveau_scolaire_id:classe.niveau_scolaire_id,nom:classe.nom})}
 return{niveaux:[...niveaux.values()],etablissements:etablissements.rows}
}
export async function obtenirEspaceEleve(){const session=await auth.api.getSession({headers:await headers()});if(!session?.user)return null;const profil=(await pool.query(`SELECT e.*,n.nom niveau_nom FROM ${schema()}.emprunteurs e LEFT JOIN ${schema()}.niveaux_scolaires n ON n.id=e.niveau_scolaire_id WHERE e.identifiant_auth_externe=$1`,[session.user.id])).rows[0];if(!profil)return null;const emprunts=(await pool.query(`SELECT p.*,x.code_inventaire,o.titre FROM ${schema()}.emprunts p JOIN ${schema()}.exemplaires x ON x.id=p.exemplaire_id JOIN ${schema()}.ouvrages o ON o.id=x.ouvrage_id WHERE p.emprunteur_id=$1 ORDER BY p.date_emprunt DESC`,[profil.id])).rows;const catalogue=(await pool.query(`SELECT o.id,o.titre,o.sous_titre,o.niveau_scolaire_id,n.nom niveau_nom,count(x.id) FILTER(WHERE x.statut='DISPONIBLE')::int disponibles FROM ${schema()}.ouvrages o LEFT JOIN ${schema()}.niveaux_scolaires n ON n.id=o.niveau_scolaire_id LEFT JOIN ${schema()}.exemplaires x ON x.ouvrage_id=o.id WHERE o.est_actif AND (o.niveau_scolaire_id=$1 OR o.niveau_scolaire_id IS NULL) GROUP BY o.id,n.nom ORDER BY o.titre`,[profil.niveau_scolaire_id])).rows;return{profil,emprunts,catalogue}}
