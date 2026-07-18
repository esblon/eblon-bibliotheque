"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createLivre, updateLivre, type LivreInput } from "@/app/actions/livres"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  NIVEAUX,
  MATIERES,
  TYPES_LIVRE,
  ETATS_PHYSIQUES,
  STATUTS_LIVRE,
  LOCALISATIONS,
} from "@/lib/constants"

type LivreDefaults = Partial<LivreInput> & { id?: number }

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function LivreForm({ livre }: { livre?: LivreDefaults }) {
  const router = useRouter()
  const isEdit = Boolean(livre?.id)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<LivreInput>({
    codeLivre: livre?.codeLivre ?? "",
    titre: livre?.titre ?? "",
    niveau: livre?.niveau ?? "3e",
    matiere: livre?.matiere ?? "Mathématiques",
    typeLivre: livre?.typeLivre ?? "Annale",
    edition: livre?.edition ?? "",
    etatPhysique: livre?.etatPhysique ?? "Bon",
    statut: livre?.statut ?? "Disponible",
    localisation: livre?.localisation ?? "Facobly",
    commentaire: livre?.commentaire ?? "",
  })

  const set = (key: keyof LivreInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titre.trim()) {
      toast.error("Le titre est obligatoire.")
      return
    }
    setLoading(true)
    const res = isEdit
      ? await updateLivre(livre!.id!, form)
      : await createLivre(form)
    setLoading(false)

    if ("error" in res && res.error) {
      toast.error(res.error)
      return
    }
    toast.success(isEdit ? "Livre modifié." : "Livre ajouté.")
    router.push("/livres")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code livre (laisser vide pour générer)">
            <Input
              value={form.codeLivre}
              onChange={(e) => set("codeLivre", e.target.value)}
              placeholder="Ex : FAC-3E-MATH-001"
            />
          </Field>
          <Field label="Titre *">
            <Input
              value={form.titre}
              onChange={(e) => set("titre", e.target.value)}
              placeholder="Ex : Annales Mathématiques 3e"
              required
            />
          </Field>

          <Field label="Niveau">
            <Select
              value={form.niveau}
              onValueChange={(v) => v && set("niveau", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NIVEAUX.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Matière">
            <Select
              value={form.matiere}
              onValueChange={(v) => v && set("matiere", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATIERES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Type">
            <Select
              value={form.typeLivre}
              onValueChange={(v) => v && set("typeLivre", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_LIVRE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Année / édition">
            <Input
              value={form.edition}
              onChange={(e) => set("edition", e.target.value)}
              placeholder="Ex : 2023"
            />
          </Field>

          <Field label="État physique">
            <Select
              value={form.etatPhysique}
              onValueChange={(v) => v && set("etatPhysique", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ETATS_PHYSIQUES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Statut">
            <Select
              value={form.statut}
              onValueChange={(v) => v && set("statut", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_LIVRE.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Localisation">
            <Select
              value={form.localisation}
              onValueChange={(v) => v && set("localisation", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALISATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Commentaire">
            <Textarea
              value={form.commentaire}
              onChange={(e) => set("commentaire", e.target.value)}
              rows={3}
              placeholder="Note interne facultative"
            />
          </Field>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter le livre"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </Card>
    </form>
  )
}
