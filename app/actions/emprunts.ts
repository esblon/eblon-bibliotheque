"use server"

import { db } from "@/lib/db"
import { emprunts, livres, eleves } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { logAction } from "@/lib/history"
import { getDureePret } from "@/app/actions/parametres"
import { and, eq, desc, lt, isNull, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Marks any "En cours" loan whose due date has passed as "En retard".
// Called defensively at the start of every read so the dashboard is accurate.
async function refreshRetards() {
  await db
    .update(emprunts)
    .set({ statut: "En retard", updatedAt: new Date() })
    .where(
      and(
        eq(emprunts.statut, "En cours"),
        lt(emprunts.dateRetourPrevue, new Date()),
        isNull(emprunts.dateRetourReelle),
      ),
    )
}

async function nextNumeroEmprunt() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(emprunts)
  const year = new Date().getFullYear()
  return `EMP-${year}-${String(Number(count) + 1).padStart(4, "0")}`
}

type EmpruntRow = {
  id: number
  numeroEmprunt: string
  statut: string
  dateEmprunt: Date
  dateRetourPrevue: Date
  dateRetourReelle: Date | null
  commentaire: string | null
  livreId: number
  eleveId: number
  titre: string | null
  codeLivre: string | null
  eleveNom: string | null
  elevePrenom: string | null
  classe: string | null
  telephoneParent: string | null
}

function baseSelect() {
  return db
    .select({
      id: emprunts.id,
      numeroEmprunt: emprunts.numeroEmprunt,
      statut: emprunts.statut,
      dateEmprunt: emprunts.dateEmprunt,
      dateRetourPrevue: emprunts.dateRetourPrevue,
      dateRetourReelle: emprunts.dateRetourReelle,
      commentaire: emprunts.commentaire,
      livreId: emprunts.livreId,
      eleveId: emprunts.eleveId,
      titre: livres.titre,
      codeLivre: livres.codeLivre,
      eleveNom: eleves.nom,
      elevePrenom: eleves.prenom,
      classe: eleves.classe,
      telephoneParent: eleves.telephoneParent,
    })
    .from(emprunts)
    .leftJoin(livres, eq(emprunts.livreId, livres.id))
    .leftJoin(eleves, eq(emprunts.eleveId, eleves.id))
}

export async function getEmprunts(): Promise<EmpruntRow[]> {
  await requireUser()
  await refreshRetards()
  return baseSelect().orderBy(desc(emprunts.createdAt))
}

export async function getEmpruntsEnCours(): Promise<EmpruntRow[]> {
  await requireUser()
  await refreshRetards()
  return baseSelect()
    .where(sql`${emprunts.statut} in ('En cours', 'En retard')`)
    .orderBy(emprunts.dateRetourPrevue)
}

export async function getRetards(): Promise<EmpruntRow[]> {
  await requireUser()
  await refreshRetards()
  return baseSelect().where(eq(emprunts.statut, "En retard")).orderBy(emprunts.dateRetourPrevue)
}

// Create a loan. Enforces that the book is available.
export async function createEmprunt(input: {
  livreId: number
  eleveId: number
  dateRetourPrevue?: string
  commentaire?: string
}) {
  const user = await requireUser()

  const [livre] = await db.select().from(livres).where(eq(livres.id, input.livreId))
  if (!livre) return { error: "Livre introuvable." }
  if (livre.statut !== "Disponible") {
    return { error: `Ce livre n'est pas disponible (statut actuel : ${livre.statut}).` }
  }

  const [eleve] = await db.select().from(eleves).where(eq(eleves.id, input.eleveId))
  if (!eleve) return { error: "Élève introuvable." }

  const duree = await getDureePret()
  const dateRetourPrevue = input.dateRetourPrevue
    ? new Date(input.dateRetourPrevue)
    : new Date(Date.now() + duree * 24 * 60 * 60 * 1000)

  const numero = await nextNumeroEmprunt()

  const [row] = await db
    .insert(emprunts)
    .values({
      numeroEmprunt: numero,
      livreId: input.livreId,
      eleveId: input.eleveId,
      dateRetourPrevue,
      statut: "En cours",
      commentaire: input.commentaire || null,
    })
    .returning()

  // Book becomes "Emprunté".
  await db
    .update(livres)
    .set({ statut: "Emprunté", updatedAt: new Date() })
    .where(eq(livres.id, input.livreId))

  await logAction(
    user,
    "Création emprunt",
    "emprunt",
    row.id,
    `${livre.codeLivre} → ${eleve.prenom} ${eleve.nom}`,
  )
  revalidatePath("/emprunts")
  revalidatePath("/livres")
  revalidatePath("/eleves")
  revalidatePath("/")
  return { data: row }
}

// Validate a return. Book goes back to "Disponible" unless flagged.
export async function retournerEmprunt(input: {
  empruntId: number
  etat?: "ok" | "abime" | "perdu"
  commentaire?: string
}) {
  const user = await requireUser()
  const [emp] = await db.select().from(emprunts).where(eq(emprunts.id, input.empruntId))
  if (!emp) return { error: "Emprunt introuvable." }
  if (emp.statut === "Retourné") return { error: "Cet emprunt est déjà retourné." }

  const etat = input.etat ?? "ok"
  let empruntStatut = "Retourné"
  let livreStatut = "Disponible"
  if (etat === "abime") {
    empruntStatut = "Abîmé"
    livreStatut = "Abîmé"
  } else if (etat === "perdu") {
    empruntStatut = "Perdu"
    livreStatut = "Perdu"
  }

  await db
    .update(emprunts)
    .set({
      statut: empruntStatut,
      dateRetourReelle: new Date(),
      commentaire: input.commentaire || emp.commentaire,
      updatedAt: new Date(),
    })
    .where(eq(emprunts.id, input.empruntId))

  await db
    .update(livres)
    .set({ statut: livreStatut, updatedAt: new Date() })
    .where(eq(livres.id, emp.livreId))

  await logAction(user, "Retour emprunt", "emprunt", emp.id, `${emp.numeroEmprunt} — ${empruntStatut}`)
  revalidatePath("/emprunts")
  revalidatePath("/retards")
  revalidatePath("/livres")
  revalidatePath("/eleves")
  revalidatePath("/")
  return { data: true }
}

export async function getEmprunt(id: number) {
  await requireUser()
  const [row] = await baseSelect().where(eq(emprunts.id, id))
  return row ?? null
}

// The currently active loan (En cours / En retard) for a given book, if any.
export async function getEmpruntActifByLivre(livreId: number) {
  await requireUser()
  const [row] = await baseSelect()
    .where(
      and(
        eq(emprunts.livreId, livreId),
        sql`${emprunts.statut} in ('En cours', 'En retard')`,
      ),
    )
    .orderBy(desc(emprunts.createdAt))
  return row ?? null
}

export async function getAllEmpruntsForExport() {
  await requireUser()
  await refreshRetards()
  return baseSelect().orderBy(desc(emprunts.createdAt))
}
