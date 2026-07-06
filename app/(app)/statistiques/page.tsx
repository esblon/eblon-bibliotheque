import { PageHeader } from "@/components/page-header"
import { StatistiquesView } from "@/components/statistiques-view"
import { ExportButtons } from "@/components/export-buttons"
import { getStatistiques } from "@/app/actions/statistiques"

export default async function StatistiquesPage() {
  const stats = await getStatistiques()

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Statistiques"
        description="Suivi de l'activité de la bibliothèque et export des données."
        action={<ExportButtons />}
      />
      <StatistiquesView stats={stats} />
    </div>
  )
}
