"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { BookMarked } from "lucide-react"
import { InstallApp } from "@/components/install-app"

export function AuthForm({ mode, publicSignupEnabled = true }: { mode: "sign-in" | "sign-up"; publicSignupEnabled?: boolean }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const isSignUp = mode === "sign-up"

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("reset") === "success") setResetSuccess(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (!error) {
        window.location.assign("/apres-connexion")
        return
      }

      const message = error.message?.toLowerCase() ?? ""
      setError(
        error.message === "Invalid email or password"
          ? "Email ou mot de passe incorrect"
          : error.status === 422 || message.includes("already exists") || message.includes("already use")
            ? "Cette adresse email est déjà utilisée"
            : error.status === 400 && message.includes("password")
              ? "Le mot de passe ne respecte pas les critères requis"
              : error.status && error.status >= 500
                ? "Le service d’authentification est temporairement indisponible"
                : (error.message ?? "Une erreur interne est survenue"),
      )
    } catch {
      setError("La connexion n’a pas pu être finalisée. Réessayez.")
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
            Bibliothèque Ebene BLON
          </h1>
          <p className="text-sm font-medium text-foreground/80">
            Lycée Moderne Facobly
          </p>
          <p className="text-sm text-muted-foreground">
            Gestion de la Bibliothèque
          </p>
        </div>
      </div>

      <p className="mb-6 max-w-sm text-center text-sm leading-relaxed text-muted-foreground text-pretty">
        Bienvenue sur l&apos;espace de gestion de la bibliothèque. Cette application est réservée à l&apos;équipe
        pédagogique pour le suivi des livres, des élèves et des prêts.
      </p>

      <Card className="w-full max-w-sm p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground text-balance">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            {isSignUp
              ? "Le premier compte créé devient administrateur."
              : "Connectez-vous pour accéder à la bibliothèque."}
          </p>
        </div>

        {resetSuccess && !isSignUp && (
          <div
            className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Ex : Professeur Koné"
              />
            </div>
          )}
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              {!isSignUp && (
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="8 caractères minimum"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading
              ? "Veuillez patienter..."
              : isSignUp
                ? "Créer le compte"
                : "Se connecter"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? "Vous avez déjà un compte ? " : "Pas encore de compte ? "}
          {(isSignUp || publicSignupEnabled) && <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? "Se connecter" : "Créer un compte"}
          </Link>}
        </p>
      </Card>

      <InstallApp />
    </main>
  )
}
