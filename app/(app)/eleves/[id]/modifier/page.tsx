import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { EleveForm } from "@/components/eleve-form"
import { getEleve } from "@/app/actions/eleves"

export default async function ModifierElevePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const eleve = await getEleve(Number(id))
  if (!eleve) notFound()

  return (
    <div className="grid gap-6">
      <PageHeader title="Modifier l'élève" description={`${eleve.prenom} ${eleve.nom}`} />
      <EleveForm
        eleve={{
          id: eleve.id,
          identifiantEleve: eleve.identifiantEleve,
          nom: eleve.nom,
          prenom: eleve.prenom,
          classe: eleve.classe,
          niveau: eleve.niveau,
          etablissement: eleve.etablissement,
          telephoneParent: eleve.telephoneParent,
          statut: eleve.statut,
          commentaire: eleve.commentaire,
        }}
      />
    </div>
  )
}
