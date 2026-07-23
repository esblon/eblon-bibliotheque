import { GestionRessource, type ChampGestion } from "@/components/gestion-ressource"
import { autorisationsFrontend } from "@/lib/frontend-api/autorisation"
import { apiFrontend } from "@/lib/frontend-api/ressources"
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){
 const params=await searchParams
 const page=Math.max(1,Number.parseInt(params.page??"1",10)||1),limite=50
 const[e,n,d]=await Promise.all([apiFrontend.emprunteurs({page,limite,tri:"date_creation",ordre:"desc"}),apiFrontend.niveaux({limite:100}),autorisationsFrontend()])
 const champs:ChampGestion[]=[{nom:"numero_emprunteur",libelle:"Numéro",requis:true},{nom:"prenom",libelle:"Prénom",requis:true},{nom:"nom",libelle:"Nom",requis:true},{nom:"email",libelle:"Email",type:"email"},{nom:"telephone",libelle:"Téléphone"},{nom:"niveau_scolaire_id",libelle:"Niveau scolaire",type:"select",options:n.donnees.map(x=>({valeur:x.id,libelle:x.nom}))},{nom:"classe",libelle:"Classe"},{nom:"etablissement",libelle:"Établissement"},{nom:"statut",libelle:"Statut",type:"select",options:[{valeur:"EN_ATTENTE",libelle:"En attente"},{valeur:"ACTIF",libelle:"Actif"},{valeur:"SUSPENDU",libelle:"Suspendu"},{valeur:"ARCHIVE",libelle:"Archivé"}]}]
 return <GestionRessource peutModifier={d.peutModifier} ressource="emprunteurs" titre="Emprunteurs" lignes={e.donnees} champs={champs} pagination={{page:e.meta.page??page,limite:e.meta.limite??limite,total:e.meta.total??e.donnees.length,nombrePages:e.meta.nombre_pages??1,baseUrl:"/emprunteurs"}}/>
}
