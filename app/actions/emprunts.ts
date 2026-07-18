"use server"

import { db } from "@/lib/db"
import { emprunts, livres, eleves } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { logAction } from "@/lib/history"
import { getDureePret } from "@/app/actions/parametres"
import { and, eq, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"

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
  return lireEmpruntsMetier()
}

export async function getEmpruntsEnCours(): Promise<EmpruntRow[]> {
  await requireUser()
  return lireEmpruntsMetier("actifs")
}

export async function getRetards(): Promise<EmpruntRow[]> {
  await requireUser()
  return lireEmpruntsMetier("retards")
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
  return lireEmpruntsMetier()
}

async function lireEmpruntsMetier(filtre?: "actifs" | "retards"): Promise<EmpruntRow[]> {
  const s = `"${parseServerEnvironment().DATABASE_SCHEMA}"`
  const where = filtre === "retards"
    ? "WHERE e.statut='EN_RETARD' OR (e.statut='ACTIF' AND e.date_echeance<current_timestamp)"
    : filtre === "actifs" ? "WHERE e.statut IN ('ACTIF','EN_RETARD')" : ""
  const result = await pool.query<EmpruntRow>(`SELECT e.id,e.id::text "numeroEmprunt",e.statut,e.date_emprunt "dateEmprunt",
    e.date_echeance "dateRetourPrevue",e.date_retour "dateRetourReelle",e.observations commentaire,
    x.id "livreId",p.id "eleveId",o.titre,x.code_inventaire "codeLivre",p.nom "eleveNom",p.prenom "elevePrenom",
    p.classe,p.telephone "telephoneParent" FROM ${s}.emprunts e JOIN ${s}.exemplaires x ON x.id=e.exemplaire_id
    JOIN ${s}.ouvrages o ON o.id=x.ouvrage_id JOIN ${s}.emprunteurs p ON p.id=e.emprunteur_id ${where}
    ORDER BY ${filtre ? "e.date_echeance ASC" : "e.date_creation DESC"}`)
  return result.rows.map((row) => ({ ...row, statut: row.statut === "ACTIF" ? "En cours" : row.statut === "EN_RETARD" ? "En retard" : row.statut === "RETOURNE" ? "Retourné" : row.statut === "PERDU" ? "Perdu" : row.statut === "ANNULE" ? "Annulé" : row.statut }))
}
