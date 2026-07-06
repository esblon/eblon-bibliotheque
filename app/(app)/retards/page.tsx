import { AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EmpruntsTable } from "@/components/emprunts-table"
import { getRetards } from "@/app/actions/emprunts"
import { getParametre } from "@/app/actions/parametres"

export default async function RetardsPage() {
  const [retards, etablissement] = await Promise.all([
    getRetards(),
    getParametre("nom_etablissement"),
  ])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Retards"
        description="Livres non rendus après la date prévue. Relancez les parents en un clic."
      />
      {retards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/15">
            <AlertTriangle className="size-6 text-accent" />
          </div>
          <p className="text-lg font-medium">Aucun retard</p>
          <p className="text-sm text-muted-foreground">Tous les livres empruntés sont dans les délais.</p>
        </div>
      ) : (
        <EmpruntsTable
          emprunts={retards}
          etablissement={etablissement}
          showFilters={false}
        />
      )}
    </div>
  )
}
