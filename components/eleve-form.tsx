"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NIVEAUX, STATUTS_ELEVE } from "@/lib/constants"
import { createEleve, updateEleve } from "@/app/actions/eleves"

type EleveInput = {
  id?: number
  identifiantEleve?: string
  nom?: string
  prenom?: string
  classe?: string | null
  niveau?: string
  etablissement?: string | null
  telephoneParent?: string | null
  statut?: string
  commentaire?: string | null
}

export function EleveForm({ eleve }: { eleve?: EleveInput }) {
  const router = useRouter()
  const isEdit = Boolean(eleve?.id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    identifiantEleve: eleve?.identifiantEleve ?? "",
    nom: eleve?.nom ?? "",
    prenom: eleve?.prenom ?? "",
    classe: eleve?.classe ?? "",
    niveau: eleve?.niveau ?? "3e",
    etablissement: eleve?.etablissement ?? "",
    telephoneParent: eleve?.telephoneParent ?? "",
    statut: eleve?.statut ?? "Actif",
    commentaire: eleve?.commentaire ?? "",
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast.error("Le nom et le prénom sont obligatoires.")
      return
    }
    setSaving(true)
    try {
      const res =
        isEdit && eleve?.id ? await updateEleve(eleve.id, form) : await createEleve(form)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(isEdit ? "Élève modifié." : "Élève ajouté.")
      router.push("/eleves")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            placeholder="Kouamé"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="prenom">Prénom *</Label>
          <Input
            id="prenom"
            value={form.prenom}
            onChange={(e) => set("prenom", e.target.value)}
            placeholder="Jean"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="identifiant">Identifiant élève</Label>
          <Input
            id="identifiant"
            value={form.identifiantEleve}
            onChange={(e) => set("identifiantEleve", e.target.value)}
            placeholder="Généré automatiquement si vide"
          />
          <p className="text-xs text-muted-foreground">Laissez vide pour générer un identifiant (ELV-XXX).</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="classe">Classe</Label>
          <Input
            id="classe"
            value={form.classe}
            onChange={(e) => set("classe", e.target.value)}
            placeholder="3e A"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Niveau</Label>
          <Select value={form.niveau} onValueChange={(v) => set("niveau", v)}>
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
        </div>
        <div className="grid gap-2">
          <Label>Statut</Label>
          <Select value={form.statut} onValueChange={(v) => set("statut", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUTS_ELEVE.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="etablissement">Établissement</Label>
          <Input
            id="etablissement"
            value={form.etablissement}
            onChange={(e) => set("etablissement", e.target.value)}
            placeholder="Collège de Facobly"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telephone">Téléphone parent / tuteur</Label>
          <Input
            id="telephone"
            value={form.telephoneParent}
            onChange={(e) => set("telephoneParent", e.target.value)}
            placeholder="Ex : 0700000000"
            inputMode="tel"
          />
          <p className="text-xs text-muted-foreground">Facultatif. Utilisé pour les relances WhatsApp.</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="commentaire">Commentaire</Label>
        <Textarea
          id="commentaire"
          value={form.commentaire}
          onChange={(e) => set("commentaire", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter l'élève"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
