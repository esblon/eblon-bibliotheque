"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QrScanner } from "@/components/qr-scanner"
import { Search, BookCheck, X } from "lucide-react"
import { getLivreByCode } from "@/app/actions/livres"
import { createEmprunt } from "@/app/actions/emprunts"
import { statutLivreColor } from "@/lib/constants"

type EleveOption = {
  id: number
  identifiantEleve: string
  nom: string
  prenom: string
  classe: string | null
}

type Livre = {
  id: number
  codeLivre: string
  titre: string
  niveau: string
  matiere: string
  statut: string
}

export function NouveauPretForm({
  eleves,
  dureePret,
  initialCode,
}: {
  eleves: EleveOption[]
  dureePret: number
  initialCode?: string
}) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode ?? "")
  const [livre, setLivre] = useState<Livre | null>(null)
  const [looking, setLooking] = useState(false)
  const [eleveId, setEleveId] = useState<string>("")
  const [commentaire, setCommentaire] = useState("")
  const [saving, setSaving] = useState(false)

  const defaultDue = new Date(Date.now() + dureePret * 24 * 60 * 60 * 1000)
  const [dateRetour, setDateRetour] = useState(defaultDue.toISOString().slice(0, 10))

  async function lookup(rawCode: string) {
    const c = rawCode.trim()
    if (!c) return
    setLooking(true)
    try {
      const found = await getLivreByCode(c)
      if (!found) {
        toast.error(`Aucun livre trouvé pour le code ${c}.`)
        setLivre(null)
        return
      }
      setLivre(found)
      if (found.statut !== "Disponible") {
        toast.warning(`Ce livre n'est pas disponible (statut : ${found.statut}).`)
      }
    } catch {
      toast.error("Erreur lors de la recherche du livre.")
    } finally {
      setLooking(false)
    }
  }

  function onScan(text: string) {
    setCode(text)
    lookup(text)
  }

  async function submit() {
    if (!livre) {
      toast.error("Sélectionnez d'abord un livre.")
      return
    }
    if (!eleveId) {
      toast.error("Sélectionnez un élève.")
      return
    }
    setSaving(true)
    try {
      const res = await createEmprunt({
        livreId: livre.id,
        eleveId: Number(eleveId),
        dateRetourPrevue: dateRetour,
        commentaire,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Emprunt enregistré.")
      router.push("/emprunts")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const canLend = livre && livre.statut === "Disponible"

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

          <QrScanner onScan={onScan} />
        </CardContent>
      </Card>

      {livre && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-sm text-muted-foreground">{livre.codeLivre}</div>
                <div className="text-lg font-semibold">{livre.titre}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {livre.niveau} · {livre.matiere}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className={statutLivreColor(livre.statut)}>
                  {livre.statut}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setLivre(null)}>
                  <X className="mr-1 size-3" />
                  Changer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canLend && (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <div className="grid gap-2">
              <Label>Élève</Label>
              <Select value={eleveId} onValueChange={setEleveId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un élève" />
                </SelectTrigger>
                <SelectContent>
                  {eleves.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nom} {e.prenom} {e.classe ? `· ${e.classe}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateRetour">Date de retour prévue</Label>
              <Input
                id="dateRetour"
                type="date"
                value={dateRetour}
                onChange={(e) => setDateRetour(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Par défaut {dureePret} jours après aujourd'hui.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commentaire">Commentaire (facultatif)</Label>
              <Textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
              />
            </div>

            <Button size="lg" onClick={submit} disabled={saving}>
              <BookCheck className="mr-2 size-4" />
              {saving ? "Enregistrement..." : "Enregistrer l'emprunt"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
