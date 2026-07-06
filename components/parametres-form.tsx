"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NIVEAUX, MATIERES, TYPES_LIVRE, STATUTS_LIVRE, STATUTS_EMPRUNT } from "@/lib/constants"
import { saveParametres } from "@/app/actions/parametres"

export function ParametresForm({
  values,
}: {
  values: Record<string, string>
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nom_etablissement: values.nom_etablissement ?? "",
    nom_professeur: values.nom_professeur ?? "",
    duree_pret_jours: values.duree_pret_jours ?? "7",
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    try {
      const res = await saveParametres(form)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success("Paramètres enregistrés.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Établissement et prêts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="etab">Nom de l'établissement</Label>
            <Input
              id="etab"
              value={form.nom_etablissement}
              onChange={(e) => set("nom_etablissement", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prof">Nom du professeur référent</Label>
            <Input
              id="prof"
              value={form.nom_professeur}
              onChange={(e) => set("nom_professeur", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duree">Durée par défaut d'un prêt (jours)</Label>
            <Input
              id="duree"
              type="number"
              min={1}
              value={form.duree_pret_jours}
              onChange={(e) => set("duree_pret_jours", e.target.value)}
              className="max-w-32"
            />
          </div>
          <div>
            <Button onClick={submit} disabled={saving} size="lg">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listes de référence</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <RefList label="Niveaux scolaires" items={NIVEAUX} />
          <RefList label="Matières" items={MATIERES} />
          <RefList label="Types de livres" items={TYPES_LIVRE} />
          <RefList label="Statuts de livre" items={STATUTS_LIVRE} />
          <RefList label="Statuts d'emprunt" items={STATUTS_EMPRUNT} />
          <p className="text-xs text-muted-foreground">
            Ces listes sont utilisées dans toute l'application. La personnalisation avancée sera
            disponible dans une prochaine version.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function RefList({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div className="grid gap-2">
      <span className="font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <Badge key={i} variant="secondary">
            {i}
          </Badge>
        ))}
      </div>
    </div>
  )
}
