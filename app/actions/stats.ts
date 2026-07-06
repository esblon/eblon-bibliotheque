"use server"

import { db } from "@/lib/db"
import { livres, eleves, emprunts } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, eq, sql, isNull, lt, desc, count } from "drizzle-orm"

// Marks overdue loans (En cours + past due date) as "En retard".
async function refreshRetards() {
  const now = new Date()
  await db
    .update(emprunts)
    .set({ statut: "En retard", updatedAt: now })
    .where(
      and(
        eq(emprunts.statut, "En cours"),
        isNull(emprunts.dateRetourReelle),
        lt(emprunts.dateRetourPrevue, now),
      ),
    )
}

export async function getDashboardStats() {
  await requireUser()
  await refreshRetards()

  const allLivres = await db
    .select()
    .from(livres)
    .where(eq(livres.archived, false))

  const totalLivres = allLivres.length
  const disponibles = allLivres.filter((l) => l.statut === "Disponible").length
  const empruntesLivres = allLivres.filter((l) => l.statut === "Emprunté").length
  const perdus = allLivres.filter((l) => l.statut === "Perdu").length
  const abimes = allLivres.filter((l) => l.statut === "Abîmé").length

  const empruntsEnCours = allLivres.length
    ? await db
        .select({ c: count() })
        .from(emprunts)
        .where(
          sql`${emprunts.statut} IN ('En cours', 'En retard')`,
        )
    : [{ c: 0 }]

  const retards = await db
    .select({ c: count() })
    .from(emprunts)
    .where(eq(emprunts.statut, "En retard"))

  const totalEleves = await db
    .select({ c: count() })
    .from(eleves)
    .where(eq(eleves.archived, false))

  // Répartition par niveau
  const parNiveau: Record<string, number> = {}
  for (const l of allLivres) {
    parNiveau[l.niveau] = (parNiveau[l.niveau] ?? 0) + 1
  }

  // Répartition par matière
  const parMatiere: Record<string, number> = {}
  for (const l of allLivres) {
    parMatiere[l.matiere] = (parMatiere[l.matiere] ?? 0) + 1
  }

  return {
    totalLivres,
    disponibles,
    empruntesLivres,
    perdus,
    abimes,
    empruntsEnCours: Number(empruntsEnCours[0]?.c ?? 0),
    retards: Number(retards[0]?.c ?? 0),
    totalEleves: Number(totalEleves[0]?.c ?? 0),
    parNiveau,
    parMatiere,
  }
}

export async function getRecentEmprunts(limit = 5) {
  await requireUser()
  const rows = await db
    .select({
      id: emprunts.id,
      numeroEmprunt: emprunts.numeroEmprunt,
      statut: emprunts.statut,
      dateEmprunt: emprunts.dateEmprunt,
      dateRetourPrevue: emprunts.dateRetourPrevue,
      titre: livres.titre,
      codeLivre: livres.codeLivre,
      nom: eleves.nom,
      prenom: eleves.prenom,
      classe: eleves.classe,
    })
    .from(emprunts)
    .leftJoin(livres, eq(emprunts.livreId, livres.id))
    .leftJoin(eleves, eq(emprunts.eleveId, eleves.id))
    .orderBy(desc(emprunts.createdAt))
    .limit(limit)
  return rows
}
