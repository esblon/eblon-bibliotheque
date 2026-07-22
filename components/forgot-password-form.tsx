"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { BookMarked, MailCheck } from "lucide-react"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [accountExists, setAccountExists] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/mot-de-passe-oublie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: "/reinitialiser-mot-de-passe",
        }),
      })

      if (!response.ok) throw new Error()

      const result = (await response.json()) as { compteExiste: boolean }
      setAccountExists(result.compteExiste)
      setSent(true)
    } catch {
      setError("Une erreur est survenue. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-muted flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookMarked className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Eblon Mini Biblio LMF
          </h1>
          <p className="text-sm font-medium text-foreground/80">
            Lycée Moderne Facobly
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm p-6">
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <MailCheck className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {accountExists
                  ? "Compte trouvé — e-mail envoyé"
                  : "Aucun compte trouvé"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                {accountExists ? (
                  <>
                    Un compte existe bien avec l’adresse e-mail{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                    Consultez votre boîte e-mail et pensez à vérifier le dossier
                    des spams. Le lien expire dans 1 heure.
                  </>
                ) : (
                  <>
                    Aucun compte n’existe avec l’adresse e-mail{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                  </>
                )}
              </p>
            </div>
            <Button
              render={<Link href="/sign-in" />}
              variant="outline"
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground text-balance">
                Mot de passe oublié
              </h2>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                Saisissez votre email : nous vous enverrons un lien pour définir
                un nouveau mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="exemple@email.com"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              <Link
                href="/sign-in"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </Card>
    </main>
  )
}
