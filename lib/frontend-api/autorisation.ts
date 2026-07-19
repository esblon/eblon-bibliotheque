import { getSessionUser } from "@/lib/session"
import { apiFrontend } from "./ressources"

export async function autorisationsFrontend(){
 const user=await getSessionUser(); if(!user)return{peutLire:false,peutModifier:false,peutGererEmprunts:false,agent:null}
 const agents=await apiFrontend.agents({recherche:user.email,limite:100})
 const agent=agents.donnees.find(a=>a.email.toLowerCase()===user.email.toLowerCase()&&a.statut==="ACTIF")??null
 return{peutLire:Boolean(agent),peutModifier:Boolean(agent&&["ADMIN","BIBLIOTHECAIRE"].includes(agent.role)),peutGererEmprunts:Boolean(agent&&["ADMIN","BIBLIOTHECAIRE","ENSEIGNANT"].includes(agent.role)),agent}
}
