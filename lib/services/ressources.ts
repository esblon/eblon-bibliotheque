import { ErreurApi } from "@/lib/api/erreurs"
import { listerRessources, trouverRessource, creerRessource, modifierRessource } from "@/lib/repositories/ressources"
import { transitionsExemplaire, type NomRessource } from "@/lib/validation/ressources"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { transitionStatutEtablissementAutorisee } from "@/lib/statuts-etablissements"

export { listerRessources }
export async function obtenirRessource(nom: NomRessource, id: string) {
  if (nom === "ouvrages") {
    const schema = `"${parseServerEnvironment().DATABASE_SCHEMA}"`
    const detail = await pool.query(`SELECT o.*,to_jsonb(m.*) matiere,to_jsonb(n.*) niveau_scolaire,to_jsonb(t.*) type_ouvrage,
      count(e.id)::int nombre_total_exemplaires,
      count(e.id) FILTER (WHERE e.statut='DISPONIBLE')::int nombre_exemplaires_disponibles,
      count(e.id) FILTER (WHERE e.statut='EMPRUNTE')::int nombre_exemplaires_empruntes
      FROM ${schema}.ouvrages o JOIN ${schema}.matieres m ON m.id=o.matiere_id
      LEFT JOIN ${schema}.niveaux_scolaires n ON n.id=o.niveau_scolaire_id
      JOIN ${schema}.types_ouvrages t ON t.id=o.type_ouvrage_id
      LEFT JOIN ${schema}.exemplaires e ON e.ouvrage_id=o.id WHERE o.id=$1 GROUP BY o.id,m.id,n.id,t.id`, [id])
    if (detail.rows[0]) return detail.rows[0]
  }
  const r = await trouverRessource(nom, id); if (!r) throw new ErreurApi("RESSOURCE_INTROUVABLE", "Ressource introuvable", 404); return r
}
export async function creer(nom: NomRessource, donnees: Record<string, unknown>) { return creerRessource(nom, donnees) }
export async function modifier(nom: NomRessource, id: string, donnees: Record<string, unknown>) {
  const actuelle = await obtenirRessource(nom, id)
  if (nom === "exemplaires" && donnees.statut && donnees.statut !== actuelle.statut) {
    const cible = String(donnees.statut), permis = transitionsExemplaire[String(actuelle.statut)]?.includes(cible)
    const schema = `"${parseServerEnvironment().DATABASE_SCHEMA}"`
    const actif = await pool.query(`SELECT 1 FROM ${schema}.emprunts WHERE exemplaire_id=$1 AND statut IN ('ACTIF','EN_RETARD')`, [id])
    if (!permis || cible === "EMPRUNTE" || (cible === "DISPONIBLE" && actif.rowCount)) throw new ErreurApi("TRANSITION_STATUT_INTERDITE", "Transition de statut interdite", 409)
  }
  if (nom === "etablissements" && donnees.statut && donnees.statut !== actuelle.statut &&
      !transitionStatutEtablissementAutorisee(String(actuelle.statut), String(donnees.statut))) {
    throw new ErreurApi("TRANSITION_STATUT_INTERDITE", "Transition de statut d’établissement interdite", 409)
  }
  const r = await modifierRessource(nom, id, donnees); if (!r) throw new ErreurApi("RESSOURCE_INTROUVABLE", "Ressource introuvable", 404); return r
}
