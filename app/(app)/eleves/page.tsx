import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { ElevesTable } from "@/components/eleves-table"
import { getEleves } from "@/app/actions/eleves"
import { getRole } from "@/lib/session"

export default async function ElevesPage() {
  const [eleves, role] = await Promise.all([getEleves(), getRole()])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Élèves"
        description="Gérez les élèves inscrits à la bibliothèque."
        action={
          <Button render={<Link href="/eleves/nouveau" />} size="lg">
            <Plus className="mr-2 size-4" />
            Ajouter un élève
          </Button>
        }
      />
      <ElevesTable eleves={eleves} isAdmin={role === "admin"} />
    </div>
  )
}
