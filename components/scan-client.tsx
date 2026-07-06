"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrScanner } from "@/components/qr-scanner"
import { RetourDialog } from "@/components/retour-dialog"
import { Search, BookOpen, BookCheck, Undo2 } from "lucide-react"
import { getLivreByCode } from "@/app/actions/livres"
import { getEmpruntActifByLivre } from "@/app/actions/emprunts"
import { statutLivreColor } from "@/lib/constants"

type Livre = {
  id: number
  codeLivre: string
  titre: string
  niveau: string
  matiere: string
  statut: string
}

export function ScanClient() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [livre, setLivre] = useState<Livre | null>(null)
  const [empruntActif, setEmpruntActif] = useState<{
    id: number
    numeroEmprunt: string
    titre: string | null
  } | null>(null)
  const [looking, setLooking] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function lookup(rawCode: string) {
    const c = rawCode.trim()
    if (!c) return
    setLooking(true)
    setLivre(null)
    setEmpruntActif(null)
    try {
      const found = await getLivreByCode(c)
      if (!found) {
        toast.error(`Aucun livre trouvé pour le code ${c}.`)
        return
      }
      setLivre(found)
      if (found.statut === "Emprunté") {
        const emp = await getEmpruntActifByLivre(found.id)
        if (emp) setEmpruntActif({ id: emp.id, numeroEmprunt: emp.numeroEmprunt, titre: found.titre })
      }
    } catch {
      toast.error("Erreur lors de la recherche.")
    } finally {
      setLooking(false)
    }
  }

  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="code">Code du livre</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    lookup(code)
                  }
                }}
                placeholder="FAC-3E-MATH-001"
                className="font-mono"
              />
              <Button type="button" onClick={() => lookup(code)} disabled={looking}>
                <Search className="mr-2 size-4" />
                {looking ? "..." : "Chercher"}
              </Button>
            </div>
          </div>
          <QrScanner
            onScan={(text) => {
              setCode(text)
              lookup(text)
            }}
          />
        </CardContent>
      </Card>

      {livre && (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-sm text-muted-foreground">{livre.codeLivre}</div>
                <div className="text-lg font-semibold">{livre.titre}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {livre.niveau} · {livre.matiere}
                </div>
              </div>
              <Badge variant="outline" className={statutLivreColor(livre.statut)}>
                {livre.statut}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push(`/livres/${livre.id}`)}>
                <BookOpen className="mr-2 size-4" />
                Ouvrir la fiche
              </Button>
              {livre.statut === "Disponible" && (
                <Button onClick={() => router.push(`/emprunts/nouveau?code=${livre.codeLivre}`)}>
                  <BookCheck className="mr-2 size-4" />
                  Prêter ce livre
                </Button>
              )}
              {livre.statut === "Emprunté" && empruntActif && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Undo2 className="mr-2 size-4" />
                  Enregistrer le retour
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <RetourDialog open={dialogOpen} onOpenChange={setDialogOpen} emprunt={empruntActif} />
    </div>
  )
}
