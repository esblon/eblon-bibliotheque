"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Archive, History, Search } from "lucide-react"
import { NIVEAUX } from "@/lib/constants"
import { archiveEleve } from "@/app/actions/eleves"

type Eleve = {
  id: number
  identifiantEleve: string
  nom: string
  prenom: string
  classe: string | null
  niveau: string
  etablissement: string | null
  telephoneParent: string | null
  statut: string
  empruntsEnCours?: number
}

export function ElevesTable({ eleves, isAdmin }: { eleves: Eleve[]; isAdmin: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [niveau, setNiveau] = useState("Tous")

  const filtered = useMemo(() => {
    return eleves.filter((e) => {
      const matchQ =
        q === "" ||
        `${e.nom} ${e.prenom} ${e.identifiantEleve} ${e.classe ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase())
      const matchNiveau = niveau === "Tous" || e.niveau === niveau
      return matchQ && matchNiveau
    })
  }, [eleves, q, niveau])

  async function onArchive(id: number) {
    if (!confirm("Archiver cet élève ? Il n'apparaîtra plus dans les listes actives.")) return
    try {
      await archiveEleve(id)
      toast.success("Élève archivé.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un élève (nom, identifiant, classe)"
            className="pl-9"
          />
        </div>
        <Select value={niveau} onValueChange={(value) => value && setNiveau(value)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue>
              {(v) => (v === "Tous" ? "Tous les niveaux" : (v as string))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tous">Tous les niveaux</SelectItem>
            {NIVEAUX.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Élève</TableHead>
              <TableHead className="hidden sm:table-cell">Identifiant</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead className="hidden md:table-cell">Établissement</TableHead>
              <TableHead>En cours</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Aucun élève trouvé.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  {e.nom} {e.prenom}
                </TableCell>
                <TableCell className="hidden sm:table-cell font-mono text-xs">
                  {e.identifiantEleve}
                </TableCell>
                <TableCell>{e.classe || "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {e.etablissement || "—"}
                </TableCell>
                <TableCell>
                  {e.empruntsEnCours ? (
                    <Badge variant="secondary">{e.empruntsEnCours}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={e.statut === "Actif" ? "default" : "outline"}>{e.statut}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-8" />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link href={`/eleves/${e.id}`} />}>
                        <History className="mr-2 size-4" />
                        Historique
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={<Link href={`/eleves/${e.id}/modifier`} />}
                      >
                        <Pencil className="mr-2 size-4" />
                        Modifier
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => onArchive(e.id)} className="text-destructive">
                          <Archive className="mr-2 size-4" />
                          Archiver
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} élève(s) affiché(s).</p>
    </div>
  )
}
