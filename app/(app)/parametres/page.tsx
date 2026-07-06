import { PageHeader } from "@/components/page-header"
import { ParametresForm } from "@/components/parametres-form"
import { UtilisateursCard } from "@/components/utilisateurs-card"
import { getParametres } from "@/app/actions/parametres"
import { getSessionUser } from "@/lib/session"
import { getUtilisateurs } from "@/app/actions/utilisateurs"

export default async function ParametresPage() {
  const user = await getSessionUser()
  const isAdmin = user?.role === "admin"
  const [values, utilisateurs] = await Promise.all([
    getParametres(),
    isAdmin ? getUtilisateurs() : Promise.resolve([]),
  ])

  return (
    <div className="grid gap-6">
      <PageHeader title="Paramètres" description="Configuration de la bibliothèque." />
      <ParametresForm values={values} />
      {isAdmin && <UtilisateursCard utilisateurs={utilisateurs} currentUserId={user!.id} />}
    </div>
  )
}
