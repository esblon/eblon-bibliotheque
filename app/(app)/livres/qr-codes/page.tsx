import Link from "next/link"
import { getLivres } from "@/app/actions/livres"
import { PageHeader } from "@/components/page-header"
import { QrCodesSheet } from "@/components/qr-codes-sheet"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function QrCodesPage() {
  const livres = await getLivres()

  return (
    <div>
      <Button
        render={<Link href="/livres" />}
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 print:hidden"
      >
        <ArrowLeft className="size-4" />
        Retour aux livres
      </Button>
      <div className="print:hidden">
        <PageHeader
          title="Étiquettes QR code"
          description="Imprimez et collez ces étiquettes sur les livres. Chaque QR code encode le code unique du livre."
        />
      </div>
      <QrCodesSheet
        livres={livres.map((l) => ({
          id: l.id,
          codeLivre: l.codeLivre,
          titre: l.titre,
        }))}
      />
    </div>
  )
}
