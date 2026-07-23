import { describe, expect, it } from "vitest"
import { classesPourNiveau, niveauxPourEtablissement, type NiveauInscription } from "@/lib/referentiels-inscription"

const niveaux: NiveauInscription[] = [
  { id: "primaire", code: "PRIMAIRE", nom: "Primaire", classes: [] },
  { id: "cycle1", code: "CYCLE_1", nom: "1er Cycle", classes: [
    { id: "6e", niveau_scolaire_id: "cycle1", nom: "6e" },
    { id: "3e", niveau_scolaire_id: "cycle1", nom: "3e" },
  ] },
  { id: "cycle2", code: "CYCLE_2", nom: "2nd Cycle", classes: [
    { id: "2nd-a2", niveau_scolaire_id: "cycle2", nom: "2ndA2" },
    { id: "2nd-c", niveau_scolaire_id: "cycle2", nom: "2ndC" },
  ] },
]

describe("niveaux proposés selon l’établissement", () => {
  it.each(["PRIMAIRE", "PERISCOLAIRE"] as const)("masque les cycles pour un établissement %s", (type) => {
    expect(niveauxPourEtablissement(niveaux, { id: "e", nom: "École", type_etablissement: type }).map(({ code }) => code)).toEqual(["PRIMAIRE"])
  })

  it("autorise tous les niveaux dans un établissement secondaire", () => {
    expect(niveauxPourEtablissement(niveaux, { id: "e", nom: "Collège", type_etablissement: "SECONDAIRE" })).toEqual(niveaux)
  })

  it("propose uniquement les classes du niveau choisi", () => {
    expect(classesPourNiveau(niveaux, "cycle1").map(({ nom }) => nom)).toEqual(["6e", "3e"])
    expect(classesPourNiveau(niveaux, "cycle2").map(({ nom }) => nom)).toEqual(["2ndA2", "2ndC"])
  })

  it("ne propose aucune classe avant le choix du niveau", () => {
    expect(classesPourNiveau(niveaux, "")).toEqual([])
    expect(classesPourNiveau(niveaux, "inconnu")).toEqual([])
  })
})
