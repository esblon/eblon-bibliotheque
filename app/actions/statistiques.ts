"use server"

import { db } from "@/lib/db"
import { emprunts, livres, eleves, historiqueActions } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { eq, desc, sql } from "drizzle-orm"

export async function getStatistiques() {
  await requireUser()

  // Loans per month (last 6 months)
  const parMois = await db
    .select({
      mois: sql<string>`to_char(${emprunts.dateEmprunt}, 'YYYY-MM')`,
      total: sql<number>`count(*)::int`,
    })
    .from(emprunts)
    .groupBy(sql`to_char(${emprunts.dateEmprunt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${emprunts.dateEmprunt}, 'YYYY-MM')`)

  // Most borrowed books
  const livresPopulaires = await db
    .select({
      titre: livres.titre,
      codeLivre: livres.codeLivre,
      total: sql<number>`count(${emprunts.id})::int`,
    })
    .from(emprunts)
    .leftJoin(livres, eq(emprunts.livreId, livres.id))
    .groupBy(livres.titre, livres.codeLivre)
    .orderBy(desc(sql`count(${emprunts.id})`))
    .limit(5)

  // Most demanded subjects
  const matieresPopulaires = await db
    .select({
      matiere: livres.matiere,
      total: sql<number>`count(${emprunts.id})::int`,
    })
    .from(emprunts)
    .leftJoin(livres, eq(emprunts.livreId, livres.id))
    .groupBy(livres.matiere)
    .orderBy(desc(sql`count(${emprunts.id})`))
    .limit(6)

  // Top students
  const elevesActifs = await db
    .select({
      nom: eleves.nom,
      prenom: eleves.prenom,
      classe: eleves.classe,
      total: sql<number>`count(${emprunts.id})::int`,
    })
    .from(emprunts)
    .leftJoin(eleves, eq(emprunts.eleveId, eleves.id))
    .groupBy(eleves.nom, eleves.prenom, eleves.classe)
    .orderBy(desc(sql`count(${emprunts.id})`))
    .limit(5)

  // Book status counts for rates
  const statutsLivre = await db
    .select({
      statut: livres.statut,
      total: sql<number>`count(*)::int`,
    })
    .from(livres)
    .where(eq(livres.archived, false))
    .groupBy(livres.statut)

  const totalLivres = statutsLivre.reduce((s, r) => s + Number(r.total), 0)
  const count = (st: string) => Number(statutsLivre.find((r) => r.statut === st)?.total ?? 0)

  const rate = (n: number) => (totalLivres > 0 ? Math.round((n / totalLivres) * 100) : 0)

  const [{ retards }] = await db
    .select({ retards: sql<number>`count(*)::int` })
    .from(emprunts)
    .where(eq(emprunts.statut, "En retard"))

  // Recent movements
  const mouvements = await db
    .select()
    .from(historiqueActions)
    .orderBy(desc(historiqueActions.dateAction))
    .limit(20)

  return {
    parMois: parMois.map((r) => ({ mois: r.mois, total: Number(r.total) })),
    livresPopulaires: livresPopulaires.map((r) => ({ ...r, total: Number(r.total) })),
    matieresPopulaires: matieresPopulaires.map((r) => ({ ...r, total: Number(r.total) })),
    elevesActifs: elevesActifs.map((r) => ({ ...r, total: Number(r.total) })),
    taux: {
      disponibles: rate(count("Disponible")),
      empruntes: rate(count("Emprunté")),
      perdus: rate(count("Perdu")),
      abimes: rate(count("Abîmé")),
    },
    retards: Number(retards),
    mouvements,
  }
}
