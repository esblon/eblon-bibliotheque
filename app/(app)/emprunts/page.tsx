import { GestionEmpruntsApi } from "@/components/gestion-emprunts-api"
import { autorisationsFrontend } from "@/lib/frontend-api/autorisation"
import { apiFrontend } from "@/lib/frontend-api/ressources"
export default async function Page(){const [p,e,b,a,o,d]=await Promise.all([apiFrontend.emprunts({limite:100}),apiFrontend.exemplaires({limite:100}),apiFrontend.emprunteurs({limite:100}),apiFrontend.agents({limite:100}),apiFrontend.ouvrages({limite:100}),autorisationsFrontend()]);const evenements=Object.fromEntries(p.donnees.map(x=>[x.id,x.evenements??[]]));return <GestionEmpruntsApi peutModifier={d.peutGererEmprunts} emprunts={p.donnees} exemplaires={e.donnees} emprunteurs={b.donnees} agents={a.donnees} ouvrages={o.donnees} evenements={evenements}/>}
