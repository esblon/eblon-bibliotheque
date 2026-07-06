import Link from "next/link"
import { getLivres } from "@/app/actions/livres"
import { PageHeader } from "@/components/page-header"
import { LivresTable } from "@/components/livres-table"
import { Button } from "@/components/ui/button"
import { Plus, QrCode } from "lucide-react"

export default async function LivresPage() {
  const livres = await getLivres()

  return (
    <div>
      <PageHeader
        title="Livres"
        description="Gérez le catalogue des annales et manuels."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/livres/qr-codes">
                <QrCode className="size-4" />
                QR codes
              </Link>
            </Button>
            <Button asChild>
              <Link href="/livres/nouveau">
                <Plus className="size-4" />
                Ajouter
              </Link>
            </Button>
          </div>
        }
      />
      <LivresTable livres={livres} />
    </div>
  )
}
