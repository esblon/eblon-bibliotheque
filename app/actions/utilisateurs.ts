"use server"

import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { logAction } from "@/lib/history"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getUtilisateurs() {
  await requireAdmin()
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      statut: user.statut,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
}

export async function setUserRole(id: string, role: "admin" | "prof") {
  const admin = await requireAdmin()
  if (admin.id === id) return { error: "Vous ne pouvez pas changer votre propre rôle." }
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, id))
  await logAction(admin, "Modification rôle utilisateur", "utilisateur", id, `→ ${role}`)
  revalidatePath("/parametres")
  return { data: true }
}

export async function setUserStatut(id: string, statut: "Actif" | "Inactif") {
  const admin = await requireAdmin()
  if (admin.id === id) return { error: "Vous ne pouvez pas désactiver votre propre compte." }
  await db.update(user).set({ statut, updatedAt: new Date() }).where(eq(user.id, id))
  await logAction(admin, "Modification statut utilisateur", "utilisateur", id, `→ ${statut}`)
  revalidatePath("/parametres")
  return { data: true }
}
