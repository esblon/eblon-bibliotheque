"use server"

import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { requireUser } from "@/lib/session"

export async function getStatistiques() {
  await requireUser()
  const s = `"${parseServerEnvironment().DATABASE_SCHEMA}"`
  const [parMois, livres, matieres, eleves, statuts, retards, mouvements] = await Promise.all([
    pool.query<{ mois: string; total: number }>(`SELECT to_char(date_emprunt,'YYYY-MM') mois,count(*)::int total FROM ${s}.emprunts GROUP BY 1 ORDER BY 1`),
    pool.query<{ titre: string; codeLivre: string; total: number }>(`SELECT o.titre,min(x.code_inventaire) "codeLivre",count(e.id)::int total FROM ${s}.emprunts e JOIN ${s}.exemplaires x ON x.id=e.exemplaire_id JOIN ${s}.ouvrages o ON o.id=x.ouvrage_id GROUP BY o.id,o.titre ORDER BY total DESC LIMIT 5`),
    pool.query<{ matiere: string; total: number }>(`SELECT m.nom matiere,count(e.id)::int total FROM ${s}.emprunts e JOIN ${s}.exemplaires x ON x.id=e.exemplaire_id JOIN ${s}.ouvrages o ON o.id=x.ouvrage_id JOIN ${s}.matieres m ON m.id=o.matiere_id GROUP BY m.id,m.nom ORDER BY total DESC LIMIT 6`),
    pool.query<{ nom: string; prenom: string; classe: string | null; total: number }>(`SELECT p.nom,p.prenom,p.classe,count(e.id)::int total FROM ${s}.emprunts e JOIN ${s}.emprunteurs p ON p.id=e.emprunteur_id GROUP BY p.id,p.nom,p.prenom,p.classe ORDER BY total DESC LIMIT 5`),
    pool.query<{ statut: string; total: number }>(`SELECT statut,count(*)::int total FROM ${s}.exemplaires WHERE statut<>'RETIRE' GROUP BY statut`),
    pool.query<{ retards: number }>(`SELECT count(*)::int retards FROM ${s}.emprunts WHERE statut='EN_RETARD' OR (statut='ACTIF' AND date_echeance<current_timestamp)`),
    pool.query<{ id: string; action: string; utilisateurNom: string | null; cible: string; details: string | null; dateAction: Date }>(`SELECT v.id,v.type_evenement action,concat_ws(' ',a.prenom,a.nom) "utilisateurNom",'emprunt' cible,v.details::text details,v.date_evenement "dateAction" FROM ${s}.evenements_emprunt v LEFT JOIN ${s}.agents a ON a.id=v.agent_id ORDER BY v.date_evenement DESC LIMIT 20`),
  ])
  const total = statuts.rows.reduce((sum, row) => sum + row.total, 0)
  const nombre = (statut: string) => statuts.rows.find((row) => row.statut === statut)?.total ?? 0
  const taux = (nombre: number) => total ? Math.round(nombre / total * 100) : 0
  return {
    parMois: parMois.rows, livresPopulaires: livres.rows, matieresPopulaires: matieres.rows, elevesActifs: eleves.rows,
    taux: { disponibles: taux(nombre("DISPONIBLE")), empruntes: taux(nombre("EMPRUNTE")), perdus: taux(nombre("PERDU")), abimes: taux(nombre("ABIME")) },
    retards: retards.rows[0]?.retards ?? 0, mouvements: mouvements.rows,
  }
}
