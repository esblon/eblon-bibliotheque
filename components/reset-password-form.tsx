"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { BookMarked, AlertCircle } from "lucide-react"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const invalidLink = searchParams.get("error") === "INVALID_TOKEN" || !token

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token as string,
    })
    setLoading(false)

    if (error) {
      setError(
        error.message ??
          "Impossible de réinitialiser le mot de passe. Le lien a peut-être expiré.",
      )
      return
    }

    router.push("/sign-in?reset=success")
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-muted flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookMarked className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Bibliothèque Ebene BLON
          </h1>
          <p className="text-sm font-medium text-foreground/80">
            Lycée Moderne Facobly
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm p-6">
        {invalidLink ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Lien invalide ou expiré
              </h2>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                Ce lien de réinitialisation n&apos;est plus valide. Demandez-en
                un nouveau.
              </p>
            </div>
            <Button
              render={<Link href="/mot-de-passe-oublie" />}
              className="w-full"
            >
              Demander un nouveau lien
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground text-balance">
                Nouveau mot de passe
              </h2>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                Choisissez un nouveau mot de passe pour votre compte.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Retapez le mot de passe"
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
                {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </main>
  )
}
