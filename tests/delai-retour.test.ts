import { describe, expect, it } from "vitest"
import { calculerDelaiRetour } from "@/lib/delai-retour"

describe("compteur de retour des prêts", () => {
  const maintenant = new Date(2026, 6, 19, 15)

  it("compte les jours calendaires restants", () => {
    expect(calculerDelaiRetour(new Date(2026, 7, 9), "ACTIF", maintenant)).toMatchObject({ type: "restant", jours: 21, libelle: "21 jours restants" })
  })

  it("indique une échéance le jour même", () => {
    expect(calculerDelaiRetour(new Date(2026, 6, 19, 8), "ACTIF", maintenant)?.libelle).toBe("À rendre aujourd’hui")
  })

  it("compte les jours calendaires de retard", () => {
    expect(calculerDelaiRetour(new Date(2026, 6, 16), "EN_RETARD", maintenant)).toMatchObject({ type: "retard", jours: 3, libelle: "3 jours de retard" })
  })

  it("ne calcule rien pour un prêt clôturé", () => {
    expect(calculerDelaiRetour(new Date(2026, 6, 16), "RETOURNE", maintenant)).toBeNull()
  })
})
