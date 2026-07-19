import Link from "next/link"
import { ArrowLeftRight, BookCheck, BookMarked, Clock, Library, Users } from "lucide-react"
import { apiFrontend } from "@/lib/frontend-api/ressources"
import { getSessionUser } from "@/lib/session"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default async function DashboardPage(){
  const [ouvrages,exemplaires,emprunts,emprunteurs,user]=await Promise.all([
    apiFrontend.ouvrages({limite:100}),apiFrontend.exemplaires({limite:100}),
    apiFrontend.emprunts({limite:100,ordre:"desc"}),apiFrontend.emprunteurs({limite:100}),getSessionUser(),
  ])
  const disponibles=exemplaires.donnees.filter(x=>x.statut==="DISPONIBLE").length
  const empruntes=exemplaires.donnees.filter(x=>x.statut==="EMPRUNTE").length
  const actifs=emprunts.donnees.filter(x=>["ACTIF","EN_RETARD"].includes(x.statut)).length
  const retards=emprunts.donnees.filter(x=>x.statut==="EN_RETARD"||(x.statut==="ACTIF"&&new Date(x.date_echeance)<new Date())).length

  return <div>
    <PageHeader title={`Bonjour, ${user?.name?.split(" ")[0]??""}`} description="Données réelles de la bibliothèque." action={<Button render={<Link href="/emprunts"/>}>Gérer les prêts</Button>}/>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Ouvrages" value={ouvrages.meta.total??ouvrages.donnees.length} icon={Library}/>
      <StatCard label="Exemplaires" value={exemplaires.meta.total??exemplaires.donnees.length} icon={BookMarked}/>
      <StatCard label="Disponibles" value={disponibles} icon={BookCheck}/>
      <StatCard label="Empruntés" value={empruntes} icon={ArrowLeftRight}/>
      <StatCard label="Prêts actifs" value={actifs} icon={ArrowLeftRight}/>
      <StatCard label="En retard" value={retards} icon={Clock}/>
      <StatCard label="Emprunteurs actifs" value={emprunteurs.donnees.filter(x=>x.statut==="ACTIF").length} icon={Users}/>
    </section>
    <Card className="mt-6 p-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold">Derniers prêts</h2><Button render={<Link href="/emprunts"/>} variant="ghost" size="sm">Tout voir</Button></div>
      {emprunts.donnees.length===0?<p className="py-6 text-sm text-muted-foreground">Aucun emprunt enregistré.</p>:<ul className="mt-3 divide-y">{emprunts.donnees.slice(0,6).map(e=>{
        const exemplaire=exemplaires.donnees.find(x=>x.id===e.exemplaire_id)
        const ouvrage=ouvrages.donnees.find(x=>x.id===exemplaire?.ouvrage_id)
        const emprunteur=emprunteurs.donnees.find(x=>x.id===e.emprunteur_id)
        return <li key={e.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="truncate text-sm font-medium">{ouvrage?.titre??"Ouvrage non identifié"}</p><p className="truncate text-xs text-muted-foreground">{exemplaire?.code_inventaire??"Code inconnu"} · {emprunteur?`${emprunteur.prenom} ${emprunteur.nom}`:"Emprunteur inconnu"} · {new Date(e.date_emprunt).toLocaleDateString("fr-FR")}</p></div>
          <Badge variant="outline" className="w-fit">{e.statut.replaceAll("_"," ")}</Badge>
        </li>
      })}</ul>}
    </Card>
  </div>
}
