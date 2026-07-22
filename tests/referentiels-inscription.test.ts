import { describe, expect, it } from "vitest"
import { classesPourNiveau, type NiveauInscription } from "@/lib/referentiels-inscription"

const niveaux: NiveauInscription[] = [
  { id: "cycle-1", nom: "1er Cycle", classes: [
    { id: "6e", niveau_scolaire_id: "cycle-1", nom: "6e" },
    { id: "3e", niveau_scolaire_id: "cycle-1", nom: "3e" },
  ] },
  { id: "cycle-2", nom: "2nd Cycle", classes: [
    { id: "2nd-a2", niveau_scolaire_id: "cycle-2", nom: "2ndA2" },
    { id: "2nd-c", niveau_scolaire_id: "cycle-2", nom: "2ndC" },
  ] },
]

describe("référentiels d’inscription élève", () => {
  it("propose uniquement les classes du niveau choisi", () => {
    expect(classesPourNiveau(niveaux, "cycle-1").map(({ nom }) => nom)).toEqual(["6e", "3e"])
    expect(classesPourNiveau(niveaux, "cycle-2").map(({ nom }) => nom)).toEqual(["2ndA2", "2ndC"])
  })

  it("ne propose aucune classe avant le choix du niveau", () => {
    expect(classesPourNiveau(niveaux, "")).toEqual([])
    expect(classesPourNiveau(niveaux, "inconnu")).toEqual([])
  })
})
