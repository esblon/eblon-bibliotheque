import { randomUUID } from "node:crypto"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import type { NomRessource } from "@/lib/validation/ressources"
import type { Pagination } from "@/lib/api/pagination"

type Configuration = { recherche: string[]; tri: string[]; filtres: string[] }
export const configurations: Record<NomRessource, Configuration> = {
  matieres: { recherche: ["code","nom"], tri: ["code","nom","date_creation"], filtres: ["est_active"] },
  niveaux_scolaires: { recherche: ["code","nom"], tri: ["code","nom","date_creation"], filtres: ["est_actif"] },
  classes_scolaires: { recherche: ["code","nom"], tri: ["ordre","code","nom"], filtres: ["niveau_scolaire_id","est_active"] },
  etablissements: { recherche: ["code","nom","type_etablissement"], tri: ["nom","code","type_etablissement"], filtres: ["type_etablissement","est_actif"] },
  roles_agents: { recherche: ["code","nom","description"], tri: ["code","nom"], filtres: ["est_actif"] },
  ouvrages: { recherche: ["titre","isbn"], tri: ["titre","annee_publication","date_creation"], filtres: ["matiere_id","niveau_scolaire_id","isbn","est_actif"] },
  exemplaires: { recherche: ["code_inventaire","code_qr"], tri: ["code_inventaire","statut","date_creation"], filtres: ["ouvrage_id","code_inventaire","code_qr","statut"] },
  emprunteurs: { recherche: ["numero_emprunteur","nom","prenom","classe","etablissement"], tri: ["nom","prenom","numero_emprunteur","date_creation"], filtres: ["numero_emprunteur","nom","prenom","classe","etablissement","niveau_scolaire_id","statut"] },
  agents: { recherche: ["nom","prenom","email"], tri: ["nom","prenom","email","date_creation"], filtres: ["role","statut"] },
}
const schema = () => `"${parseServerEnvironment().DATABASE_SCHEMA}"`

export async function listerRessources(nom: NomRessource, pagination: Pagination, params: URLSearchParams) {
  const config = configurations[nom]; const valeurs: unknown[] = []; const conditions: string[] = []
  if (pagination.recherche) { valeurs.push(`%${pagination.recherche}%`); conditions.push(`(${config.recherche.map((c) => `${c} ILIKE $${valeurs.length}`).join(" OR ")})`) }
  for (const filtre of config.filtres) { const valeur = params.get(filtre); if (valeur !== null) { valeurs.push(valeur); conditions.push(`${filtre}::text = $${valeurs.length}`) } }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const tri = pagination.tri && config.tri.includes(pagination.tri) ? pagination.tri : config.tri[0]
  const total = await pool.query<{ total: number }>(`SELECT count(*)::int total FROM ${schema()}.${nom} ${where}`, valeurs)
  valeurs.push(pagination.limite, (pagination.page - 1) * pagination.limite)
  const rows = await pool.query(`SELECT * FROM ${schema()}.${nom} ${where} ORDER BY ${tri} ${pagination.ordre === "desc" ? "DESC" : "ASC"} LIMIT $${valeurs.length - 1} OFFSET $${valeurs.length}`, valeurs)
  return { donnees: rows.rows, total: total.rows[0]?.total ?? 0 }
}
export async function trouverRessource(nom: NomRessource, id: string) { return (await pool.query(`SELECT * FROM ${schema()}.${nom} WHERE id=$1`, [id])).rows[0] }
export async function creerRessource(nom: NomRessource, donnees: Record<string, unknown>) {
  const id = randomUUID(), colonnes = Object.keys(donnees), valeurs = Object.values(donnees)
  return (await pool.query(`INSERT INTO ${schema()}.${nom} (id,${colonnes.join(",")}) VALUES ($1,${colonnes.map((_, i) => `$${i + 2}`).join(",")}) RETURNING *`, [id, ...valeurs])).rows[0]
}
export async function modifierRessource(nom: NomRessource, id: string, donnees: Record<string, unknown>) {
  const colonnes = Object.keys(donnees), valeurs = Object.values(donnees)
  return (await pool.query(`UPDATE ${schema()}.${nom} SET ${colonnes.map((c, i) => `${c}=$${i + 2}`).join(",")},date_modification=current_timestamp WHERE id=$1 RETURNING *`, [id, ...valeurs])).rows[0]
}
