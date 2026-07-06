"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { BookMarked } from "lucide-react"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(
        error.message === "Invalid email or password"
          ? "Email ou mot de passe incorrect"
          : (error.message ?? "Une erreur est survenue"),
      )
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-muted flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookMarked className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Annales Facobly</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de la mini-bibliothèque scolaire
          </p>
        </div>
      </div>

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
            <Label htmlFor="password">Mot de passe</Label>
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
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? "Se connecter" : "Créer un compte"}
          </Link>
        </p>
      </Card>
    </main>
  )
}
