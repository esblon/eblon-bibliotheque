"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { apiFrontend } from "@/lib/frontend-api/ressources"
import { messageErreur } from "@/lib/frontend-api/erreurs"
import { schemasFormulaires,type RessourceEditable } from "@/lib/frontend-api/validation"
import type { Agent,Emprunt } from "@/lib/frontend-api/types"
import { inviterAgent } from "@/lib/invitations-agents"
import { emailEnabled } from "@/config/env"

export type EtatAction={succes:boolean;message:string;avertissement?:boolean;erreurs?:Record<string,string[]>}
export async function envoyerInvitationAgent(id:string):Promise<EtatAction>{if(!emailEnabled())return{succes:false,message:"L’envoi d’e-mails est désactivé pour cet environnement."};try{const agent=await apiFrontend.detail<Agent>("agents",id);if(agent.donnees.identifiant_auth_externe)return{succes:false,message:"Cet agent possède déjà un compte actif."};await inviterAgent(agent.donnees);return{succes:true,message:"Invitation envoyée."}}catch(e){return{succes:false,message:messageErreur(e)}}}
export async function enregistrerRessource(ressource:RessourceEditable,id:string|null,valeurs:unknown):Promise<EtatAction>{
 const resultat=schemasFormulaires[ressource].safeParse(valeurs)
 if(!resultat.success)return{succes:false,message:"Corrigez les champs indiqués.",erreurs:resultat.error.flatten().fieldErrors as Record<string,string[]>}
 try{
  if(id)await apiFrontend.modifier(ressource,id,resultat.data)
  else{
   const cree=await apiFrontend.creer<Agent>(ressource,resultat.data)
   revalidatePath(`/${ressource}`);revalidatePath("/")
   if(ressource==="agents"&&emailEnabled()){
    try{await inviterAgent(cree.donnees)}
    catch(error){return{succes:true,avertissement:true,message:`Agent créé, mais ${messageErreur(error)} Utilisez « Envoyer l’invitation » pour réessayer.`}}
   }
  }
  revalidatePath(`/${ressource}`);revalidatePath("/")
  return{succes:true,message:id?"Modification enregistrée.":ressource==="agents"?(emailEnabled()?"Agent créé et invitation envoyée.":"Agent créé. L’envoi d’e-mails est désactivé."):"Création enregistrée."}
 }catch(error){return{succes:false,message:messageErreur(error)}}
}
const schemaPret=z.object({exemplaire_id:z.string().uuid(),emprunteur_id:z.string().uuid(),agent_preteur_id:z.string().uuid(),date_echeance:z.string().datetime(),observations:z.string().max(2000).nullable().optional()})
export async function creerPret(valeurs:unknown):Promise<EtatAction>{const r=schemaPret.safeParse(valeurs);if(!r.success)return{succes:false,message:"Les informations du prêt sont invalides.",erreurs:z.flattenError(r.error).fieldErrors};try{await apiFrontend.creer<Emprunt>("emprunts",r.data);revalidatePath("/emprunts");revalidatePath("/exemplaires");revalidatePath("/");return{succes:true,message:"Le prêt a été créé."}}catch(e){return{succes:false,message:messageErreur(e)}}}
export async function actionPret(id:string,action:"retour"|"prolongation"|"marquer-en-retard"|"marquer-perdu"|"annulation",valeurs:unknown):Promise<EtatAction>{try{await apiFrontend.actionEmprunt(id,action,valeurs);revalidatePath("/emprunts");revalidatePath("/exemplaires");revalidatePath("/");return{succes:true,message:"L’opération a été enregistrée."}}catch(e){return{succes:false,message:messageErreur(e)}}}
