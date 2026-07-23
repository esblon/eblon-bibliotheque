import { describe, expect, it } from "vitest"
import { ErreurEnvoiEmail } from "@/lib/erreur-email"
import { messageErreur } from "@/lib/frontend-api/erreurs"

describe("erreurs d’envoi d’e-mail", () => {
  it("affiche le message métier d’une invitation échouée", () => {
    expect(messageErreur(new ErreurEnvoiEmail("Invitation non envoyée."))).toBe("Invitation non envoyée.")
  })

  it("masque les erreurs techniques inattendues", () => {
    expect(messageErreur(new Error("secret technique"))).toBe("Impossible de joindre le service. Vérifiez que l’application est démarrée.")
  })
})
