import { ZodError } from "zod"

export type CodeErreur = "RESSOURCE_INTROUVABLE" | "DONNEES_INVALIDES" | "CODE_DEJA_UTILISE" | "EXEMPLAIRE_INDISPONIBLE" | "EMPRUNTEUR_INACTIF" | "EMPRUNT_DEJA_CLOTURE" | "EMPRUNT_ACTIF_EXISTANT" | "TRANSITION_STATUT_INTERDITE" | "NON_AUTHENTIFIE" | "ACCES_INTERDIT" | "CONFLIT_METIER" | "ERREUR_INTERNE"

export class ErreurApi extends Error {
  constructor(public code: CodeErreur, message: string, public statut: number, public details: unknown = {}) { super(message) }
}

export function normaliserErreur(error: unknown): ErreurApi {
  if (error instanceof ErreurApi) return error
  if (error instanceof ZodError) return new ErreurApi("DONNEES_INVALIDES", "Les données fournies sont invalides", 400, error.flatten())
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
  if (code === "23505") return new ErreurApi("CODE_DEJA_UTILISE", "Une valeur unique est déjà utilisée", 409)
  if (["23503", "23514", "22P02"].includes(code)) return new ErreurApi("DONNEES_INVALIDES", "Les données ne respectent pas les contraintes", 400)
  return new ErreurApi("ERREUR_INTERNE", "Une erreur interne est survenue", 500)
}
