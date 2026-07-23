import { describe, expect, it } from "vitest"
import { configurations } from "@/lib/repositories/ressources"

describe("visibilité des emprunteurs", () => {
  it("affiche les créations récentes en premier et permet la recherche par email", () => {
    expect(configurations.emprunteurs.tri[0]).toBe("date_creation")
    expect(configurations.emprunteurs.recherche).toContain("email")
  })
})
