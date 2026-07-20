import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { randomUUID } from "node:crypto"
import { sendResetPasswordEmail } from "@/lib/email"
import { contexteActivationAgent } from "@/lib/contexte-activation-agent"
import { contexteBootstrapAdmin } from "@/lib/contexte-bootstrap-admin"
import { publicSignupEnabled } from "@/config/env"
import { assertSignupAllowed } from "@/lib/signup-policy"

const schemaAuth=process.env.DATABASE_SCHEMA??"eblon_bibliotheque"
const authPool=new Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schemaAuth}`})
function separerNom(nomComplet:string){const parties=nomComplet.trim().split(/\s+/).filter(Boolean);return{prenom:parties.shift()??"Utilisateur",nom:parties.join(" ")||"EBLON"}}

export const auth=betterAuth({
 database:authPool,
 onAPIError:{onError:(error)=>console.error(JSON.stringify({niveau:"error",evenement:"erreur_authentification",correlation_id:randomUUID(),type:error instanceof Error?error.name:"inconnu"}))},
 databaseHooks:{user:{create:{
  before:async(userData)=>{
   const email=userData.email.toLowerCase(),activationEmail=contexteActivationAgent.getStore(),bootstrapEmail=contexteBootstrapAdmin.getStore(),activation=activationEmail?.toLowerCase()===email,bootstrap=bootstrapEmail?.toLowerCase()===email
   assertSignupAllowed({email,publicSignupEnabled:publicSignupEnabled(),activationEmail,bootstrapEmail})
   if(!activation&&!bootstrap){const agent=await authPool.query(`SELECT 1 FROM "${schemaAuth}".agents WHERE lower(email)=lower($1)`,[email]);if(agent.rowCount)throw new Error("Activation agent requise")}
   return{data:{...userData,role:bootstrap?"admin":"eleve",statut:"Actif"}}
  },
  after:async(user)=>{
   const nom=separerNom(user.name),email=user.email.toLowerCase(),bootstrap=contexteBootstrapAdmin.getStore()?.toLowerCase()===email
   const agent=await authPool.query(`SELECT id FROM "${schemaAuth}".agents WHERE lower(email)=lower($1)`,[user.email])
   if(agent.rowCount){await authPool.query(`UPDATE "${schemaAuth}".agents SET identifiant_auth_externe=$1,statut='ACTIF',date_modification=current_timestamp WHERE lower(email)=lower($2)`,[user.id,user.email]);return}
   if(bootstrap){await authPool.query(`INSERT INTO "${schemaAuth}".agents(id,identifiant_auth_externe,prenom,nom,email,role,statut) VALUES(gen_random_uuid(),$1,$2,$3,$4,'ADMIN','ACTIF')`,[user.id,nom.prenom,nom.nom,user.email]);return}
   const emprunteur=await authPool.query(`SELECT id FROM "${schemaAuth}".emprunteurs WHERE lower(email)=lower($1)`,[user.email])
   if(emprunteur.rowCount)await authPool.query(`UPDATE "${schemaAuth}".emprunteurs SET identifiant_auth_externe=$1,date_modification=current_timestamp WHERE id=$2`,[user.id,emprunteur.rows[0].id])
   else await authPool.query(`INSERT INTO "${schemaAuth}".emprunteurs(id,numero_emprunteur,prenom,nom,email,identifiant_auth_externe,statut) VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,'EN_ATTENTE')`,[`AUTO-${user.id.slice(0,12).toUpperCase()}`,nom.prenom,nom.nom,user.email,user.id])
  },
 }}},
 baseURL:process.env.BETTER_AUTH_URL,
 secret:process.env.BETTER_AUTH_SECRET,
 emailAndPassword:{enabled:true,autoSignIn:true,sendResetPassword:async({user,url})=>sendResetPasswordEmail(user.email,url),resetPasswordTokenExpiresIn:3600},
 user:{additionalFields:{role:{type:"string",required:false,defaultValue:"eleve",input:false},statut:{type:"string",required:false,defaultValue:"Actif",input:false}}},
 trustedOrigins:["http://localhost:3000",...(process.env.TRUSTED_ORIGINS?.split(",").map(x=>x.trim()).filter(Boolean)??[])],
 session:{expiresIn:604800,updateAge:86400},
})
