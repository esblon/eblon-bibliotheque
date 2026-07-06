import { db } from "@/lib/db"
import { historiqueActions } from "@/lib/db/schema"
import type { SessionUser } from "@/lib/session"

export async function logAction(
  user: SessionUser,
  action: string,
  cible: string,
  cibleId?: string | number,
  details?: string,
) {
  try {
    await db.insert(historiqueActions).values({
      utilisateurId: user.id,
      utilisateurNom: user.name,
      action,
      cible,
      cibleId: cibleId !== undefined ? String(cibleId) : null,
      details: details ?? null,
    })
  } catch {
    // History logging must never break the main action.
  }
}
