import { PageHeader } from "@/components/page-header"
import { ScanClient } from "@/components/scan-client"

export default function ScanPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Scanner un livre"
        description="Scannez un QR code ou saisissez un code pour ouvrir la fiche, prêter ou enregistrer un retour."
      />
      <ScanClient />
    </div>
  )
}
