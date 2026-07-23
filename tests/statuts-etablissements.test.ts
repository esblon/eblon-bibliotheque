import { describe, expect, it } from "vitest"
import { transitionStatutEtablissementAutorisee } from "@/lib/statuts-etablissements"

describe("transitions de statut d’un établissement", () => {
  it.each([
    ["INITIALISATION", "ACTIF"],
    ["ACTIF", "INACTIF"],
    ["INACTIF", "ACTIF"],
    ["INACTIF", "DESACTIVE"],
  ])("autorise %s vers %s", (source, cible) => {
    expect(transitionStatutEtablissementAutorisee(source, cible)).toBe(true)
  })

  it.each([
    ["INITIALISATION", "INACTIF"],
    ["INITIALISATION", "DESACTIVE"],
    ["ACTIF", "DESACTIVE"],
    ["DESACTIVE", "ACTIF"],
    ["DESACTIVE", "INACTIF"],
  ])("interdit %s vers %s", (source, cible) => {
    expect(transitionStatutEtablissementAutorisee(source, cible)).toBe(false)
  })
})
