"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { NIVEAUX, MATIERES, STATUTS_LIVRE, TYPES_LIVRE, statutLivreColor } from "@/lib/constants"
import { Search, BookMarked } from "lucide-react"

type Livre = {
  id: number
  codeLivre: string
  titre: string
  niveau: string
  matiere: string
  typeLivre: string
  statut: string
  etatPhysique: string
}

const ALL = "__all__"

export function LivresTable({ livres }: { livres: Livre[] }) {
  const [search, setSearch] = useState("")
  const [niveau, setNiveau] = useState(ALL)
  const [matiere, setMatiere] = useState(ALL)
  const [statut, setStatut] = useState(ALL)
  const [type, setType] = useState(ALL)

  const filtered = useMemo(() => {
    return livres.filter((l) => {
      if (
        search &&
        !l.titre.toLowerCase().includes(search.toLowerCase()) &&
        !l.codeLivre.toLowerCase().includes(search.toLowerCase())
      )
        return false
      if (niveau !== ALL && l.niveau !== niveau) return false
      if (matiere !== ALL && l.matiere !== matiere) return false
      if (statut !== ALL && l.statut !== statut) return false
      if (type !== ALL && l.typeLivre !== type) return false
      return true
    })
  }, [livres, search, niveau, matiere, statut, type])

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre ou code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FilterSelect
              value={niveau}
              onChange={setNiveau}
              placeholder="Niveau"
              options={NIVEAUX as unknown as string[]}
            />
            <FilterSelect
              value={matiere}
              onChange={setMatiere}
              placeholder="Matière"
              options={MATIERES as unknown as string[]}
            />
            <FilterSelect
              value={statut}
              onChange={setStatut}
              placeholder="Statut"
              options={STATUTS_LIVRE as unknown as string[]}
            />
            <FilterSelect
              value={type}
              onChange={setType}
              placeholder="Type"
              options={TYPES_LIVRE as unknown as string[]}
            />
          </div>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        {filtered.length} livre(s) affiché(s)
      </p>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <BookMarked className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucun livre ne correspond à ces critères.
          </p>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((l) => (
              <Link key={l.id} href={`/livres/${l.id}`}>
                <Card className="p-4 active:bg-secondary">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {l.titre}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {l.codeLivre}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {l.niveau} · {l.matiere}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={statutLivreColor(l.statut)}
                    >
                      {l.statut}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">
                      {l.codeLivre}
                    </TableCell>
                    <TableCell className="font-medium">{l.titre}</TableCell>
                    <TableCell>{l.niveau}</TableCell>
                    <TableCell>{l.matiere}</TableCell>
                    <TableCell>{l.etatPhysique}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statutLivreColor(l.statut)}
                      >
                        {l.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/livres/${l.id}`} />}
                        variant="ghost"
                        size="sm"
                      >
                        Ouvrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {(v) => (v === ALL ? `${placeholder} : tous` : (v as string))}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder} : tous</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
