import { GestionRessource } from "@/components/gestion-ressource"
import { apiFrontend } from "@/lib/frontend-api/ressources"
import { autorisationsFrontend } from "@/lib/frontend-api/autorisation"
export default async function Page(){const [r,d]=await Promise.all([apiFrontend.matieres({limite:100}),autorisationsFrontend()]);return <GestionRessource peutModifier={d.peutModifier} ressource="matieres" titre="Matières" lignes={r.donnees} champs={[{nom:"code",libelle:"Code",requis:true},{nom:"nom",libelle:"Nom",requis:true},{nom:"est_active",libelle:"Active",type:"checkbox"}]}/>}
