import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { EmpruntsTable } from "@/components/emprunts-table"
import { getEmprunts } from "@/app/actions/emprunts"
import { getParametre } from "@/app/actions/parametres"

export default async function EmpruntsPage() {
  const [emprunts, etablissement] = await Promise.all([
    getEmprunts(),
    getParametre("nom_etablissement"),
  ])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Emprunts"
        description="Tous les emprunts, en cours et passés."
        action={
          <Button asChild size="lg">
            <Link href="/emprunts/nouveau">
              <Plus className="mr-2 size-4" />
              Nouveau prêt
            </Link>
          </Button>
        }
      />
      <EmpruntsTable emprunts={emprunts} etablissement={etablissement} />
    </div>
  )
}
