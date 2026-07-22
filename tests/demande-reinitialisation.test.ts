import { describe, expect, it, vi } from "vitest"
import { demanderReinitialisation } from "@/lib/demande-reinitialisation"

describe("demande de réinitialisation", () => {
  it("n’envoie aucun e-mail lorsque le compte n’existe pas", async () => {
    const envoyerLien = vi.fn()
    const resultat = await demanderReinitialisation(
      " Inconnu@Example.com ",
      "/reinitialiser-mot-de-passe",
      { compteExiste: vi.fn(async () => false), envoyerLien },
    )

    expect(resultat).toEqual({ compteExiste: false })
    expect(envoyerLien).not.toHaveBeenCalled()
  })

  it("envoie le lien lorsque le compte existe", async () => {
    const envoyerLien = vi.fn(async () => undefined)
    const resultat = await demanderReinitialisation(
      " Eleve@Example.com ",
      "/reinitialiser-mot-de-passe",
      { compteExiste: vi.fn(async () => true), envoyerLien },
    )

    expect(resultat).toEqual({ compteExiste: true })
    expect(envoyerLien).toHaveBeenCalledWith(
      "eleve@example.com",
      "/reinitialiser-mot-de-passe",
    )
  })
})
