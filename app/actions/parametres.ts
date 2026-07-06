"use server"

import { db } from "@/lib/db"
import { parametres } from "@/lib/db/schema"
import { requireUser, requireAdmin } from "@/lib/session"
import { logAction } from "@/lib/history"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const DEFAULTS: Record<string, string> = {
  duree_pret_jours: "7",
  nom_etablissement: "Lycée Moderne Facobly",
  nom_professeur: "Professeur référent",
}

export async function getParametre(cle: string): Promise<string> {
  const [row] = await db.select().from(parametres).where(eq(parametres.cle, cle))
  return row?.valeur ?? DEFAULTS[cle] ?? ""
}

export async function getParametres(): Promise<Record<string, string>> {
  const rows = await db.select().from(parametres)
  const map: Record<string, string> = { ...DEFAULTS }
  for (const r of rows) {
    if (r.valeur !== null) map[r.cle] = r.valeur
  }
  return map
}

export async function getDureePret(): Promise<number> {
  const v = await getParametre("duree_pret_jours")
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) || n <= 0 ? 7 : n
}

export async function setParametre(cle: string, valeur: string) {
  const user = await requireUser()
  const [existing] = await db.select().from(parametres).where(eq(parametres.cle, cle))
  if (existing) {
    await db
      .update(parametres)
      .set({ valeur, updatedAt: new Date() })
      .where(eq(parametres.cle, cle))
  } else {
    await db.insert(parametres).values({ cle, valeur })
  }
  await logAction(user, "Modification paramètre", "paramètre", cle, `${cle} = ${valeur}`)
  revalidatePath("/parametres")
}

export async function saveParametres(values: Record<string, string>) {
  await requireUser()
  for (const [cle, valeur] of Object.entries(values)) {
    await setParametre(cle, valeur)
  }
  return { data: true }
}

export async function resetParametres() {
  await requireAdmin()
  await db.delete(parametres)
  revalidatePath("/parametres")
  return { data: true }
}
