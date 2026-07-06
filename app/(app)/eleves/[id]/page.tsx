import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { EleveDetail } from "@/components/eleve-detail"
import { getEleve, getEleveEmprunts } from "@/app/actions/eleves"
import { getParametre } from "@/app/actions/parametres"

export default async function EleveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const eleveId = Number(id)
  const eleve = await getEleve(eleveId)
  if (!eleve) notFound()

  const [emprunts, etablissement] = await Promise.all([
    getEleveEmprunts(eleveId),
    getParametre("nom_etablissement"),
  ])

  return (
    <div className="grid gap-6">
      <PageHeader title={`${eleve.prenom} ${eleve.nom}`} description="Fiche élève et historique des emprunts." />
      <EleveDetail
        eleve={eleve}
        emprunts={emprunts}
        etablissement={etablissement || "Bibliothèque Annales Facobly"}
      />
    </div>
  )
}
