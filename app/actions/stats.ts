"use server"

import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { requireUser } from "@/lib/session"

const schema = () => `"${parseServerEnvironment().DATABASE_SCHEMA}"`

export async function getDashboardStats() {
  await requireUser()
  const s = schema()
  const result = await pool.query<{
    total_livres: number; disponibles: number; empruntes: number; perdus: number; abimes: number
    emprunts_en_cours: number; retards: number; total_eleves: number
  }>(`SELECT
    (SELECT count(*)::int FROM ${s}.exemplaires WHERE statut <> 'RETIRE') total_livres,
    (SELECT count(*)::int FROM ${s}.exemplaires WHERE statut = 'DISPONIBLE') disponibles,
    (SELECT count(*)::int FROM ${s}.exemplaires WHERE statut = 'EMPRUNTE') empruntes,
    (SELECT count(*)::int FROM ${s}.exemplaires WHERE statut = 'PERDU') perdus,
    (SELECT count(*)::int FROM ${s}.exemplaires WHERE statut = 'ABIME') abimes,
    (SELECT count(*)::int FROM ${s}.emprunts WHERE statut IN ('ACTIF','EN_RETARD')) emprunts_en_cours,
    (SELECT count(*)::int FROM ${s}.emprunts WHERE statut = 'EN_RETARD' OR (statut='ACTIF' AND date_echeance < current_timestamp)) retards,
    (SELECT count(*)::int FROM ${s}.emprunteurs WHERE statut <> 'ARCHIVE') total_eleves`)
  const repartitions = await pool.query<{ type: "niveau" | "matiere"; libelle: string; total: number }>(`
    SELECT 'niveau' type,n.nom libelle,count(e.id)::int total FROM ${s}.niveaux_scolaires n
      JOIN ${s}.ouvrages o ON o.niveau_scolaire_id=n.id JOIN ${s}.exemplaires e ON e.ouvrage_id=o.id
      WHERE e.statut<>'RETIRE' GROUP BY n.id,n.nom
    UNION ALL
    SELECT 'matiere',m.nom,count(e.id)::int FROM ${s}.matieres m
      JOIN ${s}.ouvrages o ON o.matiere_id=m.id JOIN ${s}.exemplaires e ON e.ouvrage_id=o.id
      WHERE e.statut<>'RETIRE' GROUP BY m.id,m.nom`)
  const stats = result.rows[0]
  return {
    totalLivres: stats?.total_livres ?? 0, disponibles: stats?.disponibles ?? 0,
    empruntesLivres: stats?.empruntes ?? 0, perdus: stats?.perdus ?? 0, abimes: stats?.abimes ?? 0,
    empruntsEnCours: stats?.emprunts_en_cours ?? 0, retards: stats?.retards ?? 0, totalEleves: stats?.total_eleves ?? 0,
    parNiveau: Object.fromEntries(repartitions.rows.filter((r) => r.type === "niveau").map((r) => [r.libelle, r.total])),
    parMatiere: Object.fromEntries(repartitions.rows.filter((r) => r.type === "matiere").map((r) => [r.libelle, r.total])),
  }
}

export async function getRecentEmprunts(limit = 5) {
  await requireUser()
  const s = schema(); const limite = Math.min(Math.max(Math.trunc(limit), 1), 20)
  const rows = await pool.query<{
    id: string; numeroEmprunt: string; statut: string; dateEmprunt: Date; dateRetourPrevue: Date
    titre: string; codeLivre: string; nom: string; prenom: string; classe: string | null
  }>(`SELECT e.id,e.id::text "numeroEmprunt",e.statut,e.date_emprunt "dateEmprunt",e.date_echeance "dateRetourPrevue",
      o.titre,x.code_inventaire "codeLivre",p.nom,p.prenom,p.classe
    FROM ${s}.emprunts e JOIN ${s}.exemplaires x ON x.id=e.exemplaire_id
    JOIN ${s}.ouvrages o ON o.id=x.ouvrage_id JOIN ${s}.emprunteurs p ON p.id=e.emprunteur_id
    ORDER BY e.date_creation DESC LIMIT $1`, [limite])
  return rows.rows.map((row) => ({ ...row, statut: row.statut === "ACTIF" ? "En cours" : row.statut === "EN_RETARD" ? "En retard" : row.statut === "RETOURNE" ? "Retourné" : row.statut }))
}
