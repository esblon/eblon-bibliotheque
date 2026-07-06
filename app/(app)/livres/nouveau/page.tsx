import { PageHeader } from "@/components/page-header"
import { LivreForm } from "@/components/livre-form"

export default function NouveauLivrePage() {
  return (
    <div>
      <PageHeader
        title="Ajouter un livre"
        description="Le code est généré automatiquement au format FAC-[NIVEAU]-[MATIERE]-[NUMERO] si vous le laissez vide."
      />
      <LivreForm />
    </div>
  )
}
