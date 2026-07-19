const JOUR_EN_MILLISECONDES = 24 * 60 * 60 * 1000
const STATUTS_EN_COURS = new Set(["ACTIF", "EN_RETARD"])

export type DelaiRetour = {
  type: "restant" | "aujourdhui" | "retard"
  jours: number
  libelle: string
}

function debutDuJour(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function calculerDelaiRetour(dateEcheance: string | Date, statut: string, maintenant = new Date()): DelaiRetour | null {
  if (!STATUTS_EN_COURS.has(statut)) return null

  const echeance = dateEcheance instanceof Date ? dateEcheance : new Date(dateEcheance)
  if (Number.isNaN(echeance.valueOf()) || Number.isNaN(maintenant.valueOf())) return null

  const jours = Math.round((debutDuJour(echeance) - debutDuJour(maintenant)) / JOUR_EN_MILLISECONDES)
  if (jours > 0) return { type: "restant", jours, libelle: `${jours} jour${jours > 1 ? "s" : ""} restant${jours > 1 ? "s" : ""}` }
  if (jours === 0) return { type: "aujourdhui", jours: 0, libelle: "À rendre aujourd’hui" }

  const retard = Math.abs(jours)
  return { type: "retard", jours: retard, libelle: `${retard} jour${retard > 1 ? "s" : ""} de retard` }
}
