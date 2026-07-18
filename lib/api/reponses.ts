import { NextResponse } from "next/server"
import { normaliserErreur } from "./erreurs"
import { journaliser } from "./journal"

export function succes(donnees: unknown, meta: Record<string, unknown> = {}, statut = 200) {
  return NextResponse.json({ donnees, meta }, { status: statut })
}

export function reponseErreur(error: unknown) {
  const erreur = normaliserErreur(error)
  if (erreur.statut === 500) journaliser("erreur_inattendue", { type: error instanceof Error ? error.name : "inconnu" })
  return NextResponse.json({ erreur: { code: erreur.code, message: erreur.message, details: erreur.details } }, { status: erreur.statut })
}
