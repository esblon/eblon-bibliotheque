"use server"

import { db } from "@/lib/db"
import { eleves, emprunts, livres } from "@/lib/db/schema"
import { requireUser, requireAdmin } from "@/lib/session"
import { logAction } from "@/lib/history"
import { and, eq, ilike, desc, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"

export async function getEleves(search?: string) {
  await requireUser()
  const s=`"${parseServerEnvironment().DATABASE_SCHEMA}"`;const valeurs:unknown[]=[];let recherche=""
  if(search){valeurs.push(`%${search}%`);recherche=`AND (p.nom ILIKE $1 OR p.prenom ILIKE $1 OR p.numero_emprunteur ILIKE $1 OR p.classe ILIKE $1)`}
  const result=await pool.query<{id:number;identifiantEleve:string;nom:string;prenom:string;classe:string|null;niveau:string;etablissement:string|null;telephoneParent:string|null;statut:string;commentaire:string|null;archived:boolean;createdAt:Date;updatedAt:Date;empruntsEnCours:number}>(`SELECT p.id,p.numero_emprunteur "identifiantEleve",p.nom,p.prenom,p.classe,coalesce(n.nom,'Autre') niveau,p.etablissement,p.telephone "telephoneParent",
    CASE p.statut WHEN 'ACTIF' THEN 'Actif' WHEN 'SUSPENDU' THEN 'Suspendu' ELSE 'Archivé' END statut,NULL::text commentaire,
    (p.statut='ARCHIVE') archived,p.date_creation "createdAt",p.date_modification "updatedAt",
    count(e.id) FILTER(WHERE e.statut IN('ACTIF','EN_RETARD'))::int "empruntsEnCours"
    FROM ${s}.emprunteurs p LEFT JOIN ${s}.niveaux_scolaires n ON n.id=p.niveau_scolaire_id
    LEFT JOIN ${s}.emprunts e ON e.emprunteur_id=p.id WHERE p.statut<>'ARCHIVE' ${recherche}
    GROUP BY p.id,n.nom ORDER BY p.date_creation DESC`,valeurs)
  return result.rows
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
  return (await getEleves()).filter((e)=>e.statut==="Actif").map(({id,identifiantEleve,nom,prenom,classe})=>({id,identifiantEleve,nom,prenom,classe}))
}

export async function getAllElevesForExport() {
  return getEleves()
}
