"use server"

import { db } from "@/lib/db"
import { livres, emprunts, eleves } from "@/lib/db/schema"
import { requireUser, requireAdmin } from "@/lib/session"
import { logAction } from "@/lib/history"
import { NIVEAU_CODES, MATIERE_CODES } from "@/lib/constants"
import { and, eq, ilike, desc, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"

export type LivreFilters = {
  search?: string
  niveau?: string
  matiere?: string
  statut?: string
  type?: string
}

export async function getLivres(filters: LivreFilters = {}) {
  await requireUser()
  const s = `"${parseServerEnvironment().DATABASE_SCHEMA}"`; const valeurs: unknown[]=[]; const conditions=["x.statut<>'RETIRE'"]
  if(filters.search){valeurs.push(`%${filters.search}%`);conditions.push(`(o.titre ILIKE $${valeurs.length} OR x.code_inventaire ILIKE $${valeurs.length})`)}
  if(filters.niveau){valeurs.push(filters.niveau);conditions.push(`n.nom=$${valeurs.length}`)}
  if(filters.matiere){valeurs.push(filters.matiere);conditions.push(`m.nom=$${valeurs.length}`)}
  const statuts:Record<string,string>={Disponible:"DISPONIBLE","Emprunté":"EMPRUNTE",Perdu:"PERDU","Abîmé":"ABIME","Retiré":"RETIRE"}
  if(filters.statut){valeurs.push(statuts[filters.statut]??filters.statut);conditions.push(`x.statut=$${valeurs.length}`)}
  const result=await pool.query<{id:number;codeLivre:string;titre:string;niveau:string;matiere:string;typeLivre:string;edition:string|null;etatPhysique:string;statut:string;localisation:string;qrCodeUrl:string|null;commentaire:string|null;archived:boolean;createdAt:Date;updatedAt:Date}>(`SELECT x.id,x.code_inventaire "codeLivre",o.titre,n.nom niveau,m.nom matiere,'Ouvrage' "typeLivre",o.edition,
    CASE x.statut WHEN 'ABIME' THEN 'Abîmé' WHEN 'PERDU' THEN 'Perdu' ELSE 'Bon' END "etatPhysique",
    CASE x.statut WHEN 'DISPONIBLE' THEN 'Disponible' WHEN 'EMPRUNTE' THEN 'Emprunté' WHEN 'PERDU' THEN 'Perdu' WHEN 'ABIME' THEN 'Abîmé' WHEN 'RETIRE' THEN 'Retiré' ELSE initcap(lower(x.statut)) END statut,
    'Bibliothèque' localisation,x.code_qr "qrCodeUrl",x.observations commentaire,false archived,x.date_creation "createdAt",x.date_modification "updatedAt"
    FROM ${s}.exemplaires x JOIN ${s}.ouvrages o ON o.id=x.ouvrage_id JOIN ${s}.niveaux_scolaires n ON n.id=o.niveau_scolaire_id
    JOIN ${s}.matieres m ON m.id=o.matiere_id WHERE ${conditions.join(" AND ")} ORDER BY x.date_creation DESC`,valeurs)
  return result.rows
}

export async function getLivre(id: number) {
  await requireUser()
  const [row] = await db.select().from(livres).where(eq(livres.id, id))
  return row ?? null
}

export async function getLivreByCode(code: string) {
  await requireUser()
  const [row] = await db
    .select()
    .from(livres)
    .where(eq(livres.codeLivre, code.trim().toUpperCase()))
  return row ?? null
}

// Generate the next sequential code for a niveau/matiere pair.
async function nextCodeLivre(niveau: string, matiere: string) {
  const nc = NIVEAU_CODES[niveau] ?? "AUT"
  const mc = MATIERE_CODES[matiere] ?? "AUT"
  const prefix = `FAC-${nc}-${mc}-`
  const rows = await db
    .select({ code: livres.codeLivre })
    .from(livres)
    .where(ilike(livres.codeLivre, `${prefix}%`))
  let max = 0
  for (const r of rows) {
    const n = Number.parseInt(r.code.slice(prefix.length), 10)
    if (!Number.isNaN(n) && n > max) max = n
  }
  const num = String(max + 1).padStart(3, "0")
  return `${prefix}${num}`
}

export type LivreInput = {
  codeLivre?: string
  titre: string
  niveau: string
  matiere: string
  typeLivre: string
  edition?: string
  etatPhysique: string
  statut: string
  localisation: string
  commentaire?: string
}

export async function createLivre(input: LivreInput) {
  const user = await requireUser()

  let code = input.codeLivre?.trim().toUpperCase()
  if (!code) {
    code = await nextCodeLivre(input.niveau, input.matiere)
  }

  const existing = await db
    .select({ id: livres.id })
    .from(livres)
    .where(eq(livres.codeLivre, code))
  if (existing.length > 0) {
    return { error: `Le code ${code} existe déjà.` }
  }

  const [row] = await db
    .insert(livres)
    .values({
      codeLivre: code,
      titre: input.titre,
      niveau: input.niveau,
      matiere: input.matiere,
      typeLivre: input.typeLivre,
      edition: input.edition || null,
      etatPhysique: input.etatPhysique,
      statut: input.statut,
      localisation: input.localisation,
      commentaire: input.commentaire || null,
    })
    .returning()

  await logAction(user, "Création livre", "livre", row.id, code)
  revalidatePath("/livres")
  revalidatePath("/")
  return { data: row }
}

export async function updateLivre(id: number, input: LivreInput) {
  const user = await requireUser()

  const [current] = await db.select().from(livres).where(eq(livres.id, id))
  if (!current) return { error: "Livre introuvable." }

  const code = input.codeLivre?.trim().toUpperCase() || current.codeLivre
  if (code !== current.codeLivre) {
    const dup = await db
      .select({ id: livres.id })
      .from(livres)
      .where(and(eq(livres.codeLivre, code), ne(livres.id, id)))
    if (dup.length > 0) return { error: `Le code ${code} existe déjà.` }
  }

  const [row] = await db
    .update(livres)
    .set({
      codeLivre: code,
      titre: input.titre,
      niveau: input.niveau,
      matiere: input.matiere,
      typeLivre: input.typeLivre,
      edition: input.edition || null,
      etatPhysique: input.etatPhysique,
      statut: input.statut,
      localisation: input.localisation,
      commentaire: input.commentaire || null,
      updatedAt: new Date(),
    })
    .where(eq(livres.id, id))
    .returning()

  await logAction(user, "Modification livre", "livre", id, code)
  revalidatePath("/livres")
  revalidatePath(`/livres/${id}`)
  revalidatePath("/")
  return { data: row }
}

// Archive (soft-delete): available to any authenticated user.
export async function archiveLivre(id: number) {
  const user = await requireUser()
  await db
    .update(livres)
    .set({ archived: true, statut: "Retiré", updatedAt: new Date() })
    .where(eq(livres.id, id))
  await logAction(user, "Archivage livre", "livre", id)
  revalidatePath("/livres")
  revalidatePath("/")
  return { data: true }
}

// Hard delete: admin only.
export async function deleteLivre(id: number) {
  const user = await requireAdmin()
  await db.delete(emprunts).where(eq(emprunts.livreId, id))
  await db.delete(livres).where(eq(livres.id, id))
  await logAction(user, "Suppression livre", "livre", id)
  revalidatePath("/livres")
  revalidatePath("/")
  return { data: true }
}

// Signaler un livre perdu / abîmé / retiré directly from its sheet.
export async function signalerLivre(id: number, statut: string, commentaire?: string) {
  const user = await requireUser()
  await db
    .update(livres)
    .set({
      statut,
      commentaire: commentaire || null,
      updatedAt: new Date(),
    })
    .where(eq(livres.id, id))
  await logAction(user, `Signalement livre (${statut})`, "livre", id, commentaire)
  revalidatePath("/livres")
  revalidatePath(`/livres/${id}`)
  revalidatePath("/")
  return { data: true }
}

// History of loans for a given book.
export async function getLivreEmprunts(livreId: number) {
  await requireUser()
  return db
    .select({
      id: emprunts.id,
      numeroEmprunt: emprunts.numeroEmprunt,
      statut: emprunts.statut,
      dateEmprunt: emprunts.dateEmprunt,
      dateRetourPrevue: emprunts.dateRetourPrevue,
      dateRetourReelle: emprunts.dateRetourReelle,
      nom: eleves.nom,
      prenom: eleves.prenom,
      classe: eleves.classe,
    })
    .from(emprunts)
    .leftJoin(eleves, eq(emprunts.eleveId, eleves.id))
    .where(eq(emprunts.livreId, livreId))
    .orderBy(desc(emprunts.createdAt))
}

export async function getAllLivresForExport() {
  return getLivres()
}
