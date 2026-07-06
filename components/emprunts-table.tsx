"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Undo2, Phone, Search, AlertTriangle } from "lucide-react"
import { RetourDialog } from "@/components/retour-dialog"
import { statutEmpruntColor } from "@/lib/constants"
import { formatDate, whatsappUrl, daysBetween } from "@/lib/format"

export type EmpruntRow = {
  id: number
  numeroEmprunt: string
  statut: string
  dateEmprunt: Date | string
  dateRetourPrevue: Date | string
  dateRetourReelle: Date | string | null
  titre: string | null
  codeLivre: string | null
  eleveNom: string | null
  elevePrenom: string | null
  classe: string | null
  telephoneParent: string | null
}

const STATUTS = ["Tous", "En cours", "En retard", "Retourné", "Perdu", "Abîmé"]

export function EmpruntsTable({
  emprunts,
  etablissement,
  showFilters = true,
  defaultStatut = "Tous",
}: {
  emprunts: EmpruntRow[]
  etablissement: string
  showFilters?: boolean
  defaultStatut?: string
}) {
  const [q, setQ] = useState("")
  const [statut, setStatut] = useState(defaultStatut)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<EmpruntRow | null>(null)

  const filtered = useMemo(() => {
    return emprunts.filter((e) => {
      const matchQ =
        q === "" ||
        `${e.titre ?? ""} ${e.codeLivre ?? ""} ${e.eleveNom ?? ""} ${e.elevePrenom ?? ""} ${e.numeroEmprunt}`
          .toLowerCase()
          .includes(q.toLowerCase())
      const matchStatut = statut === "Tous" || e.statut === statut
      return matchQ && matchStatut
    })
  }, [emprunts, q, statut])

  function openRetour(e: EmpruntRow) {
    setSelected(e)
    setDialogOpen(true)
  }

  function relancer(e: EmpruntRow) {
    if (!e.telephoneParent) return
    const retard = daysBetween(e.dateRetourPrevue, new Date())
    const msg = `Bonjour, ceci est un message de la ${etablissement}. L'élève ${e.elevePrenom} ${e.eleveNom} (${e.classe ?? ""}) devait rendre le livre "${e.titre}" (${e.codeLivre}) le ${formatDate(e.dateRetourPrevue)}. Ce livre est en retard de ${retard} jour(s). Merci de le rapporter rapidement. Cordialement.`
    window.open(whatsappUrl(e.telephoneParent, msg), "_blank")
  }

  return (
    <div className="grid gap-4">
      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (livre, élève, numéro)"
              className="pl-9"
            />
          </div>
          <Select value={statut} onValueChange={setStatut}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Livre</TableHead>
              <TableHead>Élève</TableHead>
              <TableHead className="hidden md:table-cell">Emprunt</TableHead>
              <TableHead className="hidden sm:table-cell">Retour prévu</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aucun emprunt.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((e) => {
              const actif = e.statut === "En cours" || e.statut === "En retard"
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.titre}</div>
                    <div className="font-mono text-xs text-muted-foreground">{e.codeLivre}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {e.eleveNom} {e.elevePrenom}
                    </div>
                    <div className="text-xs text-muted-foreground">{e.classe}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(e.dateEmprunt)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDate(e.dateRetourPrevue)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statutEmpruntColor(e.statut)}>
                      {e.statut === "En retard" && <AlertTriangle className="mr-1 size-3" />}
                      {e.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {e.statut === "En retard" && e.telephoneParent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => relancer(e)}
                          title="Relancer via WhatsApp"
                        >
                          <Phone className="size-4 text-accent" />
                          <span className="sr-only">Relancer</span>
                        </Button>
                      )}
                      {actif && (
                        <Button variant="outline" size="sm" onClick={() => openRetour(e)}>
                          <Undo2 className="mr-1 size-3" />
                          Retour
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} emprunt(s) affiché(s).</p>

      <RetourDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        emprunt={
          selected
            ? { id: selected.id, numeroEmprunt: selected.numeroEmprunt, titre: selected.titre }
            : null
        }
      />
    </div>
  )
}
