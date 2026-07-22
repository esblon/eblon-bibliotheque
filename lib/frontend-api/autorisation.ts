import { getSessionUser } from "@/lib/session"
import { apiFrontend } from "./ressources"

export async function autorisationsFrontend(){
 const user=await getSessionUser(); if(!user)return{peutLire:false,peutModifier:false,peutGererEmprunts:false,agent:null}
 const agents=await apiFrontend.agents({recherche:user.email,limite:100})
 const agent=agents.donnees.find(a=>a.email.toLowerCase()===user.email.toLowerCase()&&a.statut==="ACTIF")??null
 if(!agent)return{peutLire:false,peutModifier:false,peutGererEmprunts:false,agent:null}
 const roles=await apiFrontend.roles({recherche:agent.role,limite:100}),role=roles.donnees.find(r=>r.code===agent.role&&r.est_actif),base=String(role?.role_base??agent.role)
 return{peutLire:true,peutModifier:["ADMIN","BIBLIOTHECAIRE"].includes(base),peutGererEmprunts:["ADMIN","BIBLIOTHECAIRE","ENSEIGNANT"].includes(base),agent:{...agent,role_base:base}}
}
