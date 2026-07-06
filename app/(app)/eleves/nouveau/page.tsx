import { PageHeader } from "@/components/page-header"
import { EleveForm } from "@/components/eleve-form"

export default function NouvelElevePage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Ajouter un élève" description="Renseignez les informations de l'élève." />
      <EleveForm />
    </div>
  )
}
