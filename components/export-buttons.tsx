"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from "lucide-react"
import { toCsv, downloadCsv } from "@/lib/csv"
import { getAllLivresForExport } from "@/app/actions/livres"
import { getAllElevesForExport } from "@/app/actions/eleves"
import { getAllEmpruntsForExport } from "@/app/actions/emprunts"

export function ExportButtons() {
  const [busy, setBusy] = useState(false)

  async function run(type: "livres" | "eleves" | "emprunts") {
    setBusy(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      if (type === "livres") {
        const data = await getAllLivresForExport()
        const csv = toCsv(data as unknown as Record<string, unknown>[], [
          { key: "codeLivre", label: "Code livre" },
          { key: "titre", label: "Titre" },
          { key: "niveau", label: "Niveau" },
          { key: "matiere", label: "Matière" },
          { key: "typeLivre", label: "Type" },
          { key: "edition", label: "Édition" },
          { key: "etatPhysique", label: "État" },
          { key: "statut", label: "Statut" },
          { key: "localisation", label: "Localisation" },
          { key: "commentaire", label: "Commentaire" },
        ])
        downloadCsv(`livres-${today}.csv`, csv)
      } else if (type === "eleves") {
        const data = await getAllElevesForExport()
        const csv = toCsv(data as unknown as Record<string, unknown>[], [
          { key: "identifiantEleve", label: "Identifiant" },
          { key: "nom", label: "Nom" },
          { key: "prenom", label: "Prénom" },
          { key: "classe", label: "Classe" },
          { key: "niveau", label: "Niveau" },
          { key: "etablissement", label: "Établissement" },
          { key: "telephoneParent", label: "Téléphone parent" },
          { key: "statut", label: "Statut" },
          { key: "commentaire", label: "Commentaire" },
        ])
        downloadCsv(`eleves-${today}.csv`, csv)
      } else {
        const data = await getAllEmpruntsForExport()
        const csv = toCsv(data as unknown as Record<string, unknown>[], [
          { key: "numeroEmprunt", label: "Numéro" },
          { key: "codeLivre", label: "Code livre" },
          { key: "titre", label: "Titre" },
          { key: "eleveNom", label: "Nom élève" },
          { key: "elevePrenom", label: "Prénom élève" },
          { key: "classe", label: "Classe" },
          { key: "dateEmprunt", label: "Date emprunt" },
          { key: "dateRetourPrevue", label: "Retour prévu" },
          { key: "dateRetourReelle", label: "Retour réel" },
          { key: "statut", label: "Statut" },
          { key: "commentaire", label: "Commentaire" },
        ])
        downloadCsv(`emprunts-${today}.csv`, csv)
      }
      toast.success("Export téléchargé.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'export")
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" disabled={busy} />}>
        <Download className="mr-2 size-4" />
        Exporter
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Export CSV / Excel</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => run("livres")}>Livres</DropdownMenuItem>
          <DropdownMenuItem onClick={() => run("eleves")}>Élèves</DropdownMenuItem>
          <DropdownMenuItem onClick={() => run("emprunts")}>
            Emprunts
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
