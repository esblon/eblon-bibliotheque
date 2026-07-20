import { Pool } from "pg"
import { auth } from "../lib/auth"
import { contexteBootstrapAdmin } from "../lib/contexte-bootstrap-admin"
import { executerBootstrapAdmin, lireBootstrapAdmin } from "../lib/bootstrap-admin"
import { parseServerEnvironment } from "../config/env"

async function main(){
 const input=lireBootstrapAdmin(),env=parseServerEnvironment(),schema=`"${env.DATABASE_SCHEMA}"`,pool=new Pool({connectionString:env.DATABASE_URL,options:`-c search_path=${env.DATABASE_SCHEMA}`})
 try{const resultat=await executerBootstrapAdmin(input,{
  trouverUtilisateur:async email=>(await pool.query(`SELECT id,email FROM "user" WHERE lower(email)=lower($1)`,[email])).rows[0]??null,
  creerUtilisateur:async data=>{const r=await contexteBootstrapAdmin.run(data.email,()=>auth.api.signUpEmail({body:{name:data.name,email:data.email,password:data.password}}));return{id:r.user.id,email:r.user.email}},
  garantirAdministrateur:async(user,name)=>{const parties=name.trim().split(/\s+/),prenom=parties.shift()??"Administrateur",nom=parties.join(" ")||"EBLON";const client=await pool.connect();try{await client.query("BEGIN");await client.query(`UPDATE "user" SET role='admin',statut='Actif',"updatedAt"=current_timestamp WHERE id=$1 AND lower(email)=lower($2)`,[user.id,user.email]);await client.query(`INSERT INTO ${schema}.agents(id,identifiant_auth_externe,prenom,nom,email,role,statut) VALUES(gen_random_uuid(),$1,$2,$3,$4,'ADMIN','ACTIF') ON CONFLICT (email) DO UPDATE SET identifiant_auth_externe=EXCLUDED.identifiant_auth_externe,prenom=EXCLUDED.prenom,nom=EXCLUDED.nom,role='ADMIN',statut='ACTIF',date_modification=current_timestamp`,[user.id,prenom,nom,user.email]);await client.query("COMMIT")}catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}},
 });console.log(resultat.created?"Administrateur bootstrap créé.":"Administrateur bootstrap déjà présent et vérifié.")}
 finally{await pool.end()}
}
main().catch(error=>{console.error(error instanceof Error?`Bootstrap administrateur impossible: ${error.message}`:"Bootstrap administrateur impossible.");process.exitCode=1})
