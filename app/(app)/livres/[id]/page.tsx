import { notFound } from "next/navigation"
import Link from "next/link"
import { getLivre, getLivreEmprunts } from "@/app/actions/livres"
import { getSessionUser } from "@/lib/session"
import { LivreDetail } from "@/components/livre-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function LivrePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const livreId = Number(id)
  if (Number.isNaN(livreId)) notFound()

  const [livre, emprunts, user] = await Promise.all([
    getLivre(livreId),
    getLivreEmprunts(livreId),
    getSessionUser(),
  ])

  if (!livre) notFound()

  return (
    <div>
      <Button
        render={<Link href="/livres" />}
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="size-4" />
        Retour aux livres
      </Button>
      <LivreDetail
        livre={livre}
        emprunts={emprunts}
        isAdmin={user?.role === "admin"}
      />
    </div>
  )
}
