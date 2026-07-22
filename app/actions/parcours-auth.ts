"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { parseServerEnvironment } from "@/config/env"
import { utiliserInvitation, verifierInvitation } from "@/lib/invitations-agents"
import { contexteActivationAgent } from "@/lib/contexte-activation-agent"

const schema=()=>`"${parseServerEnvironment().DATABASE_SCHEMA}"`

export async function destinationApresConnexion(){
 const session=await auth.api.getSession({headers:await headers()});if(!session?.user)return"/sign-in"
 const agent=await pool.query(`SELECT 1 FROM ${schema()}.agents WHERE identifiant_auth_externe=$1 AND statut='ACTIF'`,[session.user.id])
 return agent.rowCount?"/":"/espace-eleve"
}

export async function activerCompteAgent(jeton:string,motDePasse:string){
 const invitation=await verifierInvitation(jeton);if(!invitation)return{succes:false,message:"Invitation invalide ou expirée."}
 if(motDePasse.length<8)return{succes:false,message:"Le mot de passe doit contenir au moins 8 caractères."}
 try{await contexteActivationAgent.run(invitation.email,()=>auth.api.signUpEmail({body:{name:`${invitation.prenom} ${invitation.nom}`,email:invitation.email,password:motDePasse}}));await utiliserInvitation(invitation.id);return{succes:true,message:"Votre accès agent est activé. Vous pouvez vous connecter."}}catch{return{succes:false,message:"Activation impossible. Ce compte est peut-être déjà activé."}}
}

export async function completerInscriptionEleve(valeurs:{niveau_scolaire_id:string;classe_scolaire_id:string;etablissement_id:string}){
 const session=await auth.api.getSession({headers:await headers()});if(!session?.user)return{succes:false,message:"Session introuvable."}
 const reference=await pool.query<{classe:string;etablissement:string}>(`SELECT c.nom classe,e.nom etablissement FROM ${schema()}.classes_scolaires c JOIN ${schema()}.niveaux_scolaires n ON n.id=c.niveau_scolaire_id JOIN ${schema()}.etablissements e ON e.id=$3 AND e.est_actif WHERE c.id=$2 AND c.niveau_scolaire_id=$1 AND c.est_active AND n.est_actif`,[valeurs.niveau_scolaire_id,valeurs.classe_scolaire_id,valeurs.etablissement_id]);if(!reference.rowCount)return{succes:false,message:"Niveau, classe ou établissement invalide."}
 const {classe,etablissement}=reference.rows[0]
 const r=await pool.query(`UPDATE ${schema()}.emprunteurs SET niveau_scolaire_id=$2,classe_scolaire_id=$3,etablissement_id=$4,classe=$5,etablissement=$6,statut='ACTIF',date_modification=current_timestamp WHERE identifiant_auth_externe=$1 RETURNING id`,[session.user.id,valeurs.niveau_scolaire_id,valeurs.classe_scolaire_id,valeurs.etablissement_id,classe,etablissement])
 return r.rowCount?{succes:true,message:"Votre espace élève est activé."}:{succes:false,message:"Profil élève introuvable."}
}
