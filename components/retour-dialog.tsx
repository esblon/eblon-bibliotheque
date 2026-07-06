"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { retournerEmprunt } from "@/app/actions/emprunts"

export function RetourDialog({
  open,
  onOpenChange,
  emprunt,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  emprunt: { id: number; numeroEmprunt: string; titre: string | null } | null
}) {
  const router = useRouter()
  const [etat, setEtat] = useState<"ok" | "abime" | "perdu">("ok")
  const [commentaire, setCommentaire] = useState("")
  const [saving, setSaving] = useState(false)

  async function confirm() {
    if (!emprunt) return
    setSaving(true)
    try {
      const res = await retournerEmprunt({ empruntId: emprunt.id, etat, commentaire })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Retour enregistré.")
      onOpenChange(false)
      setEtat("ok")
      setCommentaire("")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un retour</DialogTitle>
          <DialogDescription>
            {emprunt?.titre} — {emprunt?.numeroEmprunt}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>État du livre au retour</Label>
            <Select value={etat} onValueChange={(v) => setEtat(v as typeof etat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ok">Retour normal (remis en rayon)</SelectItem>
                <SelectItem value="abime">Abîmé</SelectItem>
                <SelectItem value="perdu">Perdu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ret-comment">Commentaire</Label>
            <Textarea
              id="ret-comment"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={confirm} disabled={saving}>
            {saving ? "Enregistrement..." : "Confirmer le retour"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
