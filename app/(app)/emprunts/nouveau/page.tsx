import { PageHeader } from "@/components/page-header"
import { NouveauPretForm } from "@/components/nouveau-pret-form"
import { getElevesForSelect } from "@/app/actions/eleves"
import { getDureePret } from "@/app/actions/parametres"

export default async function NouveauPretPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const [eleves, dureePret] = await Promise.all([getElevesForSelect(), getDureePret()])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Nouveau prêt"
        description="Scannez le QR code du livre ou saisissez son code, puis choisissez l'élève."
      />
      <NouveauPretForm eleves={eleves} dureePret={dureePret} initialCode={code} />
    </div>
  )
}
