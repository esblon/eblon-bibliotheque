"use server"

import { db } from "@/lib/db"
import { eleves, emprunts, livres } from "@/lib/db/schema"
import { requireUser, requireAdmin } from "@/lib/session"
import { logAction } from "@/lib/history"
import { and, eq, ilike, or, desc, ne, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getEleves(search?: string) {
  await requireUser()
  const conditions = [eq(eleves.archived, false)]
  if (search) {
    const s = `%${search}%`
    conditions.push(
      or(
        ilike(eleves.nom, s),
        ilike(eleves.prenom, s),
        ilike(eleves.identifiantEleve, s),
        ilike(eleves.classe, s),
      )!,
    )
  }
  return db
    .select({
      id: eleves.id,
      identifiantEleve: eleves.identifiantEleve,
      nom: eleves.nom,
      prenom: eleves.prenom,
      classe: eleves.classe,
      niveau: eleves.niveau,
      etablissement: eleves.etablissement,
      telephoneParent: eleves.telephoneParent,
      statut: eleves.statut,
      commentaire: eleves.commentaire,
      archived: eleves.archived,
      createdAt: eleves.createdAt,
      updatedAt: eleves.updatedAt,
      empruntsEnCours: sql<number>`(
        select count(*)::int from ${emprunts}
        where ${emprunts.eleveId} = ${eleves.id}
        and ${emprunts.statut} in ('En cours', 'En retard')
      )`,
    })
    .from(eleves)
    .where(and(...conditions))
    .orderBy(desc(eleves.createdAt))
}

export async function getEleve(id: number) {
  await requireUser()
  const [row] = await db.select().from(eleves).where(eq(eleves.id, id))
  return row ?? null
}

async function nextIdentifiant() {
  const rows = await db
    .select({ ident: eleves.identifiantEleve })
    .from(eleves)
    .where(ilike(eleves.identifiantEleve, "ELV-%"))
  let max = 0
  for (const r of rows) {
    const n = Number.parseInt(r.ident.slice(4), 10)
    if (!Number.isNaN(n) && n > max) max = n
  }
  return `ELV-${String(max + 1).padStart(3, "0")}`
}

export type EleveInput = {
  identifiantEleve?: string
  nom: string
  prenom: string
  classe?: string
  niveau: string
  etablissement?: string
  telephoneParent?: string
  statut: string
  commentaire?: string
}

export async function createEleve(input: EleveInput) {
  const user = await requireUser()
  let ident = input.identifiantEleve?.trim().toUpperCase()
  if (!ident) ident = await nextIdentifiant()

  const existing = await db
    .select({ id: eleves.id })
    .from(eleves)
    .where(eq(eleves.identifiantEleve, ident))
  if (existing.length > 0) {
    return { error: `L'identifiant ${ident} existe déjà.` }
  }

  const [row] = await db
    .insert(eleves)
    .values({
      identifiantEleve: ident,
      nom: input.nom,
      prenom: input.prenom,
      classe: input.classe || null,
      niveau: input.niveau,
      etablissement: input.etablissement || null,
      telephoneParent: input.telephoneParent || null,
      statut: input.statut,
      commentaire: input.commentaire || null,
    })
    .returning()

  await logAction(user, "Création élève", "élève", row.id, `${input.prenom} ${input.nom}`)
  revalidatePath("/eleves")
  revalidatePath("/")
  return { data: row }
}

export async function updateEleve(id: number, input: EleveInput) {
  const user = await requireUser()
  const [current] = await db.select().from(eleves).where(eq(eleves.id, id))
  if (!current) return { error: "Élève introuvable." }

  const ident =
    input.identifiantEleve?.trim().toUpperCase() || current.identifiantEleve
  if (ident !== current.identifiantEleve) {
    const dup = await db
      .select({ id: eleves.id })
      .from(eleves)
      .where(and(eq(eleves.identifiantEleve, ident), ne(eleves.id, id)))
    if (dup.length > 0) return { error: `L'identifiant ${ident} existe déjà.` }
  }

  const [row] = await db
    .update(eleves)
    .set({
      identifiantEleve: ident,
      nom: input.nom,
      prenom: input.prenom,
      classe: input.classe || null,
      niveau: input.niveau,
      etablissement: input.etablissement || null,
      telephoneParent: input.telephoneParent || null,
      statut: input.statut,
      commentaire: input.commentaire || null,
      updatedAt: new Date(),
    })
    .where(eq(eleves.id, id))
    .returning()

  await logAction(user, "Modification élève", "élève", id, `${input.prenom} ${input.nom}`)
  revalidatePath("/eleves")
  revalidatePath(`/eleves/${id}`)
  return { data: row }
}

export async function archiveEleve(id: number) {
  const user = await requireUser()
  await db
    .update(eleves)
    .set({ archived: true, statut: "Inactif", updatedAt: new Date() })
    .where(eq(eleves.id, id))
  await logAction(user, "Archivage élève", "élève", id)
  revalidatePath("/eleves")
  return { data: true }
}

export async function deleteEleve(id: number) {
  const user = await requireAdmin()
  await db.delete(eleves).where(eq(eleves.id, id))
  await logAction(user, "Suppression élève", "élève", id)
  revalidatePath("/eleves")
  return { data: true }
}

export async function getEleveEmprunts(eleveId: number) {
  await requireUser()
  return db
    .select({
      id: emprunts.id,
      numeroEmprunt: emprunts.numeroEmprunt,
      statut: emprunts.statut,
      dateEmprunt: emprunts.dateEmprunt,
      dateRetourPrevue: emprunts.dateRetourPrevue,
      dateRetourReelle: emprunts.dateRetourReelle,
      titre: livres.titre,
      codeLivre: livres.codeLivre,
    })
    .from(emprunts)
    .leftJoin(livres, eq(emprunts.livreId, livres.id))
    .where(eq(emprunts.eleveId, eleveId))
    .orderBy(desc(emprunts.createdAt))
}

// Lightweight list for select inputs (loan creation).
export async function getElevesForSelect() {
  await requireUser()
  return db
    .select({
      id: eleves.id,
      identifiantEleve: eleves.identifiantEleve,
      nom: eleves.nom,
      prenom: eleves.prenom,
      classe: eleves.classe,
    })
    .from(eleves)
    .where(and(eq(eleves.archived, false), eq(eleves.statut, "Actif")))
    .orderBy(eleves.nom)
}

export async function getAllElevesForExport() {
  await requireUser()
  return db.select().from(eleves).orderBy(desc(eleves.createdAt))
}
