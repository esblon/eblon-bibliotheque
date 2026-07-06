import { notFound } from "next/navigation"
import Link from "next/link"
import { getLivre } from "@/app/actions/livres"
import { PageHeader } from "@/components/page-header"
import { LivreForm } from "@/components/livre-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function ModifierLivrePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const livreId = Number(id)
  if (Number.isNaN(livreId)) notFound()

  const livre = await getLivre(livreId)
  if (!livre) notFound()

  return (
    <div>
      <Button
        render={<Link href={`/livres/${livreId}`} />}
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="size-4" />
        Retour à la fiche
      </Button>
      <PageHeader title="Modifier le livre" />
      <LivreForm
        livre={{
          id: livre.id,
          codeLivre: livre.codeLivre,
          titre: livre.titre,
          niveau: livre.niveau,
          matiere: livre.matiere,
          typeLivre: livre.typeLivre,
          edition: livre.edition ?? "",
          etatPhysique: livre.etatPhysique,
          statut: livre.statut,
          localisation: livre.localisation,
          commentaire: livre.commentaire ?? "",
        }}
      />
    </div>
  )
}
