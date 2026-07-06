"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Phone, BookOpen } from "lucide-react"
import { statutEmpruntColor } from "@/lib/constants"
import { formatDate, whatsappUrl } from "@/lib/format"

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
  commentaire: string | null
}

type Emprunt = {
  id: number
  numeroEmprunt: string
  statut: string
  dateEmprunt: Date | string
  dateRetourPrevue: Date | string
  dateRetourReelle: Date | string | null
  titre: string | null
  codeLivre: string | null
}

export function EleveDetail({
  eleve,
  emprunts,
  etablissement,
}: {
  eleve: Eleve
  emprunts: Emprunt[]
  etablissement: string
}) {
  const enCours = emprunts.filter((e) => e.statut === "En cours" || e.statut === "En retard")
  const retards = enCours.filter((e) => e.statut === "En retard")

  function relancer() {
    if (!eleve.telephoneParent) return
    const titres = retards.map((r) => `- ${r.titre} (${r.codeLivre})`).join("\n")
    const msg = `Bonjour, ceci est un message de la ${etablissement}. L'élève ${eleve.prenom} ${eleve.nom} (${eleve.classe ?? ""}) a des livres en retard :\n${titres}\nMerci de bien vouloir les rapporter. Cordialement.`
    window.open(whatsappUrl(eleve.telephoneParent, msg), "_blank")
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Identifiant" value={eleve.identifiantEleve} mono />
            <Info label="Classe" value={eleve.classe || "—"} />
            <Info label="Niveau" value={eleve.niveau} />
            <Info label="Établissement" value={eleve.etablissement || "—"} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Téléphone parent</span>
              <span>{eleve.telephoneParent || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Statut</span>
              <Badge variant={eleve.statut === "Actif" ? "default" : "outline"}>{eleve.statut}</Badge>
            </div>
            {eleve.commentaire && (
              <p className="rounded-md bg-muted p-3 text-muted-foreground">{eleve.commentaire}</p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="outline">
                <Link href={`/eleves/${eleve.id}/modifier`}>
                  <Pencil className="mr-2 size-4" />
                  Modifier
                </Link>
              </Button>
              {eleve.telephoneParent && retards.length > 0 && (
                <Button onClick={relancer} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Phone className="mr-2 size-4" />
                  Relancer via WhatsApp
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Emprunts en cours</p>
                <p className="text-3xl font-semibold">{enCours.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Dont en retard</p>
                <p className="text-3xl font-semibold text-destructive">{retards.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4" />
                Historique des emprunts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livre</TableHead>
                    <TableHead className="hidden sm:table-cell">Emprunt</TableHead>
                    <TableHead className="hidden sm:table-cell">Retour prévu</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emprunts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Aucun emprunt enregistré.
                      </TableCell>
                    </TableRow>
                  )}
                  {emprunts.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.titre}</div>
                        <div className="font-mono text-xs text-muted-foreground">{e.codeLivre}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(e.dateEmprunt)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(e.dateRetourPrevue)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statutEmpruntColor(e.statut)}>
                          {e.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  )
}
