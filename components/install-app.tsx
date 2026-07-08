"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Monitor, Apple, Check } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone) setInstalled(true)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferred) {
      setShowGuide((v) => !v)
      return
    }
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  if (installed) {
    return (
      <Card className="mt-6 w-full max-w-sm p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Check className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Application installée
            </p>
            <p className="text-xs text-muted-foreground">
              Vous utilisez déjà Eblon Biblio LMF comme application.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mt-6 w-full max-w-sm p-5">
      <div className="mb-3 flex items-center gap-2">
        <Download className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Installer l&apos;application
        </h3>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground text-pretty">
        Ajoutez Eblon Biblio LMF à votre téléphone ou ordinateur pour un accès
        rapide, en plein écran, comme une vraie application.
      </p>

      <Button onClick={handleInstall} className="w-full" size="lg">
        <Download className="size-4" />
        {deferred ? "Installer maintenant" : "Comment installer ?"}
      </Button>

      {showGuide && !deferred && (
        <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <Guide
            icon={<Smartphone className="size-4" />}
            title="Android (Chrome)"
            steps={[
              "Ouvrez le menu ⋮ en haut à droite",
              "Touchez « Ajouter à l'écran d'accueil » ou « Installer l'application »",
              "Confirmez : l'icône apparaît sur votre écran",
            ]}
          />
          <Guide
            icon={<Apple className="size-4" />}
            title="iPhone / iPad (Safari)"
            steps={[
              "Touchez le bouton Partager (carré avec une flèche)",
              "Faites défiler et touchez « Sur l'écran d'accueil »",
              "Touchez « Ajouter » en haut à droite",
            ]}
          />
          <Guide
            icon={<Monitor className="size-4" />}
            title="Windows (Chrome / Edge)"
            steps={[
              "Cliquez sur l'icône d'installation dans la barre d'adresse",
              "Ou menu ⋮ puis « Installer Eblon Biblio LMF »",
              "L'application s'ouvre dans sa propre fenêtre",
            ]}
          />
        </div>
      )}
    </Card>
  )
}

function Guide({
  icon,
  title,
  steps,
}: {
  icon: React.ReactNode
  title: string
  steps: string[]
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <p className="text-xs font-semibold text-foreground">{title}</p>
      </div>
      <ol className="ml-1 flex flex-col gap-1">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{i + 1}.</span>
            <span className="text-pretty">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
